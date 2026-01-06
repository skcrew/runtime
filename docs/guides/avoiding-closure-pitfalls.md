# Avoiding Closure Pitfalls in Plugin Development

This guide covers common pitfalls when developing plugins for Skeleton Crew Runtime, particularly around stale closures and dynamic configuration access.

## The Stale Closure Problem

### What is a Stale Closure?

A stale closure occurs when a function captures a reference to a variable at the time it's created, but that variable's value changes later. The function continues to use the old (stale) value instead of the current one.

### Common Scenario in SCR Plugins

This problem frequently occurs with `ctx.config` in plugin setup functions:

```typescript
// ❌ WRONG - Stale closure bug
const myPlugin: PluginDefinition = {
  name: 'my-plugin',
  version: '1.0.0',
  
  setup(ctx) {
    // This captures ctx.config at setup time
    const config = ctx.config;
    
    ctx.actions.registerAction({
      id: 'my:action',
      handler: async () => {
        // BUG: This uses the config from setup time,
        // not the current config!
        return config.someValue;
      }
    });
  }
};
```

### Why This Happens

1. **Setup runs once**: Plugin `setup()` functions execute during `runtime.initialize()`
2. **Config can change**: The runtime's config object may be replaced later via `runtime.updateConfig()`
3. **Closure captures reference**: The action handler captures the old config object reference
4. **Stale data**: Handler continues using the old config even after updates

## The Solution: Dynamic Access

### ✅ Always Access Config Dynamically

```typescript
// ✅ CORRECT - Dynamic access
const myPlugin: PluginDefinition = {
  name: 'my-plugin',
  version: '1.0.0',
  
  setup(ctx) {
    ctx.actions.registerAction({
      id: 'my:action',
      handler: async () => {
        // ✅ Always access ctx.config fresh
        return ctx.config.someValue;
      }
    });
  }
};
```

### ✅ Use Helper Functions

```typescript
// ✅ CORRECT - Helper function approach
const myPlugin: PluginDefinition = {
  name: 'my-plugin',
  version: '1.0.0',
  
  setup(ctx) {
    // Helper function that always gets fresh config
    const getApiUrl = () => ctx.config.apiUrl;
    const getTimeout = () => ctx.config.timeout || 5000;
    
    ctx.actions.registerAction({
      id: 'my:fetch-data',
      handler: async () => {
        const response = await fetch(getApiUrl(), {
          timeout: getTimeout()
        });
        return response.json();
      }
    });
  }
};
```

## Real-World Example: The DownloaderPlugin Bug

Here's a real bug we encountered and how we fixed it:

### ❌ The Bug

```typescript
const DownloaderPlugin: PluginDefinition = {
  name: 'downloader',
  version: '1.0.0',
  
  setup(ctx) {
    // BUG: Captured config at setup time
    const config = ctx.config;
    
    const downloadFile = async (url: string) => {
      // Uses stale config.downloadDir
      const filePath = path.join(config.downloadDir, filename);
      // ... download logic
    };
    
    ctx.actions.registerAction({
      id: 'downloader:download',
      handler: downloadFile
    });
  }
};
```

**Problem**: When `ConfigPlugin` updated the config with a new `downloadDir`, the `DownloaderPlugin` continued using the old directory.

### ✅ The Fix

```typescript
const DownloaderPlugin: PluginDefinition = {
  name: 'downloader',
  version: '1.0.0',
  
  setup(ctx) {
    const downloadFile = async (url: string) => {
      // ✅ Always get fresh config
      const downloadDir = ctx.config.downloadDir;
      const filePath = path.join(downloadDir, filename);
      // ... download logic
    };
    
    ctx.actions.registerAction({
      id: 'downloader:download',
      handler: downloadFile
    });
  }
};
```

## Other Common Pitfalls

### 1. Capturing Host Context

```typescript
// ❌ WRONG
setup(ctx) {
  const db = ctx.host.database; // Captured at setup
  
  ctx.actions.registerAction({
    id: 'my:query',
    handler: async () => {
      return db.query('SELECT * FROM users'); // Stale reference
    }
  });
}

// ✅ CORRECT
setup(ctx) {
  ctx.actions.registerAction({
    id: 'my:query',
    handler: async () => {
      return ctx.host.database.query('SELECT * FROM users'); // Fresh access
    }
  });
}
```

### 2. Capturing Logger

```typescript
// ❌ WRONG
setup(ctx) {
  const logger = ctx.logger; // Captured at setup
  
  ctx.actions.registerAction({
    id: 'my:log',
    handler: async () => {
      logger.info('Something happened'); // Stale logger
    }
  });
}

// ✅ CORRECT
setup(ctx) {
  ctx.actions.registerAction({
    id: 'my:log',
    handler: async () => {
      ctx.logger.info('Something happened'); // Fresh logger
    }
  });
}
```

### 3. Capturing Other Plugins' State

```typescript
// ❌ WRONG
setup(ctx) {
  const authPlugin = ctx.plugins.getPlugin('auth'); // Captured at setup
  
  ctx.actions.registerAction({
    id: 'my:protected-action',
    handler: async () => {
      if (!authPlugin.isAuthenticated()) { // Stale reference
        throw new Error('Not authenticated');
      }
    }
  });
}

// ✅ CORRECT
setup(ctx) {
  ctx.actions.registerAction({
    id: 'my:protected-action',
    handler: async () => {
      // Use actions or events for cross-plugin communication
      const isAuth = await ctx.actions.runAction('auth:check');
      if (!isAuth) {
        throw new Error('Not authenticated');
      }
    }
  });
}
```

## Best Practices

### 1. Never Capture Mutable State

**Rule**: Don't assign `ctx.*` properties to local variables in `setup()`

```typescript
// ❌ DON'T DO THIS
setup(ctx) {
  const config = ctx.config;
  const logger = ctx.logger;
  const host = ctx.host;
  // ... use in handlers
}

// ✅ DO THIS
setup(ctx) {
  // Access ctx.* directly in handlers
  ctx.actions.registerAction({
    handler: async () => {
      ctx.logger.info('Using fresh logger');
      return ctx.config.someValue;
    }
  });
}
```

### 2. Use Immutable Captures Safely

It's safe to capture truly immutable values:

```typescript
// ✅ SAFE - These won't change
setup(ctx) {
  const pluginName = 'my-plugin'; // String literal
  const version = '1.0.0'; // String literal
  const constants = { MAX_RETRIES: 3 }; // Your own constants
  
  ctx.actions.registerAction({
    handler: async () => {
      ctx.logger.info(`${pluginName} v${version} executing`);
      // Safe to use constants
    }
  });
}
```

### 3. Test for Stale Closures

Write tests that update config and verify plugins use the new values:

```typescript
describe('MyPlugin', () => {
  it('should use updated config', async () => {
    const runtime = new Runtime({ config: { apiUrl: 'http://old.com' } });
    runtime.registerPlugin(myPlugin);
    await runtime.initialize();
    
    // Update config
    runtime.updateConfig({ apiUrl: 'http://new.com' });
    
    // Test that plugin uses new config
    const result = await runtime.getContext().actions.runAction('my:fetch');
    expect(result.url).toBe('http://new.com'); // Should use new URL
  });
});
```

## Summary

- **Always access `ctx.*` dynamically** in action handlers and event listeners
- **Never capture mutable state** in local variables during `setup()`
- **Use helper functions** that access `ctx.*` fresh each time
- **Test config updates** to ensure plugins use new values
- **Remember**: `setup()` runs once, but handlers run many times

Following these practices will prevent stale closure bugs and make your plugins more robust and maintainable.