# Service Locator API (inter-plugin communication)

The Service Locator API (introduced in v0.3) provides a simple, type-safe way for plugins to communicate with each other by exposing and consuming services.

## The Problem: Inter-plugin Dependencies

In previous versions, if Plugin A wanted to call a function in Plugin B, it had to rely on `ctx.actions.runAction()`. While flexible, this lacked type safety and IDE autocompletion.

## The Solution: `ctx.services`

The Service Locator pattern allows a plugin to "register" a typed object (a service) that other plugins can then "get" and use directly.

## Providing a Service

A plugin provides a service by registering it during its `setup()` phase.

```typescript
// 1. Define your service interface
export interface MyAuthService {
  isAuthenticated(): boolean;
  getUser(): { id: string; name: string } | null;
}

const AuthPlugin: PluginDefinition = {
  name: 'auth-plugin',
  version: '1.0.0',
  setup(ctx) {
    // 2. Implement and register the service
    const authService: MyAuthService = {
      isAuthenticated: () => true,
      getUser: () => ({ id: '123', name: 'Alice' })
    };
    
    ctx.services.register<MyAuthService>('auth', authService);
  }
};
```

## Consuming a Service

Another plugin can consume the service after the provider has been initialized. Note: **Always declare dependencies** in your plugin definition to ensure correct initialization order.

```typescript
const AppPlugin: PluginDefinition = {
  name: 'app-plugin',
  version: '1.0.0',
  dependencies: ['auth-plugin'], // Ensure auth-plugin initializes first
  
  setup(ctx) {
    // 3. Get and use the service
    const auth = ctx.services.get<MyAuthService>('auth');
    
    if (auth.isAuthenticated()) {
      console.log(`Hello, ${auth.getUser()?.name}`);
    }
  }
};
```

## API Reference

### `ctx.services.register<T>(name: string, service: T)`
Registers a service implementation.
- **name**: A unique string identifier for the service.
- **service**: The object or class instance providing the service.
- **Throws**: `DuplicateRegistrationError` if a service with that name already exists.

### `ctx.services.get<T>(name: string)`
Retrieves a service implementation.
- **name**: The unique string identifier.
- **Returns**: The registered service instance.
- **Throws**: Error if the service is not found.

### `ctx.services.has(name: string)`
Checks if a service is registered.
- **Returns**: `true` if it exists, `false` otherwise.

### `ctx.services.list()`
Lists all registered service names.
- **Returns**: `string[]`

## Best Practices

1. **Strict Dependencies**: Always list the providing plugin in your `dependencies` array. `ServiceRegistry` will throw an error if you try to `get()` a service that hasn't been registered yet.
2. **Interfaces**: Shared service interfaces should be defined in a common types file or exported by the providing plugin's package.
3. **Avoid Circular Services**: Plugin A cannot require a service from Plugin B if Plugin B also requires a service from Plugin A. Use the `EventBus` for decoupled communication in those cases.
4. **Late Retrieval**: If you don't want to rely on hard dependencies, you can check `ctx.services.has('name')` inside an action handler rather than during `setup()`.
