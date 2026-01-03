# Plugin Dependencies Guide

This guide covers plugin dependency patterns in Skeleton Crew Runtime v0.2.0, including best practices, common patterns, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [Basic Dependency Declaration](#basic-dependency-declaration)
- [Common Dependency Patterns](#common-dependency-patterns)
- [Dependency Resolution](#dependency-resolution)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Advanced Patterns](#advanced-patterns)

## Overview

Plugin dependencies in v0.2.0 allow you to:

- **Declare explicit dependencies** between plugins
- **Ensure initialization order** automatically
- **Prevent initialization errors** from missing dependencies
- **Create modular architectures** with clear boundaries

## Basic Dependency Declaration

### Simple Dependencies

```typescript
interface AppConfig {
  database: { url: string };
  cache: { ttl: number };
}

// Base plugin - no dependencies
const configPlugin: PluginDefinition<AppConfig> = {
  name: 'config',
  version: '1.0.0',
  setup(ctx) {
    ctx.logger.info('Config loaded');
  }
};

// Dependent plugin
const databasePlugin: PluginDefinition<AppConfig> = {
  name: 'database',
  version: '1.0.0',
  dependencies: ['config'], // ✅ Will initialize after 'config'
  setup(ctx) {
    const { database } = ctx.config;
    ctx.logger.info(`Connecting to ${database.url}`);
  }
};
```

### Multiple Dependencies

```typescript
const apiPlugin: PluginDefinition<AppConfig> = {
  name: 'api',
  version: '1.0.0',
  dependencies: ['config', 'database', 'cache'], // ✅ Multiple dependencies
  setup(ctx) {
    ctx.logger.info('API plugin initialized with all dependencies');
  }
};
```

## Common Dependency Patterns

### 1. Layered Architecture Pattern

```typescript
// Layer 1: Foundation (no dependencies)
const configPlugin: PluginDefinition<AppConfig> = {
  name: 'config',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'config:get',
      handler: (key: string) => {
        // Return config value
        return (ctx.config as any)[key];
      }
    });
  }
};

const loggerPlugin: PluginDefinition<AppConfig> = {
  name: 'logger',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'log:info',
      handler: (message: string) => {
        ctx.logger.info(message);
      }
    });
  }
};

// Layer 2: Infrastructure (depends on foundation)
const databasePlugin: PluginDefinition<AppConfig> = {
  name: 'database',
  version: '1.0.0',
  dependencies: ['config', 'logger'],
  setup(ctx) {
    const { database } = ctx.config;
    
    ctx.actions.registerAction({
      id: 'db:query',
      handler: async (sql: string) => {
        await ctx.actions.runAction('log:info', `Executing: ${sql}`);
        // Database query logic
        return [];
      }
    });
  }
};

const cachePlugin: PluginDefinition<AppConfig> = {
  name: 'cache',
  version: '1.0.0',
  dependencies: ['config', 'logger'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'cache:get',
      handler: async (key: string) => {
        await ctx.actions.runAction('log:info', `Cache get: ${key}`);
        // Cache logic
        return null;
      }
    });
  }
};

// Layer 3: Business Logic (depends on infrastructure)
const userServicePlugin: PluginDefinition<AppConfig> = {
  name: 'user-service',
  version: '1.0.0',
  dependencies: ['database', 'cache'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'users:get',
      handler: async (userId: string) => {
        // Try cache first
        const cached = await ctx.actions.runAction('cache:get', `user:${userId}`);
        if (cached) return cached;
        
        // Query database
        const user = await ctx.actions.runAction('db:query', `SELECT * FROM users WHERE id = '${userId}'`);
        return user;
      }
    });
  }
};

// Layer 4: API/UI (depends on business logic)
const apiPlugin: PluginDefinition<AppConfig> = {
  name: 'api',
  version: '1.0.0',
  dependencies: ['user-service'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'api:getUser',
      handler: async (userId: string) => {
        return await ctx.actions.runAction('users:get', userId);
      }
    });
  }
};
```

### 2. Feature Module Pattern

```typescript
// Core feature
const authCorePlugin: PluginDefinition<AppConfig> = {
  name: 'auth-core',
  version: '1.0.0',
  dependencies: ['database'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'auth:validate',
      handler: async (token: string) => {
        // Core auth validation
        return { valid: true, userId: '123' };
      }
    });
  }
};

// Feature extensions
const authSessionPlugin: PluginDefinition<AppConfig> = {
  name: 'auth-session',
  version: '1.0.0',
  dependencies: ['auth-core', 'cache'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'auth:createSession',
      handler: async (userId: string) => {
        // Session management
        return { sessionId: 'session-123' };
      }
    });
  }
};

const authPermissionsPlugin: PluginDefinition<AppConfig> = {
  name: 'auth-permissions',
  version: '1.0.0',
  dependencies: ['auth-core'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'auth:checkPermission',
      handler: async (userId: string, permission: string) => {
        // Permission checking
        return true;
      }
    });
  }
};
```

### 3. Provider Pattern

```typescript
// Abstract provider interface
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Provider implementations
const smtpEmailPlugin: PluginDefinition<AppConfig> = {
  name: 'email-smtp',
  version: '1.0.0',
  dependencies: ['config'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'email:send',
      handler: async (params: { to: string; subject: string; body: string }) => {
        // SMTP implementation
        ctx.logger.info(`Sending email via SMTP to ${params.to}`);
      }
    });
  }
};

const sendgridEmailPlugin: PluginDefinition<AppConfig> = {
  name: 'email-sendgrid',
  version: '1.0.0',
  dependencies: ['config'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'email:send',
      handler: async (params: { to: string; subject: string; body: string }) => {
        // SendGrid implementation
        ctx.logger.info(`Sending email via SendGrid to ${params.to}`);
      }
    });
  }
};

// Consumer doesn't care about implementation
const notificationPlugin: PluginDefinition<AppConfig> = {
  name: 'notifications',
  version: '1.0.0',
  dependencies: ['email-smtp'], // or 'email-sendgrid'
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'notify:welcome',
      handler: async (email: string) => {
        await ctx.actions.runAction('email:send', {
          to: email,
          subject: 'Welcome!',
          body: 'Welcome to our app!'
        });
      }
    });
  }
};
```

## Dependency Resolution

### Resolution Algorithm

1. **Build dependency graph** from all registered plugins
2. **Detect circular dependencies** and throw error if found
3. **Topological sort** to determine initialization order
4. **Initialize plugins** in dependency order
5. **Track initialized plugins** for validation

### Example Resolution

```typescript
// Registration order (doesn't matter)
runtime.registerPlugin(apiPlugin);        // depends: ['user-service']
runtime.registerPlugin(userServicePlugin); // depends: ['database', 'cache']
runtime.registerPlugin(cachePlugin);      // depends: ['config']
runtime.registerPlugin(configPlugin);     // depends: []
runtime.registerPlugin(databasePlugin);   // depends: ['config']

// Resolved initialization order:
// 1. config (no dependencies)
// 2. cache, database (depend on config)
// 3. user-service (depends on database, cache)
// 4. api (depends on user-service)
```

### Circular Dependency Detection

```typescript
const pluginA: PluginDefinition<AppConfig> = {
  name: 'plugin-a',
  version: '1.0.0',
  dependencies: ['plugin-b'], // ❌ Circular dependency
  setup(ctx) {}
};

const pluginB: PluginDefinition<AppConfig> = {
  name: 'plugin-b',
  version: '1.0.0',
  dependencies: ['plugin-a'], // ❌ Circular dependency
  setup(ctx) {}
};

runtime.registerPlugin(pluginA);
runtime.registerPlugin(pluginB);

// ❌ Throws error during initialize()
await runtime.initialize(); // Error: Circular dependency detected: plugin-a → plugin-b → plugin-a
```

## Best Practices

### 1. Keep Dependencies Minimal

```typescript
// ❌ Bad - too many dependencies
const badPlugin: PluginDefinition<AppConfig> = {
  name: 'bad-plugin',
  version: '1.0.0',
  dependencies: ['config', 'database', 'cache', 'logger', 'auth', 'email', 'storage'],
  setup(ctx) {
    // This plugin is doing too much
  }
};

// ✅ Good - focused dependencies
const goodPlugin: PluginDefinition<AppConfig> = {
  name: 'user-service',
  version: '1.0.0',
  dependencies: ['database'], // Only what's actually needed
  setup(ctx) {
    // Focused on user management
  }
};
```

### 2. Use Semantic Naming

```typescript
// ✅ Good - clear semantic names
const plugins = [
  'config',           // Configuration management
  'database',         // Database connection
  'cache',           // Caching layer
  'auth-core',       // Core authentication
  'auth-session',    // Session management
  'user-service',    // User business logic
  'api-routes'       // HTTP API endpoints
];
```

### 3. Group Related Functionality

```typescript
// ✅ Good - related plugins with clear boundaries
const authPlugins = [
  'auth-core',        // Core auth logic
  'auth-jwt',         // JWT token handling
  'auth-session',     // Session management
  'auth-permissions'  // Permission checking
];

const dataPlugins = [
  'database',         // Database connection
  'cache',           // Caching layer
  'search',          // Search indexing
  'backup'           // Data backup
];
```

### 4. Avoid Deep Dependency Chains

```typescript
// ❌ Bad - deep chain (hard to understand and maintain)
// config → database → user-repo → user-service → user-controller → api-routes

// ✅ Good - flatter structure
// config → database, cache
// database, cache → user-service
// user-service → api-routes
```

### 5. Use Events for Loose Coupling

```typescript
// Instead of direct dependencies, use events for loose coupling
const userPlugin: PluginDefinition<AppConfig> = {
  name: 'user',
  version: '1.0.0',
  dependencies: ['database'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'users:create',
      handler: async (userData: any) => {
        const user = await createUser(userData);
        
        // ✅ Emit event instead of calling other plugins directly
        ctx.events.emit('user:created', user);
        
        return user;
      }
    });
  }
};

const emailPlugin: PluginDefinition<AppConfig> = {
  name: 'email',
  version: '1.0.0',
  dependencies: [], // ✅ No direct dependency on user plugin
  setup(ctx) {
    // ✅ Listen for events instead
    ctx.events.on('user:created', async (user) => {
      await sendWelcomeEmail(user.email);
    });
  }
};
```

## Troubleshooting

### Common Errors

#### 1. Missing Dependency

```typescript
// Error: Plugin "api" requires dependency "database" to be initialized first
```

**Solution:** Register the missing plugin or remove the dependency.

#### 2. Circular Dependency

```typescript
// Error: Circular dependency detected: plugin-a → plugin-b → plugin-a
```

**Solution:** Refactor to remove circular reference, often by using events.

#### 3. Typo in Dependency Name

```typescript
const plugin: PluginDefinition<AppConfig> = {
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['databse'], // ❌ Typo: should be 'database'
  setup(ctx) {}
};
```

**Solution:** Fix the typo in the dependency name.

### Debugging Dependencies

```typescript
// Use introspection to debug dependency issues
const runtime = new Runtime<AppConfig>({ config: myConfig });

// Register plugins...
await runtime.initialize();

const ctx = runtime.getContext();

// Check what plugins are registered
console.log('Registered plugins:', ctx.introspect.listPlugins());

// Check initialization order
console.log('Initialized plugins:', ctx.plugins.getInitializedPlugins());

// Check specific plugin
const pluginMeta = ctx.introspect.getPluginDefinition('my-plugin');
console.log('Plugin metadata:', pluginMeta);
```

## Advanced Patterns

### 1. Optional Dependencies

```typescript
// Plugin works with or without optional dependencies
const analyticsPlugin: PluginDefinition<AppConfig> = {
  name: 'analytics',
  version: '1.0.0',
  dependencies: [], // No hard dependencies
  setup(ctx) {
    // Check if optional dependencies are available
    const hasDatabase = ctx.plugins.getPlugin('database') !== null;
    const hasCache = ctx.plugins.getPlugin('cache') !== null;
    
    ctx.actions.registerAction({
      id: 'analytics:track',
      handler: async (event: string, data: any) => {
        // Always log to console
        ctx.logger.info(`Analytics: ${event}`, data);
        
        // Optionally persist to database
        if (hasDatabase) {
          await ctx.actions.runAction('db:insert', {
            table: 'analytics',
            data: { event, data, timestamp: new Date() }
          });
        }
        
        // Optionally cache recent events
        if (hasCache) {
          await ctx.actions.runAction('cache:set', {
            key: `analytics:recent:${event}`,
            value: data,
            ttl: 300
          });
        }
      }
    });
  }
};
```

### 2. Plugin Factories

```typescript
// Factory function for creating similar plugins
function createServicePlugin<T>(
  name: string,
  dependencies: string[],
  serviceFactory: (ctx: RuntimeContext<AppConfig>) => T
): PluginDefinition<AppConfig> {
  return {
    name,
    version: '1.0.0',
    dependencies,
    setup(ctx) {
      const service = serviceFactory(ctx);
      
      ctx.actions.registerAction({
        id: `${name}:execute`,
        handler: async (params: any) => {
          return await (service as any).execute(params);
        }
      });
    }
  };
}

// Use factory to create plugins
const userServicePlugin = createServicePlugin(
  'user-service',
  ['database'],
  (ctx) => new UserService(ctx)
);

const orderServicePlugin = createServicePlugin(
  'order-service',
  ['database', 'user-service'],
  (ctx) => new OrderService(ctx)
);
```

### 3. Dynamic Plugin Loading

```typescript
// Load plugins based on configuration
async function loadPlugins(runtime: Runtime<AppConfig>, config: AppConfig) {
  // Always load core plugins
  runtime.registerPlugin(configPlugin);
  runtime.registerPlugin(databasePlugin);
  
  // Conditionally load feature plugins
  if (config.features.authentication) {
    runtime.registerPlugin(authPlugin);
  }
  
  if (config.features.caching) {
    runtime.registerPlugin(cachePlugin);
  }
  
  if (config.features.analytics) {
    runtime.registerPlugin(analyticsPlugin);
  }
  
  // Load environment-specific plugins
  if (config.environment === 'development') {
    runtime.registerPlugin(debugPlugin);
  }
  
  if (config.environment === 'production') {
    runtime.registerPlugin(monitoringPlugin);
  }
}
```

## Summary

Plugin dependencies in v0.2.0 provide:

- **Explicit dependency declaration** for clear plugin relationships
- **Automatic initialization ordering** to prevent setup errors
- **Circular dependency detection** to catch design issues early
- **Flexible patterns** for different architectural needs

**Key Takeaways:**
- Keep dependencies minimal and focused
- Use semantic naming for clarity
- Prefer events over direct dependencies for loose coupling
- Use introspection API for debugging dependency issues
- Consider optional dependencies for flexible plugins

For more examples, see the [API Reference](../api/reference.md) and [Examples](../../examples/).