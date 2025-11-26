# Design Document: Migration Support for SCR

## Overview

This document outlines the technical design for adding migration support to Skeleton Crew Runtime (SCR). The design adds two core features—Host Context Injection and Introspection API—while maintaining SCR's minimal, UI-agnostic, and environment-neutral philosophy. All changes are backward compatible and additive.

**Key Goals:**
- Enable legacy applications to inject services into SCR
- Provide metadata queries for debugging and tooling
- Maintain zero breaking changes
- Keep core size increase under 1KB
- Preserve 95%+ philosophy alignment

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Host Application                      │
│  (Legacy app with existing services)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ hostContext: { db, logger, cache }
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Runtime                             │
│  - Stores hostContext                                    │
│  - Validates hostContext (warnings)                      │
│  - Passes to RuntimeContext                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Immutable hostContext
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  RuntimeContext                          │
│  - Exposes context.host (frozen)                         │
│  - Exposes context.introspect                            │
│  - Provides metadata queries                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Available to plugins
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     Plugins                              │
│  - Access host services via context.host                 │
│  - Query metadata via context.introspect                 │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction

```
Runtime Constructor
    │
    ├─> Store hostContext
    ├─> Validate hostContext (warnings)
    └─> Pass to RuntimeContext
            │
            ├─> Freeze and expose as context.host
            └─> Implement introspection API
                    │
                    ├─> Query ActionEngine
                    ├─> Query PluginRegistry
                    ├─> Query ScreenRegistry
                    └─> Return deep frozen metadata
```

---

## Components and Interfaces

### 1. RuntimeOptions Enhancement

**File:** `src/types.ts`

```typescript
export interface RuntimeOptions {
  logger?: Logger;
  hostContext?: Record<string, unknown>; // NEW
}
```

**Purpose:** Allow host applications to inject services

**Design Decisions:**
- Use `Record<string, unknown>` for maximum flexibility
- Optional to maintain backward compatibility
- No type constraints on values (host decides what to inject)

---

### 2. RuntimeContext Enhancement

**File:** `src/types.ts`

```typescript
export interface RuntimeContext {
  // ... existing APIs
  
  readonly host: Readonly<Record<string, unknown>>; // NEW
  readonly introspect: IntrospectionAPI; // NEW
}
```

**Purpose:** Expose host context and introspection to plugins

**Design Decisions:**
- `host` is readonly to prevent mutation
- `introspect` is readonly to prevent replacement
- Both are getters (computed properties)

---

### 3. IntrospectionAPI Interface

**File:** `src/types.ts`

```typescript
export interface IntrospectionAPI {
  // Action introspection
  listActions(): string[];
  getActionDefinition(id: string): ActionMetadata | null;
  
  // Plugin introspection
  listPlugins(): string[];
  getPluginDefinition(name: string): PluginMetadata | null;
  
  // Screen introspection
  listScreens(): string[];
  getScreenDefinition(id: string): ScreenDefinition | null;
  
  // Runtime introspection
  getMetadata(): IntrospectionMetadata;
}
```

**Purpose:** Provide metadata queries for debugging and tooling

**Design Decisions:**
- Return arrays for lists (not iterators)
- Return null for missing resources (not undefined)
- All methods are synchronous
- No mutation methods (read-only API)

---

### 4. Metadata Interfaces

**File:** `src/types.ts`

```typescript
export interface ActionMetadata {
  id: string;
  timeout?: number;
  // NO handler - metadata only
}

export interface PluginMetadata {
  name: string;
  version: string;
  // NO setup/dispose - metadata only
}

export interface IntrospectionMetadata {
  runtimeVersion: string;
  totalActions: number;
  totalPlugins: number;
  totalScreens: number;
}
```

**Purpose:** Define metadata structure returned by introspection

**Design Decisions:**
- Exclude function implementations (handlers, setup, dispose)
- Include only serializable data
- Keep minimal to reduce memory overhead
- All fields are readonly

---

## Data Models

### Host Context Flow

```
Host Application
    │
    │ Creates Runtime with hostContext
    ▼
Runtime Constructor
    │
    ├─> Validate (warnings only)
    │   ├─> Check size (> 1MB warns)
    │   └─> Check functions (warns)
    │
    ├─> Store in private field
    │
    └─> Pass to RuntimeContext
            │
            └─> Expose via getter
                    │
                    └─> Return Object.freeze({ ...hostContext })
```

**Immutability Strategy:**
- Store original reference in Runtime
- Return frozen shallow copy from RuntimeContext
- Shallow copy prevents mutation of reference
- Freeze prevents mutation of properties

---

### Introspection Flow

