# Plugin Config Validation

This guide covers the config validation feature introduced in v0.3, which allows plugins to validate their configuration requirements before setup.

## Overview

Plugins can define a `validateConfig` callback that runs **before** `setup()`. This enables:
- Early failure with clear error messages
- Type-safe config requirements
- Integration with any validation library

## Basic Usage

```typescript
const myPlugin: PluginDefinition<MyConfig> = {
  name: 'my-plugin',
  version: '1.0.0',
  
  // Validate config before setup runs
  validateConfig(config) {
    if (!config.apiUrl) {
      return { valid: false, errors: ['apiUrl is required'] };
    }
    if (!config.apiUrl.startsWith('https://')) {
      return { valid: false, errors: ['apiUrl must use HTTPS'] };
    }
    return true;
  },
  
  setup(ctx) {
    // Config is guaranteed to be valid here
    const apiUrl = ctx.config.apiUrl;
    // ...
  }
};
```

## Validation Return Types

The `validateConfig` callback can return:

| Return Type | Meaning |
|-------------|---------|
| `true` | Config is valid |
| `false` | Config is invalid (generic error) |
| `{ valid: true }` | Config is valid (explicit) |
| `{ valid: false, errors: ['...'] }` | Config is invalid with specific errors |

```typescript
// Simple boolean
validateConfig: (config) => Boolean(config.apiKey),

// Detailed result
validateConfig: (config) => ({
  valid: Boolean(config.apiKey),
  errors: config.apiKey ? undefined : ['apiKey is required']
}),
```

## Async Validation

Validation can be async when you need to verify against external sources:

```typescript
validateConfig: async (config) => {
  if (!config.apiKey) {
    return { valid: false, errors: ['apiKey is required'] };
  }
  
  // Verify API key is valid
  try {
    const response = await fetch(`${config.apiUrl}/validate`, {
      headers: { Authorization: `Bearer ${config.apiKey}` }
    });
    return response.ok;
  } catch (e) {
    return { valid: false, errors: ['Cannot verify API key'] };
  }
};
```

## Integration with Zod

Use Zod for schema-based validation (Zod is **not bundled**—bring your own):

```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  timeout: z.number().min(1000).max(30000).optional(),
});

// Infer TypeScript type from schema
type MyConfig = z.infer<typeof ConfigSchema>;

const myPlugin: PluginDefinition<MyConfig> = {
  name: 'my-plugin',
  version: '1.0.0',
  
  validateConfig(config) {
    const result = ConfigSchema.safeParse(config);
    if (result.success) {
      return true;
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  },
  
  setup(ctx) {
    // ctx.config is typed as MyConfig
  }
};
```

## Config Keys (Documentation)

The optional `configKeys` property documents which config keys your plugin uses:

```typescript
const myPlugin: PluginDefinition = {
  name: 'my-plugin',
  version: '1.0.0',
  configKeys: ['apiUrl', 'apiKey', 'timeout'], // For documentation
  
  validateConfig(config) { /* ... */ },
  setup(ctx) { /* ... */ }
};
```

This is useful for:
- Auto-generating documentation
- Config management tools
- Debugging which plugins use which config keys

## Error Handling

When validation fails, the runtime throws a `ValidationError`:

```
ValidationError: Validation failed for Plugin "my-plugin": missing or invalid field "config (apiUrl is required)"
```

Handle this in your initialization code:

```typescript
try {
  await runtime.initialize();
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Config validation failed:', error.message);
    // Show helpful message to user
  }
  throw error;
}
```

## Summary

- Define `validateConfig` to validate config before `setup()` runs
- Return `true`/`false` or `{ valid, errors }` for detailed feedback
- Use any validation library (Zod, runtypes, io-ts, etc.)
- Use `configKeys` to document which config keys your plugin uses
- Validation failures throw `ValidationError` with descriptive messages
