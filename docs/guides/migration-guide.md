# Migration Guide: Adopting Skeleton Crew Runtime v0.3.3

This guide helps you migrate existing applications to Skeleton Crew Runtime v0.3.3. **v0.3.x makes the runtime production-ready with Service Locator, Config Validation, and Plugin Discovery.**

## Table of Contents

- [What's New in v0.3.x](#whats-new-in-v03x)
- [Key Features from v0.2.x](#key-features-from-v02x)
- [Migration Strategies](#migration-strategies)
- [Step-by-Step Walkthrough](#step-by-step-walkthrough)
- [Common Pitfalls](#common-pitfalls)

---

## What's New in v0.3.x

### 📡 Service Locator (v0.3.1)
Type-safe inter-plugin communication without tight coupling.

```typescript
import type { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

// Plugin A: Provides a service
setup(ctx: RuntimeContext) {
  ctx.services.register('payment-gateway', {
    process: async (amount: number) => { /* ... */ }
  });
}

// Plugin B: Consumes a service
setup(ctx: RuntimeContext) {
  // Safe consumption
  if (ctx.services.has('payment-gateway')) {
    const gateway = ctx.services.get<PaymentGateway>('payment-gateway');
    await gateway.process(100);
  }
}
```

### 🛡️ Config Validation (v0.3.0)
Fail fast if plugin configuration is invalid.

```typescript
export const myPlugin: PluginDefinition<MyConfig> = {
  name: 'my-plugin',
  version: '1.0.0',
  
  // Return true if valid, or an error object
  validateConfig(config) {
    if (!config.apiKey) {
      return { valid: false, errors: ['Missing apiKey'] };
    }
    return true;
  },

  setup(ctx) { /* ... */ }
};
```

### 🔍 Plugin Discovery (v0.2.1)
Automatically load plugins from the file system or npm packages.

```typescript
const runtime = new Runtime({
  // Load all .js/.mjs/.ts files in these directories
  pluginPaths: ['./src/plugins', './dist/plugins'],
  
  // Load these npm modules as plugins
  pluginPackages: ['@skcrew/plugin-logger']
});
```

---

## Key Features from v0.2.x

### 🎯 Generic Runtime
Full TypeScript support for your configuration.

```typescript
import { Runtime } from 'skeleton-crew-runtime';

interface AppConfig {
  apiUrl: string;
  features: { analytics: boolean };
}

// Runtime is fully typed
const runtime = new Runtime<AppConfig>({
  config: {
    apiUrl: 'https://api.app.com',
    features: { analytics: true }
  }
});
```

### ⚡ Sync Config Access
Access configuration synchronously in your plugins.

```typescript
setup(ctx: RuntimeContext<AppConfig>) {
  // No await needed!
  if (ctx.config.features.analytics) {
    // ...
  }
}
```

### 🔗 Explicit Dependencies
Ensure plugins load in the correct order.

```typescript
export const myPlugin: PluginDefinition = {
  name: 'auth-plugin',
  dependencies: ['database-plugin'], // Waits for database-plugin
  setup(ctx) { /* ... */ }
};
```

---

## Migration Strategies

### 1. Host Context Injection (The "Zero Migration" Strategy)
**Best for:** Getting started immediately without rewriting legacy code.

Inject your existing services (Database, Logger, API Clients) into the Runtime so new plugins can use them.

```typescript
import { Runtime } from 'skeleton-crew-runtime';
import { db, logger, legacyApi } from './legacy-app';

const runtime = new Runtime({
  hostContext: {
    db,
    logger,
    api: legacyApi
  }
});

// New plugins access legacy code via ctx.host
setup(ctx: RuntimeContext) {
  const users = await ctx.host.db.query('SELECT * FROM users');
}
```

### 2. The Strangler Pattern (Gradual Migration)
**Best for:** Large, monolithic applications.

1.  Identify a specific feature (e.g., "User Notifications").
2.  Create a `NotificationPlugin`.
3.  Replace the legacy notification code with a call to the plugin action.
4.  Repeat for other features.

```typescript
// Legacy Code
async function notifyUser(id, msg) {
  // OLD: await sendEmail(id, msg);
  
  // NEW: Delegate to runtime
  await runtime.getContext().actions.runAction('notifications:send', { id, msg });
}
```

---

## Step-by-Step Walkthrough

### Scenario: Browser Extension Migration
Goal: Move a monolithic `background.js` to Skeleton Crew Runtime.

#### Step 1: Install
`npm install skeleton-crew-runtime@^0.3.3`

#### Step 2: Initialize Runtime
```typescript
// background.ts
import { Runtime } from 'skeleton-crew-runtime';
import type { PluginDefinition } from 'skeleton-crew-runtime';

const runtime = new Runtime({
  hostContext: { browser: chrome } // Inject chrome API
});

await runtime.initialize();
```

#### Step 3: Create a Plugin
```typescript
// plugins/tabs.ts
import type { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

export const tabsPlugin: PluginDefinition = {
  name: 'tabs',
  version: '1.0.0',
  setup(ctx: RuntimeContext) {
    // Register action
    ctx.actions.registerAction({
      id: 'tabs:create',
      handler: async (url: string) => {
        return await ctx.host.browser.tabs.create({ url });
      }
    });
  }
};
```

#### Step 4: Register and Use
```typescript
runtime.registerPlugin(tabsPlugin);

// Usage
await runtime.getContext().actions.runAction('tabs:create', 'https://google.com');
```

---

## Common Pitfalls

### 1. Missing `import type`
**Error:** `importsNotUsedAsValues` or `isolatedModules` errors.
**Fix:** Always use `import type { ... }` for interfaces.

```typescript
// ❌ Bad
import { RuntimeContext } from 'skeleton-crew-runtime';

// ✅ Good
import type { RuntimeContext } from 'skeleton-crew-runtime';
```

### 2. Circular Dependencies
**Error:** Runtime throws "Circular dependency detected".
**Fix:** Rethink your architecture. Use `events` or `services` to decouple plugins instead of hard dependencies.

### 3. Async Config Access (Legacy)
**Error:** Trying to `await ctx.config`.
**Fix:** `ctx.config` is now synchronous object access. Just read it directly!
