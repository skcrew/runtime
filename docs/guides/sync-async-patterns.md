# Sync vs Async Access Patterns

This guide covers the differences between synchronous and asynchronous access patterns in Skeleton Crew Runtime v0.2.0, with practical examples and best practices.

## Table of Contents

- [Overview](#overview)
- [Configuration Access](#configuration-access)
- [Action Execution](#action-execution)
- [Event Handling](#event-handling)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Migration from v0.1.x](#migration-from-v01x)

## Overview

Skeleton Crew Runtime v0.2.0 provides both synchronous and asynchronous access patterns depending on the operation:

- **Synchronous**: Configuration access, event emission, plugin metadata
- **Asynchronous**: Action execution, async event emission, plugin lifecycle

## Configuration Access

### v0.2.0: Synchronous Config Access

Configuration is available synchronously throughout the plugin lifecycle:

```typescript
interface AppConfig {
  database: {
    url: string;
    maxConnections: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    caching: boolean;
    analytics: boolean;
  };
}

const myPlugin: PluginDefinition<AppConfig> = {
  name: 'my-plugin',
  version: '1.0.0',
  setup(ctx: RuntimeContext<AppConfig>) {
    // ✅ Synchronous access - always available
    const { database, api, features } = ctx.config;
    
    // ✅ Use config immediately in setup
    if (features.caching) {
      initializeCache();
    }
    
    // ✅ Use config in action handlers
    ctx.actions.registerAction({
      id: 'api:request',
      handler: async (endpoint: string) => {
        // ✅ Config available synchronously in handlers
        const { baseUrl, timeout } = ctx.config.api;
        
        return await fetch(`${baseUrl}${endpoint}`, {
          timeout: timeout
        });
      }
    });
    
    // ✅ Use config in event handlers
    ctx.events.on('database:error', (error) => {
      // ✅ Config available synchronously in event handlers
      ctx.logger.error(`Database error (${ctx.config.database.url}):`, error);
    });
  }
};
```

### Comparison with v0.1.x Host Context

```typescript
// v0.1.x - Async host context access
const oldPlugin = {
  name: 'old-plugin',
  version: '1.0.0',
  setup(ctx) {
    // ❌ Required casting and potential runtime errors
    const config = (ctx.host.config as any);
    
    ctx.actions.registerAction({
      id: 'old:action',
      handler: async () => {
        // ❌ No type safety, runtime errors possible
        const url = (ctx.host.config as any).apiUrl;
        return await fetch(url);
      }
    });
  }
};

// v0.2.0 - Sync typed config access
const newPlugin: PluginDefinition<AppConfig> = {
  name: 'new-plugin',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Fully typed, compile-time validation
    const { api } = ctx.config;
    
    ctx.actions.registerAction({
      id: 'new:action',
      handler: async () => {
        // ✅ Type-safe, IDE autocomplete
        return await fetch(ctx.config.api.baseUrl);
      }
    });
  }
};
```

## Action Execution

### Asynchronous Action Execution

All action execution is asynchronous, even for synchronous handlers:

```typescript
const actionPlugin: PluginDefinition<AppConfig> = {
  name: 'actions',
  version: '1.0.0',
  setup(ctx) {
    // Synchronous handler
    ctx.actions.registerAction({
      id: 'sync:action',
      handler: (data: string) => {
        // ✅ Synchronous logic
        return data.toUpperCase();
      }
    });
    
    // Asynchronous handler
    ctx.actions.registerAction({
      id: 'async:action',
      handler: async (url: string) => {
        // ✅ Asynchronous logic
        const response = await fetch(url);
        return await response.json();
      }
    });
    
    // Mixed usage
    ctx.actions.registerAction({
      id: 'mixed:action',
      handler: async (params: { sync: string; async: string }) => {
        // ✅ Sync config access
        const { api } = ctx.config;
        
        // ✅ Sync action call (but awaited)
        const syncResult = await ctx.actions.runAction('sync:action', params.sync);
        
        // ✅ Async action call
        const asyncResult = await ctx.actions.runAction('async:action', params.async);
        
        return { syncResult, asyncResult };
      }
    });
  }
};
```

### Action Execution Patterns

```typescript
const consumerPlugin: PluginDefinition<AppConfig> = {
  name: 'consumer',
  version: '1.0.0',
  dependencies: ['actions'],
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'consumer:process',
      handler: async () => {
        // ✅ Sequential execution
        const result1 = await ctx.actions.runAction('sync:action', 'hello');
        const result2 = await ctx.actions.runAction('async:action', 'https://api.example.com');
        
        // ✅ Parallel execution
        const [parallel1, parallel2] = await Promise.all([
          ctx.actions.runAction('sync:action', 'world'),
          ctx.actions.runAction('async:action', 'https://api2.example.com')
        ]);
        
        // ✅ Error handling
        try {
          const result = await ctx.actions.runAction('risky:action', {});
        } catch (error) {
          ctx.logger.error('Action failed:', error);
          // Handle error appropriately
        }
        
        return { result1, result2, parallel1, parallel2 };
      }
    });
  }
};
```

## Event Handling

### Synchronous vs Asynchronous Events

```typescript
const eventPlugin: PluginDefinition<AppConfig> = {
  name: 'events',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Synchronous event emission
    ctx.actions.registerAction({
      id: 'emit:sync',
      handler: (data: any) => {
        // Emits immediately, doesn't wait for handlers
        ctx.events.emit('data:processed', data);
        
        // ✅ Config available synchronously
        ctx.logger.info(`Event emitted from ${ctx.config.api.baseUrl}`);
        
        return 'Event emitted';
      }
    });
    
    // ✅ Asynchronous event emission
    ctx.actions.registerAction({
      id: 'emit:async',
      handler: async (data: any) => {
        // Waits for all handlers to complete
        await ctx.events.emitAsync('data:processed:async', data);
        
        return 'All handlers completed';
      }
    });
    
    // ✅ Event handlers can be sync or async
    ctx.events.on('data:processed', (data) => {
      // Synchronous handler
      ctx.logger.info('Sync handler:', data);
    });
    
    ctx.events.on('data:processed:async', async (data) => {
      // Asynchronous handler
      await processDataAsync(data);
      ctx.logger.info('Async handler completed:', data);
    });
  }
};
```

### Event Handler Patterns

```typescript
const handlerPlugin: PluginDefinition<AppConfig> = {
  name: 'handlers',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Immediate response handler
    ctx.events.on('user:login', (user) => {
      // ✅ Sync config access
      if (ctx.config.features.analytics) {
        ctx.logger.info(`User logged in: ${user.id}`);
      }
    });
    
    // ✅ Async processing handler
    ctx.events.on('user:login', async (user) => {
      try {
        // ✅ Async action execution
        await ctx.actions.runAction('analytics:track', {
          event: 'login',
          userId: user.id
        });
        
        await ctx.actions.runAction('email:send', {
          to: user.email,
          template: 'login-notification'
        });
      } catch (error) {
        ctx.logger.error('Login processing failed:', error);
      }
    });
    
    // ✅ Error handling in event handlers
    ctx.events.on('critical:error', async (error) => {
      try {
        // ✅ Config available for error handling
        if (ctx.config.features.alerting) {
          await ctx.actions.runAction('alerts:send', {
            level: 'critical',
            message: error.message
          });
        }
      } catch (alertError) {
        // Don't let alert failures break the system
        ctx.logger.error('Alert failed:', alertError);
      }
    });
  }
};
```

## Plugin Lifecycle

### Setup and Dispose Patterns

```typescript
const lifecyclePlugin: PluginDefinition<AppConfig> = {
  name: 'lifecycle',
  version: '1.0.0',
  dependencies: ['database'],
  
  // ✅ Setup can be sync or async
  async setup(ctx: RuntimeContext<AppConfig>) {
    // ✅ Sync config access during setup
    const { database } = ctx.config;
    
    // ✅ Async initialization
    const connection = await createDatabaseConnection(database.url);
    
    // ✅ Store connection for later use
    let dbConnection = connection;
    
    ctx.actions.registerAction({
      id: 'db:query',
      handler: async (sql: string) => {
        // ✅ Use initialized connection
        return await dbConnection.query(sql);
      }
    });
    
    // ✅ Setup event handlers
    ctx.events.on('app:shutdown', async () => {
      await dbConnection.close();
    });
    
    ctx.logger.info('Database plugin initialized');
  },
  
  // ✅ Dispose can be sync or async
  async dispose(ctx: RuntimeContext<AppConfig>) {
    // ✅ Async cleanup
    await cleanupResources();
    
    // ✅ Sync config access during dispose
    ctx.logger.info(`Disposing plugin for ${ctx.config.database.url}`);
  }
};
```

### Initialization Order with Dependencies

```typescript
// Plugin initialization is always async due to dependencies
const dependentPlugin: PluginDefinition<AppConfig> = {
  name: 'dependent',
  version: '1.0.0',
  dependencies: ['database', 'cache'],
  
  setup(ctx) {
    // ✅ Dependencies are guaranteed to be initialized
    // ✅ Config is immediately available
    const { features } = ctx.config;
    
    ctx.actions.registerAction({
      id: 'dependent:action',
      handler: async () => {
        // ✅ Can safely call dependency actions
        const dbResult = await ctx.actions.runAction('db:query', 'SELECT 1');
        const cacheResult = await ctx.actions.runAction('cache:get', 'key');
        
        return { dbResult, cacheResult };
      }
    });
  }
};
```

## Best Practices

### 1. Use Sync Access for Configuration

```typescript
// ✅ Good - sync config access
const goodPlugin: PluginDefinition<AppConfig> = {
  name: 'good',
  version: '1.0.0',
  setup(ctx) {
    const { api } = ctx.config; // ✅ Immediate access
    
    ctx.actions.registerAction({
      id: 'api:call',
      handler: async (endpoint: string) => {
        // ✅ Config always available
        return await fetch(`${ctx.config.api.baseUrl}${endpoint}`);
      }
    });
  }
};

// ❌ Bad - unnecessary async config access
const badPlugin: PluginDefinition<AppConfig> = {
  name: 'bad',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'api:call',
      handler: async (endpoint: string) => {
        // ❌ Unnecessary - config is sync
        const config = await Promise.resolve(ctx.config);
        return await fetch(`${config.api.baseUrl}${endpoint}`);
      }
    });
  }
};
```

### 2. Handle Async Operations Properly

```typescript
const asyncPlugin: PluginDefinition<AppConfig> = {
  name: 'async',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'process:data',
      handler: async (data: any[]) => {
        // ✅ Good - parallel processing
        const results = await Promise.all(
          data.map(item => processItem(item))
        );
        
        // ✅ Good - error handling
        const safeResults = await Promise.allSettled(
          data.map(item => riskyProcessItem(item))
        );
        
        // ✅ Good - sequential when order matters
        const orderedResults = [];
        for (const item of data) {
          const result = await processInOrder(item);
          orderedResults.push(result);
        }
        
        return { results, safeResults, orderedResults };
      }
    });
  }
};
```

### 3. Event Handler Best Practices

```typescript
const eventBestPracticesPlugin: PluginDefinition<AppConfig> = {
  name: 'event-best-practices',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Good - fast sync handler for immediate response
    ctx.events.on('user:action', (action) => {
      ctx.logger.info(`User action: ${action.type}`);
    });
    
    // ✅ Good - async handler for heavy processing
    ctx.events.on('user:action', async (action) => {
      try {
        await ctx.actions.runAction('analytics:track', action);
      } catch (error) {
        // ✅ Don't let handler errors break other handlers
        ctx.logger.error('Analytics tracking failed:', error);
      }
    });
    
    // ✅ Good - use emitAsync when you need to wait
    ctx.actions.registerAction({
      id: 'process:critical',
      handler: async (data: any) => {
        // Wait for all handlers to complete
        await ctx.events.emitAsync('critical:processing', data);
        return 'All critical handlers completed';
      }
    });
  }
};
```

## Performance Considerations

### 1. Configuration Access Performance

```typescript
// ✅ Excellent - O(1) sync access
const fastPlugin: PluginDefinition<AppConfig> = {
  name: 'fast',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'fast:action',
      handler: () => {
        // ✅ Immediate access, no overhead
        return ctx.config.api.baseUrl;
      }
    });
  }
};

// ❌ Poor - unnecessary async overhead
const slowPlugin: PluginDefinition<AppConfig> = {
  name: 'slow',
  version: '1.0.0',
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'slow:action',
      handler: async () => {
        // ❌ Unnecessary Promise overhead
        const config = await Promise.resolve(ctx.config);
        return config.api.baseUrl;
      }
    });
  }
};
```

### 2. Action Execution Performance

```typescript
const performancePlugin: PluginDefinition<AppConfig> = {
  name: 'performance',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Good - parallel execution
    ctx.actions.registerAction({
      id: 'parallel:process',
      handler: async (items: any[]) => {
        return await Promise.all(
          items.map(item => ctx.actions.runAction('process:item', item))
        );
      }
    });
    
    // ✅ Good - batch processing
    ctx.actions.registerAction({
      id: 'batch:process',
      handler: async (items: any[]) => {
        const batchSize = 10;
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(item => ctx.actions.runAction('process:item', item))
          );
          results.push(...batchResults);
        }
        
        return results;
      }
    });
  }
};
```

## Migration from v0.1.x

### Configuration Access Migration

```typescript
// v0.1.x - Host context pattern
const oldPattern = {
  name: 'old',
  version: '1.0.0',
  setup(ctx) {
    // ❌ Async access, type casting required
    const config = (ctx.host.config as any);
    
    ctx.actions.registerAction({
      id: 'old:action',
      handler: async () => {
        const apiUrl = (ctx.host.config as any).apiUrl;
        return await fetch(apiUrl);
      }
    });
  }
};

// v0.2.0 - Direct config pattern
const newPattern: PluginDefinition<AppConfig> = {
  name: 'new',
  version: '1.0.0',
  setup(ctx) {
    // ✅ Sync access, fully typed
    const { api } = ctx.config;
    
    ctx.actions.registerAction({
      id: 'new:action',
      handler: async () => {
        return await fetch(ctx.config.api.baseUrl);
      }
    });
  }
};
```

### Migration Checklist

- [ ] Define TypeScript interface for your configuration
- [ ] Replace `hostContext` with `config` in Runtime constructor
- [ ] Update plugins to use generic types
- [ ] Replace `ctx.host.config` with `ctx.config`
- [ ] Remove type casting (`as any`)
- [ ] Add explicit dependencies where needed
- [ ] Test that all functionality works as expected

## Summary

**Synchronous Access (v0.2.0):**
- Configuration via `ctx.config`
- Event emission via `ctx.events.emit()`
- Plugin metadata via `ctx.introspect`

**Asynchronous Access:**
- Action execution via `ctx.actions.runAction()`
- Async event emission via `ctx.events.emitAsync()`
- Plugin lifecycle (setup/dispose)

**Key Benefits:**
- **Performance**: Sync config access eliminates Promise overhead
- **Type Safety**: Full TypeScript support with generics
- **Developer Experience**: Better IDE support and error detection
- **Reliability**: Compile-time validation prevents runtime errors

For more examples, see the [API Reference](../api/reference.md) and [Plugin Dependencies Guide](./plugin-dependencies.md).