```
Plugin calls context.introspect.getActionDefinition(id)
    │
    ▼
RuntimeContext.introspect getter
    │
    ├─> Query ActionEngine.getAction(id)
    │
    ├─> Extract metadata (id, timeout)
    │
    ├─> Deep freeze metadata
    │
    └─> Return frozen metadata
```

**Deep Freeze Strategy:**
- Recursively freeze object and nested objects
- Skip functions (cannot be frozen)
- Skip already frozen objects
- Prevents any mutation of returned data

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Host Context Immutability

*For any* host context object provided to Runtime, accessing `context.host` should return a frozen object that cannot be mutated.

**Validates: Requirements 1.3, 1.4**

**Test Strategy:**
- Generate random host context objects
- Create runtime with each context
- Attempt to mutate context.host
- Verify all mutations throw errors

---

### Property 2: Host Context Isolation

*For any* two Runtime instances with different host contexts, each instance's plugins should only access their own host context.

**Validates: Requirements 1.1, 1.2**

**Test Strategy:**
- Create two runtimes with different contexts
- Register plugins in each
- Verify each plugin sees only its runtime's context
- Verify no cross-contamination

---

### Property 3: Introspection Metadata Immutability

*For any* introspection query result, the returned metadata should be deeply frozen and cannot be mutated at any level.

**Validates: Requirements 3.5, 4.5, 5.5, 7.1, 7.2, 7.3**

**Test Strategy:**
- Query all introspection methods
- Attempt to mutate returned objects
- Attempt to mutate nested objects
- Verify all mutations throw errors

---

### Property 4: Introspection Metadata Completeness

*For any* registered resource (action, plugin, screen), introspection should return metadata that accurately reflects the resource's properties.

**Validates: Requirements 3.2, 4.2, 5.2**

**Test Strategy:**
- Register resources with known properties
- Query via introspection
- Verify returned metadata matches
- Verify no properties are missing

---

### Property 5: Introspection No Implementation Exposure

*For any* introspection query, the returned metadata should never include function implementations (handlers, setup, dispose).

**Validates: Requirements 3.4, 4.4**

**Test Strategy:**
- Register resources with handlers
- Query via introspection
- Verify returned metadata has no functions
- Verify typeof checks for all properties

---

### Property 6: Backward Compatibility

*For any* existing SCR code, the code should continue to work without modifications after adding migration support.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

**Test Strategy:**
- Run all existing tests
- Create runtime without hostContext
- Use all existing APIs
- Verify identical behavior

---

### Property 7: Validation Non-Interference

*For any* host context (valid or invalid), validation warnings should not prevent runtime initialization or modify the context.

**Validates: Requirements 2.3, 2.4**

**Test Strategy:**
- Provide contexts with large objects
- Provide contexts with functions
- Verify warnings are logged
- Verify initialization succeeds
- Verify context is unchanged

---

## Error Handling

### Validation Errors

**Strategy:** Warn, don't throw

```typescript
// Large object warning
if (size > 1024 * 1024) {
  this.logger.warn(`Host context key "${key}" is large (${size} bytes)`);
  // Continue - don't throw
}

// Function value warning
if (typeof value === 'function') {
  this.logger.warn(`Host context key "${key}" is a function`);
  // Continue - don't throw
}
```

**Rationale:**
- Warnings guide developers without breaking apps
- Host app decides what to inject
- Validation is advisory, not enforced

---

### Introspection Errors

**Strategy:** Return null for missing resources

```typescript
getActionDefinition(id: string): ActionMetadata | null {
  const action = this.actionEngine.getAction(id);
  if (!action) return null; // Not found
  return deepFreeze({ id: action.id, timeout: action.timeout });
}
```

**Rationale:**
- Null is explicit "not found" signal
- No exceptions for missing resources
- Caller can handle null gracefully

---

### Mutation Errors

**Strategy:** Let Object.freeze throw

```typescript
const frozen = Object.freeze({ ...hostContext });
frozen.newKey = 'value'; // Throws TypeError in strict mode
```

**Rationale:**
- Standard JavaScript behavior
- Clear error message
- Prevents accidental mutation

---

## Testing Strategy

### Unit Tests

**Host Context Tests** (`tests/unit/host-context.test.ts`):
```typescript
describe('Host Context', () => {
  it('should inject host context into runtime');
  it('should freeze host context to prevent mutation');
  it('should default to empty object if not provided');
  it('should pass host context to plugins');
  it('should warn about large objects');
  it('should warn about function values');
  it('should not modify context during validation');
});
```

