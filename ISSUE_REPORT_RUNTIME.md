# Bug Report: Runtime crashes in Browser due to `fast-glob` dependency

**Severity**: Critical (Breaks Browser Usage)
**Version**: v0.3.2

## Description
The runtime is advertised as "Universal" or capable of running in browser environments (as it accepts a [Context](file:///d:/code/ailly/src/core/webgpu-context.ts#1-44)), but importing `skeleton-crew-runtime` in a Vite/Webpack browser build causes immediate runtime errors due to strict Node.js dependencies.

The core issue is that `fast-glob` is imported at the top-level (likely for filesystem plugin discovery), which immediately attempts to access `os.platform()`, `fs`, and `path`.

## Error Log
```
Uncaught TypeError: os.platform is not a function
    at node_modules/fast-glob/out/utils/path.js
    at node_modules/fast-glob/out/index.js
```

## Reproduction
1.  `npm install skeleton-crew-runtime`
2.  Import `Runtime` in a React/Vue/Vanilla Vite project.
3.  Run `npm run dev`.
4.  Observe crash in console.

## Suggested Fixes

### Option 1: Lazy Import (Recommended)
Move the `fast-glob` import inside the `loadPluginsFromPath` (or equivalent) function, so it is only evaluated if the user actually invokes filesystem-based loading (which shouldn't happen in a browser anyway).

```typescript
// src/plugin-loader.ts
async function findPlugins(path: string) {
    // Dynamic import prevents top-level execution in browser
    const fg = (await import('fast-glob')).default; 
    return fg(path);
}
```

### Option 2: Browser Entry Point
Define a `"browser"` field in [package.json](file:///d:/code/ailly/package.json) that points to a build excluding the Node.js specific file-system loaders.

```json
"browser": "./dist/browser.js",
"main": "./dist/index.js"
```
In `browser.js`, the `PluginLoader` that uses `fs` should be a stub that throws "Not supported in browser".
