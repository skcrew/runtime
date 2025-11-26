# Migration Support Spec

## Overview

This spec defines the implementation of migration support features for Skeleton Crew Runtime (SCR), enabling legacy applications to incrementally adopt SCR without requiring complete rewrites.

**Status:** ✅ READY FOR IMPLEMENTATION
**Phase:** Phase 1 - Core Stabilization (v0.3.0)
**Estimated Time:** 7-10 days

---

## Quick Links

- **[Requirements](./requirements.md)** - User stories and acceptance criteria
- **[Design](./design.md)** - Technical architecture and implementation details
- **[Tasks](./tasks.md)** - Implementation task list
- **[Steering Guide](./.kiro/steering/migration-support.md)** - Implementation guidelines

---

## What's Being Built

### Feature 1: Host Context Injection

Allow host applications to inject services (database, logger, cache) into the runtime so plugins can access them without tight coupling.

```typescript
// Host app injects services
const runtime = new Runtime({
  hostContext: {
    db: dbConnection,
    logger: appLogger,
    cache: cacheInstance
  }
});

// Plugin accesses services
const plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  setup(context) {
    const db = context.host.db; // Access injected service
    // Use db...
  }
};
```

**Key Properties:**
- Immutable after initialization
- Validated with warnings (not errors)
- Frozen to prevent mutation
- Defaults to empty object

---

### Feature 2: Introspection API

Provide metadata queries for debugging, admin dashboards, and tooling.

```typescript
const context = runtime.getContext();

// Query actions
const actions = context.introspect.listActions();
const actionMeta = context.introspect.getActionDefinition('my:action');

// Query plugins
const plugins = context.introspect.listPlugins();
const pluginMeta = context.introspect.getPluginDefinition('my-plugin');

// Query screens
const screens = context.introspect.listScreens();
const screenMeta = context.introspect.getScreenDefinition('my:screen');

// Query runtime
const runtimeMeta = context.introspect.getMetadata();
```

**Key Properties:**
- Returns metadata only (no implementations)
- All results deeply frozen
- Returns null for missing resources
- Synchronous queries

---

## Requirements Summary

**10 Requirements with 50 Acceptance Criteria:**

1. Host Context Injection (5 criteria)
2. Host Context Validation (4 criteria)
3. Introspection API - Actions (5 criteria)
4. Introspection API - Plugins (5 criteria)
5. Introspection API - Screens (5 criteria)
6. Introspection API - Runtime (5 criteria)
7. Deep Freeze Utility (5 criteria)
8. Backward Compatibility (5 criteria)
9. TypeScript Type Safety (5 criteria)
10. Documentation (5 criteria)

**All requirements use EARS format** (WHEN/THEN patterns)

---

## Design Highlights

### Architecture

```
Host Application
    ↓ (injects services)
Runtime
    ↓ (validates & stores)
RuntimeContext
    ↓ (exposes frozen copy)
Plugins
    ↓ (access via context.host)
```

### Correctness Properties

7 properties validated via property-based testing:

1. **Host Context Immutability** - Cannot mutate context.host
2. **Host Context Isolation** - No cross-contamination between runtimes
3. **Introspection Metadata Immutability** - Cannot mutate results
4. **Introspection Metadata Completeness** - Accurate metadata
5. **Introspection No Implementation Exposure** - No functions exposed
6. **Backward Compatibility** - Existing code works unchanged
7. **Validation Non-Interference** - Warnings don't break initialization

### Key Design Decisions

- ✅ Immutable host context (no updateHostContext method)
- ✅ Metadata-only introspection (no handler exposure)
- ✅ Custom deepFreeze (not structuredClone)
- ✅ Warnings for validation (not errors)
- ✅ Return null for missing resources (not undefined)
- ❌ No filtered introspection (YAGNI - defer to v0.4.0+)
- ❌ No runtime type checking (types are compile-time only)

---

## Implementation Tasks

**9 Major Tasks with 35 Sub-tasks:**