**Introspection Tests** (`tests/unit/introspection.test.ts`):
```typescript
describe('Introspection API', () => {
  it('should list all registered actions');
  it('should get action definition by id');
  it('should return null for missing action');
  it('should not expose handler function');
  it('should deep freeze action metadata');
  
  it('should list all registered plugins');
  it('should get plugin definition by name');
  it('should return null for missing plugin');
  it('should not expose setup/dispose functions');
  it('should deep freeze plugin metadata');
  
  it('should list all registered screens');
  it('should get screen definition by id');
  it('should return null for missing screen');
  it('should deep freeze screen metadata');
  
  it('should get runtime metadata');
  it('should include version and counts');
  it('should deep freeze runtime metadata');
});
```

**Deep Freeze Tests** (`tests/unit/deep-freeze.test.ts`):
```typescript
describe('Deep Freeze', () => {
  it('should freeze object itself');
  it('should recursively freeze nested objects');
  it('should freeze arrays');
  it('should skip functions');
  it('should skip already frozen objects');
  it('should handle circular references');
});
```

---

### Property-Based Tests

**Property Test 1: Host Context Immutability**
```typescript
import fc from 'fast-check';

it('should prevent mutation of host context', () => {
  fc.assert(
    fc.property(fc.object(), (hostContext) => {
      const runtime = new Runtime({ hostContext });
      await runtime.initialize();
      
      const context = runtime.getContext();
      
      // Attempt mutation should throw
      expect(() => {
        (context.host as any).newKey = 'value';
      }).toThrow();
    }),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Introspection Immutability**
```typescript
it('should prevent mutation of introspection results', () => {
  fc.assert(
    fc.property(
      fc.string(), // action id
      fc.option(fc.nat()), // timeout
      (id, timeout) => {
        const runtime = new Runtime();
        await runtime.initialize();
        
        runtime.getContext().actions.registerAction({
          id,
          handler: () => {},
          timeout
        });
        
        const metadata = runtime.getContext().introspect.getActionDefinition(id);
        
        // Attempt mutation should throw
        expect(() => {
          (metadata as any).id = 'changed';
        }).toThrow();
      }
    ),
    { numRuns: 100 }
  );
});
```

---

### Integration Tests

**Integration Test 1: Host Context in Plugins**
```typescript
it('should allow plugins to access host services', async () => {
  const db = { query: vi.fn() };
  const runtime = new Runtime({ hostContext: { db } });
  
  let capturedDb: any;
  runtime.registerPlugin({
    name: 'test',
    version: '1.0.0',
    setup: (context) => {
      capturedDb = context.host.db;
    }
  });
  
  await runtime.initialize();
  
  expect(capturedDb).toBe(db);
});
```

**Integration Test 2: Introspection with Real Data**
```typescript
it('should provide accurate introspection data', async () => {
  const runtime = new Runtime();
  await runtime.initialize();
  
  const context = runtime.getContext();
  
  // Register resources
  context.actions.registerAction({ id: 'test:action', handler: () => {} });
  context.plugins.registerPlugin({ name: 'test-plugin', version: '1.0.0', setup: () => {} });
  context.screens.registerScreen({ id: 'test:screen', title: 'Test', component: 'Test' });
  
  // Query introspection
  const actions = context.introspect.listActions();
  const plugins = context.introspect.listPlugins();
  const screens = context.introspect.listScreens();
  
  expect(actions).toContain('test:action');
  expect(plugins).toContain('test-plugin');
  expect(screens).toContain('test:screen');
});
```

---

### Backward Compatibility Tests

**Test: Existing Code Works**
```typescript
it('should maintain backward compatibility', async () => {
  // Create runtime without new features
  const runtime = new Runtime();
  await runtime.initialize();
  
  // Use existing APIs
  const context = runtime.getContext();
  context.actions.registerAction({ id: 'test', handler: () => 'result' });
  const result = await context.actions.runAction('test');
  
  expect(result).toBe('result');
});
```

**Test: All Existing Tests Pass**
```bash
# Run existing test suite
npm test

