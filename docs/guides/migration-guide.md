# Migration Guide: Adopting Skeleton Crew Runtime

This guide helps you migrate existing applications to Skeleton Crew Runtime without requiring a complete rewrite.

## Table of Contents

- [Overview](#overview)
- [When to Migrate](#when-to-migrate)
- [Migration Strategies](#migration-strategies)
- [Step-by-Step Walkthrough](#step-by-step-walkthrough)
- [Testing During Migration](#testing-during-migration)
- [Common Pitfalls](#common-pitfalls)
- [FAQ](#faq)

## Overview

### Core Philosophy

Skeleton Crew Runtime is designed for **incremental adoption**. You don't need to rewrite your entire application - instead, introduce the runtime alongside existing code and migrate features progressively.

### Key Benefits

- **Zero Breaking Changes**: Existing code continues working
- **Gradual Migration**: Move one feature at a time
- **Risk Mitigation**: Easy rollback if issues arise
- **Improved Architecture**: Gain modularity, testability, and extensibility
- **Team Velocity**: Continue shipping while modernizing

## When to Migrate

### Good Candidates ✅

Your application is a good candidate for migration if it has:

**Growing Complexity**
- 1000+ lines of code
- Multiple features interacting
- Hard to add new features without breaking existing ones

**Testing Challenges**
- Hard to test features in isolation
- Complex mocking requirements
- Brittle integration tests

**Team Scaling Issues**
- Multiple developers working on same codebase
- Frequent merge conflicts
- Need clear ownership boundaries

**Modularity Needs**
- Want to enable/disable features dynamically
- Need plugin system for extensibility
- Planning to support third-party extensions

### Maybe Not Yet ⏸️

Consider waiting if your application is:

**Simple**
- Less than 500 lines of code
- Single feature or purpose
- No plans for growth

**Stable**
- No active development
- Feature complete
- Maintenance mode only

**Short-Lived**
- Prototypes or proof of concepts
- Temporary tools
- Will be replaced soon

## Migration Strategies

### 1. Gradual Migration Pattern

**Best for**: Most applications, especially those with clear feature boundaries

Add Skeleton Crew alongside existing code and migrate features one at a time.

```typescript
// Existing app structure
class LegacyApp {
  constructor() {
    this.tabs = [];
    this.settings = {};
  }
  
  createTab(params) {
    const tab = { id: Date.now(), ...params };
    this.tabs.push(tab);
    return tab;
  }
}

// Add Skeleton Crew alongside
import { Runtime } from 'skeleton-crew-runtime';

class HybridApp extends LegacyApp {
  constructor() {
    super();
    this.runtime = new Runtime();
    this.bridgeLegacyToRuntime();
  }
  
  async bridgeLegacyToRuntime() {
    const bridgePlugin = {
      name: 'legacy-bridge',
      version: '1.0.0',
      setup: (context) => {
        // Wrap existing methods as actions
        context.actions.registerAction({
          id: 'tabs:create',
          handler: (params) => this.createTab(params)
        });
        
        // Emit events for legacy operations
        const originalCreateTab = this.createTab.bind(this);
        this.createTab = (params) => {
          const result = originalCreateTab(params);
          context.events.emit('tab:created', result);
          return result;
        };
      }
    };
    
    this.runtime.registerPlugin(bridgePlugin);
    await this.runtime.initialize();
  }
}
```

**Pros**: No breaking changes, new features use Skeleton Crew immediately
**Cons**: Temporary code duplication during migration

### 2. Feature Flag Pattern

**Best for**: Large teams, gradual rollouts, A/B testing

Control which features use Skeleton Crew vs legacy implementation.

```typescript
const config = {
  features: {
    tabs: 'skeleton-crew',      // Migrated
    settings: 'legacy',          // Not yet migrated
    analytics: 'skeleton-crew'   // Migrated
  }
};

class FeatureFlaggedApp {
  constructor() {
    this.runtime = new Runtime();
    this.initializeFeatures();
  }
  
  async initializeFeatures() {
    if (config.features.tabs === 'skeleton-crew') {
      this.runtime.registerPlugin(tabsPlugin);
    } else {
      this.legacyTabs = new LegacyTabManager();
    }
    
    await this.runtime.initialize();
  }
  
  async createTab(params) {
    if (config.features.tabs === 'skeleton-crew') {
      return this.runtime.getContext().actions.runAction('tabs:create', params);
    } else {
      return this.legacyTabs.create(params);
    }
  }
}
```

**Pros**: Easy rollback, A/B testing, parallel development
**Cons**: Requires maintaining both code paths temporarily

### 3. Event Bridge Pattern

**Best for**: Applications with existing event systems (EventEmitter, custom pub/sub)

Connect existing event systems to Skeleton Crew's EventBus.

```typescript
import { EventEmitter } from 'events';
import { Runtime } from 'skeleton-crew-runtime';

class EventBridge {
  constructor(legacyEmitter, runtime) {
    this.legacyEmitter = legacyEmitter;
    this.context = runtime.getContext();
    this.setupBidirectionalBridge();
  }
  
  setupBidirectionalBridge() {
    // Forward legacy events to Skeleton Crew
    this.legacyEmitter.on('tab-created', (data) => {
      this.context.events.emit('tab:created', data);
    });
    
    // Forward Skeleton Crew events to legacy
    this.context.events.on('tab:created', (data) => {
      this.legacyEmitter.emit('tab-created', data);
    });
  }
}

// Usage
const legacyEmitter = new EventEmitter();
const runtime = new Runtime();
await runtime.initialize();
const bridge = new EventBridge(legacyEmitter, runtime);
```

**Pros**: Both systems communicate, gradual event handler migration
**Cons**: Temporary overhead of event forwarding

### 4. Adapter Plugin Pattern

**Best for**: Applications with well-defined service classes

Wrap existing services/classes as Skeleton Crew plugins.

```typescript
// Existing service
class TabService {
  async queryTabs(filter) {
    return await chrome.tabs.query(filter);
  }
  
  async closeTab(tabId) {
    await chrome.tabs.remove(tabId);
  }
}

// Adapter plugin - wraps existing service
export const tabServiceAdapter = {
  name: 'tab-service-adapter',
  version: '1.0.0',
  setup(context) {
    const service = new TabService();
    
    context.actions.registerAction({
      id: 'tabs:query',
      handler: (params) => service.queryTabs(params)
    });
    
    context.actions.registerAction({
      id: 'tabs:close',
      handler: ({ tabId }) => service.closeTab(tabId)
    });
  }
};
```

**Pros**: Minimal code changes, service logic unchanged
**Cons**: May not leverage full Skeleton Crew benefits initially

### 5. UI Coexistence Pattern

**Best for**: React/Vue applications with existing UI

Run Skeleton Crew features alongside existing UI framework.

```typescript
import { useState, useEffect } from 'react';
import { Runtime } from 'skeleton-crew-runtime';
import { newFeaturePlugin } from './plugins/new-feature.js';

function ExistingApp() {
  const [runtime, setRuntime] = useState(null);
  
  useEffect(() => {
    const rt = new Runtime();
    rt.registerPlugin(newFeaturePlugin);
    rt.initialize().then(() => setRuntime(rt));
  }, []);
  
  return (
    <div className="app">
      {/* Existing UI - unchanged */}
      <LegacyTabManager />
      <LegacySettings />
      
      {/* New Skeleton Crew-powered feature */}
      {runtime && <SkeletonCrewFeature runtime={runtime} />}
    </div>
  );
}
```

**Pros**: No UI rewrite needed, side-by-side comparison
**Cons**: Two architectural patterns in same app temporarily

## Step-by-Step Walkthrough

Let's walk through migrating a real browser extension from monolithic to plugin-based architecture.

### Before: Monolithic Architecture

```typescript
// background.js - everything in one file (500+ lines)
let tabs = [];
let settings = { theme: 'light' };

chrome.tabs.onCreated.addListener((tab) => {
  tabs.push(tab);
  updateUI(tab);
  saveToStorage(tab);
  logAnalytics('tab_created', tab);
  notifyUser('New tab created');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabs = tabs.filter(t => t.id !== tabId);
  updateUI();
  saveToStorage();
  logAnalytics('tab_closed', { tabId });
});

function closeTab(tabId) {
  chrome.tabs.remove(tabId);
  updateUI();
  saveToStorage();
  logAnalytics('tab_closed', { tabId });
}

// ... hundreds more lines
```

**Problems:**
- Tight coupling between features
- Hard to test in isolation
- Difficult to add new features
- No clear boundaries
- Mixed concerns (analytics, storage, UI)

### Step 1: Add Runtime (No Breaking Changes)

Install Skeleton Crew and initialize runtime alongside existing code.

```bash
npm install skeleton-crew-runtime
```

```typescript
// background.js
import { Runtime } from 'skeleton-crew-runtime';

const runtime = new Runtime();
await runtime.initialize();
const context = runtime.getContext();

// Keep ALL existing code working
let tabs = [];
let settings = { theme: 'light' };

chrome.tabs.onCreated.addListener((tab) => {
  tabs.push(tab);
  updateUI(tab);
  saveToStorage(tab);
  logAnalytics('tab_created', tab);
  notifyUser('New tab created');
  
  // NEW: Also emit event for future plugins
  context.events.emit('tab:created', tab);
});

// ... rest of legacy code unchanged
```

**Verify**: Existing functionality still works perfectly.

### Step 2: Extract Analytics to Plugin

Create first plugin for least coupled feature.

```typescript
// plugins/analytics.js
export const analyticsPlugin = {
  name: 'analytics',
  version: '1.0.0',
  setup(context) {
    context.events.on('tab:created', (tab) => {
      logAnalytics('tab_created', tab);
    });
    
    context.events.on('tab:closed', (data) => {
      logAnalytics('tab_closed', data);
    });
    
    context.events.on('settings:changed', (settings) => {
      logAnalytics('settings_changed', settings);
    });
  }
};
```

```typescript
// background.js
import { analyticsPlugin } from './plugins/analytics.js';

runtime.registerPlugin(analyticsPlugin);
await runtime.initialize();

// Remove analytics from legacy listeners
chrome.tabs.onCreated.addListener((tab) => {
  tabs.push(tab);
  updateUI(tab);
  saveToStorage(tab);
  // logAnalytics('tab_created', tab); ← REMOVED
  notifyUser('New tab created');
  context.events.emit('tab:created', tab);
});
```

**Test**: Verify analytics still works, then commit.

### Step 3: Extract Storage to Plugin

```typescript
// plugins/storage.js
export const storagePlugin = {
  name: 'storage',
  version: '1.0.0',
  setup(context) {
    context.events.on('tab:created', async (tab) => {
      await saveToStorage('tabs', tab);
    });
    
    context.events.on('tab:closed', async (data) => {
      await removeFromStorage('tabs', data.tabId);
    });
    
    context.actions.registerAction({
      id: 'storage:load',
      handler: async ({ key }) => {
        return await loadFromStorage(key);
      }
    });
  }
};
```

```typescript
// background.js
runtime.registerPlugin(storagePlugin);

chrome.tabs.onCreated.addListener((tab) => {
  tabs.push(tab);
  updateUI(tab);
  // saveToStorage(tab); ← REMOVED
  notifyUser('New tab created');
  context.events.emit('tab:created', tab);
});
```

**Test**: Verify storage operations work, then commit.

### Step 4: Extract Tab Management to Plugin

```typescript
// plugins/tabs.js
export const tabsPlugin = {
  name: 'tabs',
  version: '1.0.0',
  setup(context) {
    let tabs = [];
    
    chrome.tabs.onCreated.addListener((tab) => {
      tabs.push(tab);
      context.events.emit('tab:created', tab);
    });
    
    chrome.tabs.onRemoved.addListener((tabId) => {
      tabs = tabs.filter(t => t.id !== tabId);
      context.events.emit('tab:closed', { tabId });
    });
    
    context.actions.registerAction({
      id: 'tabs:query',
      handler: async (filter) => {
        return await chrome.tabs.query(filter || {});
      }
    });
    
    context.actions.registerAction({
      id: 'tabs:close',
      handler: async ({ tabId }) => {
        await chrome.tabs.remove(tabId);
      }
    });
  }
};
```

**Test**: Verify tab operations work, then commit.

### Step 5: Final State - Fully Migrated

```typescript
// background.js - clean and minimal (30 lines)
import { Runtime } from 'skeleton-crew-runtime';
import { tabsPlugin } from './plugins/tabs.js';
import { storagePlugin } from './plugins/storage.js';
import { analyticsPlugin } from './plugins/analytics.js';
import { notificationsPlugin } from './plugins/notifications.js';
import { settingsPlugin } from './plugins/settings.js';

const runtime = new Runtime();

runtime.registerPlugin(tabsPlugin);
runtime.registerPlugin(storagePlugin);
runtime.registerPlugin(analyticsPlugin);
runtime.registerPlugin(notificationsPlugin);
runtime.registerPlugin(settingsPlugin);

await runtime.initialize();

const context = runtime.getContext();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'action') {
    context.actions.runAction(message.action, message.params)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

chrome.runtime.onSuspend.addListener(async () => {
  await runtime.shutdown();
});
```

**Results:**
- ✅ 500+ lines → 30 lines in background.js
- ✅ Each feature isolated and testable
- ✅ Easy to add new features
- ✅ Clear separation of concerns
- ✅ No tight coupling

## Testing During Migration

### Test Both Implementations

During migration, test both legacy and new implementations:

```typescript
describe('Tab Management', () => {
  it('should work with legacy implementation', async () => {
    const app = new App({ useLegacy: true });
    const tab = await app.createTab({ url: 'https://example.com' });
    expect(tab).toBeDefined();
  });
  
  it('should work with Skeleton Crew implementation', async () => {
    const app = new App({ useLegacy: false });
    const tab = await app.createTab({ url: 'https://example.com' });
    expect(tab).toBeDefined();
  });
});
```

### Test Event Bridge

```typescript
describe('Event Bridge', () => {
  it('should forward legacy events to Skeleton Crew', (done) => {
    const bridge = new EventBridge(legacyEmitter, runtime);
    const context = runtime.getContext();
    
    context.events.on('tab:created', (data) => {
      expect(data.id).toBe(123);
      done();
    });
    
    legacyEmitter.emit('tab-created', { id: 123 });
  });
});
```

### Test Plugin Isolation

```typescript
describe('Analytics Plugin', () => {
  let runtime;
  
  beforeEach(async () => {
    runtime = new Runtime();
    runtime.registerPlugin(analyticsPlugin);
    await runtime.initialize();
  });
  
  afterEach(async () => {
    await runtime.shutdown();
  });
  
  it('should log analytics on tab created event', () => {
    const spy = vi.spyOn(console, 'log');
    runtime.getContext().events.emit('tab:created', { id: 1 });
    expect(spy).toHaveBeenCalledWith('Analytics:', 'tab_created', { id: 1 });
  });
});
```

## Common Pitfalls

### 1. Migrating Too Much at Once

❌ **Problem**: Trying to rewrite entire app in one go

✅ **Solution**: Migrate one feature at a time, test thoroughly between each step

### 2. Not Using Event Bridge

❌ **Problem**: Breaking existing event listeners during migration

✅ **Solution**: Use event bridge to maintain compatibility during transition

### 3. Tight Coupling in Plugins

❌ **Problem**: Plugins directly calling each other's methods

✅ **Solution**: Use events and actions for cross-plugin communication

### 4. Forgetting to Clean Up

❌ **Problem**: Leaving duplicate code paths (legacy + new)

✅ **Solution**: Remove legacy code once feature is fully migrated and tested

### 5. No Rollback Plan

❌ **Problem**: Can't revert if migration causes issues

✅ **Solution**: Use feature flags, keep legacy code until confident

## Migration Checklist

### Phase 1: Preparation
- [ ] Install Skeleton Crew Runtime
- [ ] Create `plugins/` directory structure
- [ ] Set up TypeScript configuration
- [ ] Identify features to migrate first (start with least coupled)
- [ ] Document current architecture

### Phase 2: Foundation
- [ ] Add Runtime instance to main entry point
- [ ] Initialize runtime alongside existing code
- [ ] Create event bridge if using existing event system
- [ ] Verify existing functionality still works
- [ ] Commit changes

### Phase 3: Incremental Migration
- [ ] Extract first feature to plugin (recommend: analytics or logging)
- [ ] Write tests for plugin
- [ ] Test thoroughly
- [ ] Commit changes
- [ ] Extract second feature (recommend: storage or data layer)
- [ ] Write tests for plugin
- [ ] Test thoroughly
- [ ] Commit changes
- [ ] Continue with remaining features

### Phase 4: Cleanup
- [ ] Remove legacy code as features are migrated
- [ ] Update tests to use plugin architecture
- [ ] Document plugin APIs
- [ ] Remove event bridge if no longer needed
- [ ] Update documentation

### Phase 5: Optimization
- [ ] Review plugin boundaries
- [ ] Optimize event usage
- [ ] Add comprehensive error handling
- [ ] Performance testing
- [ ] Security review

## FAQ

### How long does migration typically take?

It depends on application size and complexity:
- Small app (< 1000 LOC): 1-2 days
- Medium app (1000-5000 LOC): 1-2 weeks
- Large app (5000+ LOC): 2-4 weeks

Remember: you can ship features during migration!

### Can I migrate just part of my app?

Yes! Skeleton Crew is designed for partial adoption. You can migrate critical features and leave stable features as-is.

### What if I need to rollback?

Use feature flags to easily switch between legacy and Skeleton Crew implementations. Keep legacy code until you're confident.

### Do I need to rewrite my UI?

No! Use the UI Coexistence Pattern to run new features alongside existing UI. Migrate UI gradually or not at all.

### How do I handle breaking changes?

Skeleton Crew follows semantic versioning. Use version pinning and test thoroughly before upgrading major versions.

### Can I use Skeleton Crew with my existing framework?

Yes! Skeleton Crew is framework-agnostic. It works with React, Vue, Angular, or vanilla JavaScript.

### What about performance?

Skeleton Crew adds minimal overhead (< 1ms for most operations). The plugin architecture often improves performance by enabling lazy loading.

### How do I migrate tests?

Start by testing both implementations side-by-side. Once migrated, write plugin-specific tests using isolated Runtime instances.

## Next Steps

1. **Read the [Quick Start Guide](../README.md)** to understand Skeleton Crew basics
2. **Review the [API Documentation](./api-reference.md)** for detailed API information
3. **Check out [Example Applications](../../example/)** for reference implementations
4. **Join the community** for migration support and best practices

## Need Help?

- 📖 [Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/your-repo/discussions)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 📧 [Email Support](mailto:support@example.com)

---

**Remember**: Migration is a journey, not a destination. Take it one step at a time, test thoroughly, and don't hesitate to ask for help!
