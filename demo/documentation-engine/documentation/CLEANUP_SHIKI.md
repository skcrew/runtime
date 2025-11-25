# Cleanup: Remove Shiki Dependency

## Current Status

The project currently has **both Shiki and Prism** in dependencies, but only **Prism is being used**.

## Evidence

### Active Plugin
```typescript
// src/plugins/index.ts
export { createCodeBlockPlugin } from './code-block-prism.js';  // ✅ Using Prism
```

### Unused Files
- `src/plugins/code-block.ts` - Shiki-based plugin (not exported)
- `src/components/CodeBlock.js` - May reference Shiki

## Recommendation

### 1. Remove Shiki from package.json

```bash
npm uninstall shiki
```

This will remove:
- `shiki` package (~600KB)
- `@types/shiki` if present

### 2. Delete Unused Files

```bash
rm src/plugins/code-block.ts
```

Or keep it as a reference implementation if you want to switch back to Shiki later.

### 3. Update Documentation

The following files reference Shiki and should be updated:
- ✅ `vite.config.ts` - Already updated to use Prism
- ✅ `documentation/BUILD_OPTIMIZATION_STRATEGY.md` - Already updated
- ✅ `documentation/VITE_OPTIMIZATION_SUMMARY.md` - Already updated

## Why Keep Prism?

**Advantages of Prism over Shiki:**
- ✅ **Much smaller** - ~50KB vs ~600KB (12x smaller)
- ✅ **Faster load time** - Less JavaScript to parse
- ✅ **Simpler API** - Easier to use and configure
- ✅ **Good enough** - Supports all common languages
- ✅ **No build warnings** - Stays well under chunk size limits

**When to use Shiki:**
- Need TextMate grammar support
- Want VS Code-quality highlighting
- Bundle size is not a concern
- Need advanced theme support

## Implementation

If you want to remove Shiki:

```bash
# 1. Remove from dependencies
npm uninstall shiki

# 2. Remove unused plugin file (optional)
rm demo/documentation-engine/src/plugins/code-block.ts

# 3. Verify build still works
npm run build

# 4. Check bundle sizes
ls -lh dist/assets/
```

## Current State

- ✅ Vite config uses Prism
- ✅ Documentation updated
- ⚠️ Shiki still in package.json (can be removed)
- ⚠️ Unused code-block.ts file (can be removed)

## Decision

**Recommended:** Remove Shiki to reduce dependencies and avoid confusion.

**Alternative:** Keep Shiki as a dev dependency for future reference, but document that Prism is the active implementation.