# All tests should pass without modification
```

---

## Performance Considerations

### Host Context Validation

**Performance Impact:** < 1ms

**Optimization:**
- Only validate on construction (once)
- Use JSON.stringify for size check (fast)
- Early return for empty context

```typescript
if (Object.keys(context).length === 0) return; // Fast path
```

---

### Introspection Queries

**Performance Impact:** < 1ms per query

**Optimization:**
- Use existing registry methods (already O(1) or O(n))
- Deep freeze only returned objects (not internal state)
- Cache frozen objects if needed (future optimization)

---

### Deep Freeze

**Performance Impact:** Negligible for typical metadata

**Optimization:**
- Skip already frozen objects
- Skip functions (cannot freeze)
- Shallow copy before freezing (prevents internal mutation)

---

### Memory Impact

**Estimated Increase:** < 100KB

**Breakdown:**
- Host context reference: ~8 bytes
- Introspection API object: ~200 bytes
- Metadata interfaces: ~0 bytes (types only)
- Deep freeze overhead: ~10% of metadata size

---

## Security Considerations

### Host Context Security

**Threat:** Plugin mutates host context

**Mitigation:** Return frozen shallow copy

```typescript
get host(): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...this.hostContext });
}
```

---

### Introspection Security

**Threat:** Plugin accesses handler implementations

**Mitigation:** Return metadata only, exclude functions

```typescript
// DON'T return full definition
return action; // ❌ Exposes handler

// DO return metadata only
return { id: action.id, timeout: action.timeout }; // ✅
```

---

### Metadata Mutation

**Threat:** Plugin mutates returned metadata

**Mitigation:** Deep freeze all returned objects

```typescript
return deepFreeze({ id: action.id, timeout: action.timeout });
```

---

## Implementation Plan

### Phase 1: Core Types (Day 1)

1. Add `hostContext` to RuntimeOptions
2. Add `host` to RuntimeContext
3. Add IntrospectionAPI interface
4. Add metadata interfaces
5. Export all new types

**Files:** `src/types.ts`

---

### Phase 2: Runtime Changes (Day 2)

1. Store hostContext in constructor
2. Implement validateHostContext method
3. Pass hostContext to RuntimeContext
4. Add tests

**Files:** `src/runtime.ts`, `tests/unit/host-context.test.ts`

---

### Phase 3: RuntimeContext Changes (Day 3-4)

1. Accept hostContext in constructor
2. Implement `host` getter
3. Implement `introspect` getter
4. Implement deepFreeze utility
5. Add tests

**Files:** `src/runtime-context.ts`, `tests/unit/introspection.test.ts`

---

### Phase 4: Testing (Day 5-6)

1. Write unit tests
2. Write property tests
3. Write integration tests
4. Run existing tests
5. Verify backward compatibility

**Files:** `tests/unit/`, `tests/property/`, `tests/integration/`

---

### Phase 5: Documentation (Day 7)

1. Update API.md
2. Update migration-guide.md
3. Update README.md
4. Add code examples
5. Document best practices

**Files:** `docs/api/API.md`, `docs/guides/migration-guide.md`, `README.md`

---

## Alternative Designs Considered

### Alternative 1: Mutable Host Context

**Approach:** Allow `runtime.updateHostContext(newContext)`

**Rejected Because:**
- Violates immutability principle
- Adds state management complexity
- Plugins could see inconsistent state
- Breaks explicit-over-implicit philosophy

---

### Alternative 2: Filtered Introspection

**Approach:** Add `internal: boolean` flag to resources, filter from introspection

**Deferred Because:**
- YAGNI (You Aren't Gonna Need It)
- SCR is for internal tools, not multi-tenant SaaS
- Adds complexity without clear need
- Can add later if requested (non-breaking)

---

### Alternative 3: structuredClone for Deep Freeze

**Approach:** Use `Object.freeze(structuredClone(obj))`

**Rejected Because:**
- Cannot clone functions
- Would break action/plugin definitions
- Performance overhead
- Custom deepFreeze is simpler and sufficient

---

## Migration Path

### For Existing Applications

**No changes required** - All existing code continues to work

**Optional adoption:**
```typescript
// Before (still works)
const runtime = new Runtime();

// After (opt-in)
const runtime = new Runtime({
  hostContext: { db, logger, cache }
});
```

---

### For New Applications

**Recommended pattern:**
```typescript
// 1. Create runtime with host context
const runtime = new Runtime({
  hostContext: {
    db: dbConnection,
    logger: appLogger,
    cache: cacheInstance
  }
});

// 2. Initialize
await runtime.initialize();

// 3. Plugins access via context.host
const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  setup(context) {
    const db = context.host.db;
    // Use db...
  }
};
```

---

## Success Criteria

### Technical Metrics

- ✅ Core size increase < 1KB
- ✅ Zero breaking changes
- ✅ All existing tests pass
- ✅ New tests coverage > 90%
- ✅ Performance overhead < 1ms
- ✅ Memory increase < 100KB

### Quality Metrics

- ✅ Philosophy alignment > 95%
- ✅ Documentation complete
- ✅ All properties validated
- ✅ Security reviewed
- ✅ Code review passed

---

**Document Version:** 1.0
**Status:** READY FOR IMPLEMENTATION
**Date:** 2024

