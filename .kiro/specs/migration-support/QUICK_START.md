# Migration Support - Quick Start Guide

## For Implementers

### 1. Read These First (30 minutes)

1. ✅ [requirements.md](./requirements.md) - What to build
2. ✅ [design.md](./design.md) - How to build it
3. ✅ [../../.kiro/steering/migration-support.md](../../.kiro/steering/migration-support.md) - Guidelines

### 2. Start Implementation (Week 1)

**Day 1: Types**
```bash
# Edit src/types.ts
# Add RuntimeOptions.hostContext
# Add RuntimeContext.host
# Add IntrospectionAPI interface
# Add metadata interfaces
```

**Day 2: Runtime**
```bash
# Edit src/runtime.ts
# Store hostContext
# Add validateHostContext()
# Pass to RuntimeContext
# Write tests
```

**Day 3-4: RuntimeContext**
```bash
# Edit src/runtime-context.ts
# Implement host getter
# Implement introspect getter
# Add deepFreeze utility
# Write tests
```

**Day 5-6: Testing**
```bash
# Write unit tests
# Write property tests
# Write integration tests
# Run existing tests
```

**Day 7: Documentation**
```bash
# Update API.md
# Update migration-guide.md
# Update README.md
```

### 3. Execute Tasks

Open [tasks.md](./tasks.md) and click "Start task" next to each task item.

---

## For Reviewers

### Review Checklist

- [ ] Zero breaking changes
- [ ] All existing tests pass
- [ ] New tests coverage > 90%
- [ ] Documentation complete
- [ ] Philosophy alignment > 95%
- [ ] Performance < 1ms overhead
- [ ] Memory < 100KB increase
- [ ] No new dependencies

### Philosophy Check

- [ ] Core remains minimal
- [ ] No new subsystems
- [ ] No UI assumptions
- [ ] No environment assumptions
- [ ] Plugin-driven maintained

---

## Quick Reference

### What's Being Added

```typescript
// 1. Host Context Injection
const runtime = new Runtime({
  hostContext: { db, logger, cache }
});

// 2. Access in plugins
context.host.db.query('...');

// 3. Introspection API
context.introspect.listActions();
context.introspect.getActionDefinition('id');
context.introspect.getMetadata();
```

### What's NOT Being Added

- ❌ Module system
- ❌ Sandboxing
- ❌ Plugin registry
- ❌ CLI framework
- ❌ Migration wizard
- ❌ Filtered introspection
- ❌ Updatable context

---

## Common Questions

**Q: Will this break existing code?**
A: No. All changes are backward compatible.

**Q: Do I need to update my plugins?**
A: No. Existing plugins work unchanged. New features are opt-in.

**Q: How big is the change?**
A: < 1KB added to core runtime.

**Q: When will this be released?**
A: v0.3.0 in approximately 2 weeks.

---

**Document Version:** 1.0
**Date:** 2024

