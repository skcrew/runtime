---
inclusion: manual
---

# Example Application Guidelines

## Purpose

The example application demonstrates Skeleton Crew Runtime's capabilities through a minimal, plugin-driven application that showcases all core features without imposing UI framework requirements.

## Example App: "Skeleton Crew Playground"

A plugin-driven mini application loader that demonstrates:
- Runtime-driven architecture (100%)
- Zero UI assumptions (but extensible with React/Vue plugins)
- Screens, actions, events, and plugins working together
- Minimal code with high expressiveness
- Perfect for demos, documentation, and validation

## What the Example App Demonstrates

1. Creates a Runtime instance
2. Registers multiple plugins (core-demo, settings, counter)
3. Each plugin contributes:
   - Screen definitions
   - Action handlers
   - Event listeners
4. A simple UI provider plugin renders:
   - Menu of available screens
   - Active screen content
   - Action trigger buttons
   - Event logs

## Example App Structure

```
example/
  index.ts                      # Main entry point
  ui/
    terminal-ui-provider.ts     # Terminal UI plugin
  plugins/
    core-demo.ts               # Core demo plugin
    counter.ts                 # Counter feature plugin
    settings.ts                # Settings feature plugin
```

## Plugin Pattern

Each plugin exports a standard structure:

```typescript
export const plugin = {
    name: "plugin-name",
    version: "1.0.0",
    setup(context) {
        // Register screens
        context.screens.registerScreen({
            id: "screen-id",
            title: "Screen Title",
            component: ScreenComponent,
        });

        // Register actions
        context.actions.registerAction({
            id: "action-id",
            handler: (params) => { /* action logic */ }
        });

        // Subscribe to events
        context.events.on("event:name", (data) => {
            /* handle event */
        });
    }
}
```

## Terminal UI Provider Pattern

```typescript
export const terminalUIProvider = {
    mount(runtime) {
        // Initialize UI
    },
    render(screen, context) {
        // Render screen content
    }
};
```

## Example User Flow

1. User runs: `npm run example`
2. Runtime initializes and loads plugins
3. Terminal UI displays available screens
4. User selects a screen (e.g., "counter")
5. Screen displays with available actions
6. User triggers actions (e.g., increment)
7. Events fire and update state
8. UI reflects changes

## Example Terminal Output

```
[SkeletonCrew] Initializing runtime...
[Plugin] core-demo.setup
[Plugin] counter.setup
[Plugin] settings.setup

UI Ready.

Available screens:
1. home
2. counter
3. settings

Choose a screen:
> 2

== Counter Screen ==
Current count: 0
[a] Increment
[b] Decrement
[c] Back

> a
[action] increment
[event] counter:changed → 1
```

## Why This Example is Ideal

- Demonstrates **every** core feature (plugins, screens, actions, events, UI provider)
- Proves runtime lifecycle and instance isolation
- Shows plugin-driven extensibility
- No React/Vue assumptions (but can be added later)
- Minimal code that feels "framework-worthy"
- Perfect for README, demos, and validation
- Mimics successful plugin architectures (Expo Router, Obsidian, VSCode)

## Key Principles for Example App

- Keep it minimal but impressive
- Show real plugin composition
- Demonstrate cross-plugin communication via events
- Prove UI-agnostic architecture
- Make it easy to understand and extend
- Validate the developer experience of using Skeleton Crew