1. Update type definitions (1 task)
2. Implement host context injection (4 tasks, 1 optional)
3. Implement host property (5 tasks, 3 optional)
4. Implement deep freeze utility (2 tasks, 1 optional)
5. Implement introspection API (12 tasks, 7 optional)
6. Verify backward compatibility (4 tasks, all optional)
7. Integration testing (3 tasks, all optional)
8. Documentation (3 tasks)
9. Final validation (4 tasks, 3 optional)

**Optional tasks marked with `*`** - Tests and validation

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

## Files to Modify

### Core Files (3 files)

1. `src/types.ts` - Add interfaces and types
2. `src/runtime.ts` - Add host context handling
3. `src/runtime-context.ts` - Add host property and introspection

### Test Files (NEW)

1. `tests/unit/host-context.test.ts` - Host context tests
2. `tests/unit/introspection.test.ts` - Introspection tests
3. `tests/unit/deep-freeze.test.ts` - Deep freeze tests
4. `tests/integration/migration-support.test.ts` - Integration tests
5. `tests/property/host-context.property.test.ts` - Property tests
6. `tests/property/introspection.property.test.ts` - Property tests

### Documentation Files (3 files)

1. `docs/api/API.md` - API documentation
2. `docs/guides/migration-guide.md` - Migration guide
3. `README.md` - Main README

---

## Out of Scope

Explicitly NOT included in this spec:

1. ❌ Module System - Use JavaScript modules
2. ❌ Sandboxing - Host app's responsibility
3. ❌ Plugin Registry - Use npm
4. ❌ CLI Framework - Out of scope
5. ❌ Migration Wizard - External tool
6. ❌ Adapter System (as core) - Use plugins
7. ❌ Filtered Introspection - Defer to v0.4.0+
8. ❌ Updatable Host Context - Immutable only
9. ❌ Runtime Type Checking - Compile-time only

---

## Getting Started

### For Implementers

1. Read [requirements.md](./requirements.md) - Understand what to build
2. Read [design.md](./design.md) - Understand how to build it
3. Read [steering guide](../../.kiro/steering/migration-support.md) - Implementation guidelines
4. Follow [tasks.md](./tasks.md) - Execute tasks in order
5. Follow [test standards](../../docs/migration/TEST_STANDARDS.md) - Quality requirements

### For Reviewers

1. Verify zero breaking changes
2. Check philosophy alignment (> 95%)
3. Verify all tests pass
4. Check documentation completeness
5. Review code against steering guide

---

## Timeline

**Phase 1: Core Stabilization (v0.3.0) - 2 weeks**

- Week 1: Implementation (Tasks 1-5)
- Week 2: Testing & Documentation (Tasks 6-9)

**Deliverables:**
- ✅ Host context injection
- ✅ Introspection API
- ✅ Complete test suite
- ✅ Updated documentation

---

## References

### Planning Documents

- [Final Plan](../../docs/migration/FINAL_PLAN.md) - Approved implementation plan
- [Refinement Response](../../docs/migration/REFINEMENT_RESPONSE.md) - Design decisions
- [Upgrade Summary](../../docs/migration/UPGRADE_SUMMARY.md) - Executive summary

### Standards

- [Test Standards](../../docs/migration/TEST_STANDARDS.md) - Testing requirements
- [Migration Patterns](../../.kiro/steering/migration-patterns.md) - Usage patterns

---

## Questions?

### "Why immutable host context?"

Simplicity and safety. Mutable context adds state management complexity and potential for bugs. If you need mutable services, inject a mutable object (like a Map or class instance).

### "Why no filtered introspection?"

YAGNI (You Aren't Gonna Need It). SCR is for internal tools, not multi-tenant SaaS. We can add filtering later if there's demand (non-breaking change).

### "Why custom deepFreeze instead of structuredClone?"

structuredClone cannot clone functions, which would break our metadata objects. Custom deepFreeze is simpler and handles our use case perfectly.

### "Will this break my existing code?"

No. All changes are additive and backward compatible. Existing code works without modifications.

---

**Document Version:** 1.0
**Status:** ✅ READY FOR IMPLEMENTATION
**Date:** 2024

