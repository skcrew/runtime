# Design Document

## Overview

The Skeleton Crew Playground is a terminal-based example application that demonstrates the full capabilities of the Skeleton Crew Runtime through a minimal, interactive implementation. The application consists of three feature plugins (core-demo, counter, settings), a terminal UI provider, and a main entry point that orchestrates initialization and user interaction.

The design follows a plugin-first architecture where all features are contributed through plugins, and the UI is provided through a separate UI provider plugin. This demonstrates the runtime's UI-agnostic nature and shows how different UI implementations (React, Vue, CLI, etc.) can be swapped without changing the core application logic.

## Architecture

### High-Level Structure

```
example/
├── index.ts                      # Main entry point
├── ui/
│   └── terminal-ui-provider.ts   # Terminal UI implementation
└── plugins/
    ├── core-demo.ts              # Home screen and demo features
    ├── counter.ts                # Counter feature with state
    └── settings.ts               # Settings management
```

### Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    example/index.ts                      │
│  - Creates Runtime                                       │
│  - Registers plugins                                     │
│  - Initializes runtime                                   │
│  - Registers UI provider                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ├──────────────────┐
                          ▼                  ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│   Skeleton Crew Runtime      │  │  Terminal UI Provider│
│  - PluginRegistry            │  │  - Screen rendering  │
│  - ScreenRegistry            │  │  - User input        │
│  - ActionEngine              │  │  - Event display     │
│  - EventBus                  │  │  - Navigation        │
│  - UIBridge                  │  └──────────────────────┘
└──────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Core Demo   │  │  Counter    │  │  Settings   │
│  Plugin     │  │   Plugin    │  │   Plugin    │
│             │  │             │  │             │
│ - home      │  │ - counter   │  │ - settings  │
│   screen    │  │   screen    │  │   screen    │
│             │  │ - increment │  │ - toggle    │
│             │  │ - decrement │  │   theme     │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Data Flow

1. **Initialization Flow**: Entry point → Runtime creation → Plugin registration → Runtime.initialize() → Plugin setup callbacks → UI provider registration
2. **Screen Navigation Flow**: User input → Terminal UI Provider → Runtime.renderScreen() → Screen lookup → UI provider renders screen
3. **Action Execution Flow**: User input → Terminal UI Provider → context.actions.runAction() → Action handler → State update → Event emission
4. **Event Flow**: Plugin emits event → EventBus → All subscribed handlers → UI updates

## Components and Interfaces

### Main Entry Point (example/index.ts)

**Responsibilities:**
- Create Runtime instance
- Register all plugins before initialization
- Initialize runtime
- Register Terminal UI Provider
- Handle graceful shutdown on exit

**Key Operations:**
```typescript
const runtime = new Runtime();
runtime.registerPlugin(coreDemoPlugin);
runtime.registerPlugin(counterPlugin);
runtime.registerPlugin(settingsPlugin);
await runtime.initialize();
const context = runtime.getContext();
runtime.setUIProvider(terminalUIProvider);
```

### Terminal UI Provider (example/ui/terminal-ui-provider.ts)

**Responsibilities:**
- Implement UIProvider interface (mount, renderScreen, unmount)
- Display screen menu and handle navigation
- Render screen content with formatted output
- Capture user input and trigger actions
- Display event logs in real-time
- Manage terminal state and cleanup

**State:**
- `currentScreen: string | null` - Currently displayed screen ID
- `eventLog: Array<{event: string, data: unknown}>` - Recent events for display
- `readline: Interface` - Node.js readline interface for input

**Key Methods:**
- `mount(target, context)` - Initialize terminal, display welcome, show screen menu
- `renderScreen(screen)` - Display screen title, content, and action menu
- `unmount()` - Cleanup readline interface and restore terminal
- `displayScreenMenu()` - Show list of all registered screens
- `handleUserInput(input)` - Process user commands and trigger actions
- `logEvent(event, data)` - Add event to log and display

### Core Demo Plugin (example/plugins/core-demo.ts)

**Responsibilities:**
- Register home screen with welcome message and overview
- Register interactive demonstration screens for each Skeleton Crew feature
- Provide educational actions that demonstrate runtime capabilities
- Subscribe to and display events from demo interactions

**Screens:**
- `home` - Welcome screen with application overview and navigation guide
- `demo-plugin-system` - Interactive demonstration of plugin registration and lifecycle
- `demo-screen-registry` - Display all registered screens with metadata inspection
- `demo-action-engine` - Interactive actions demonstrating parameter passing and execution
- `demo-event-bus` - Event emission and subscription demonstration with real-time display
- `demo-runtime-context` - Unified context API demonstration showing subsystem access

**Actions:**
- `demo:greet` - Simple action with no parameters (returns greeting)
- `demo:greet-user` - Action with parameters (accepts name, returns personalized greeting)
- `demo:calculate` - Action demonstrating parameter validation (accepts a, b, operation)
- `demo:emit-event` - Action that emits custom events for demonstration
- `demo:list-plugins` - Action that retrieves and displays all registered plugins
- `demo:list-screens` - Action that retrieves and displays all registered screens
- `demo:list-actions` - Action that retrieves and displays all registered actions

**Events:**
- Subscribes to `runtime:initialized` to log startup
- Subscribes to `demo:event-emitted` to demonstrate event handling
- Emits `demo:action-executed` when demo actions are triggered
- Emits `demo:event-emitted` when user triggers event emission demo

### Counter Plugin (example/plugins/counter.ts)

**Responsibilities:**
- Manage counter state
- Register counter screen
- Provide increment/decrement actions
- Emit events on state changes

**State:**
- `count: number` - Current counter value (starts at 0)

**Screens:**
- `counter` - Display current count and action options

**Actions:**
- `increment` - Increase count by 1, emit counter:changed
- `decrement` - Decrease count by 1, emit counter:changed
- `reset` - Set count to 0, emit counter:changed

**Events:**
- Emits `counter:changed` with `{value: number}` when count changes

### Settings Plugin (example/plugins/settings.ts)

**Responsibilities:**
- Manage application settings
- Register settings screen
- Provide theme toggle action
- Emit events on settings changes

**State:**
- `theme: 'light' | 'dark'` - Current theme (starts at 'light')

**Screens:**
- `settings` - Display current settings and action options

**Actions:**
- `toggle-theme` - Switch between light and dark themes, emit settings:changed

**Events:**
- Emits `settings:changed` with `{setting: string, value: unknown}` when settings change

## Data Models

### Plugin State

Each plugin manages its own state using simple JavaScript variables or objects. State is not shared between plugins except through events.

```typescript
// Counter plugin state
let count = 0;

// Settings plugin state
let theme: 'light' | 'dark' = 'light';
```

### Event Payloads

```typescript
// counter:changed event
interface CounterChangedEvent {
  value: number;
}

// settings:changed event
interface SettingsChangedEvent {
  setting: string;
  value: unknown;
}

// demo:action-executed event
interface DemoActionExecutedEvent {
  actionId: string;
  parameters: unknown;
  result: unknown;
  timestamp: string;
}

// demo:event-emitted event
interface DemoEventEmittedEvent {
  message: string;
  priority?: string;
  timestamp: string;
}
```

### Screen Component Identifiers

The Terminal UI Provider uses string-based component identifiers to determine how to render each screen:

```typescript
type ComponentIdentifier = 
  | 'HomeScreen'
  | 'CounterScreen'
  | 'SettingsScreen'
  | 'DemoPluginSystemScreen'
  | 'DemoScreenRegistryScreen'
  | 'DemoActionEngineScreen'
  | 'DemoEventBusScreen'
  | 'DemoRuntimeContextScreen';
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Plugin screen registration completeness

*For any* initialized example application, each plugin should register at least one screen, resulting in a screen count that equals or exceeds the plugin count.

**Validates: Requirements 2.4**

### Property 2: Screen menu completeness

*For any* set of registered screens, the Terminal UI Provider's screen menu should contain all screen IDs from the screen registry.

**Validates: Requirements 3.1**

### Property 3: Screen rendering includes title

*For any* screen definition, when rendered by the Terminal UI Provider, the output should contain the screen's title.

**Validates: Requirements 3.3**

### Property 4: Counter increment behavior

*For any* counter value, executing the increment action should increase the counter by exactly 1.

**Validates: Requirements 4.2**

### Property 5: Counter decrement behavior

*For any* counter value, executing the decrement action should decrease the counter by exactly 1.

**Validates: Requirements 4.3**

### Property 6: Counter change events

*For any* counter state change (increment, decrement, or reset), the counter plugin should emit a counter:changed event with the new value.

**Validates: Requirements 4.4**

### Property 7: Theme toggle idempotence

*For any* theme value, toggling the theme twice should return to the original theme value.

**Validates: Requirements 5.2**

### Property 8: Settings change events

*For any* settings change, the settings plugin should emit a settings:changed event containing the setting name and new value.

**Validates: Requirements 5.3**

### Property 9: Settings display completeness

*For any* settings state, the rendered settings screen should display all setting keys and their current values.

**Validates: Requirements 5.5**

### Property 10: Plugin initialization logging

*For any* set of registered plugins, the Terminal UI Provider should display initialization messages containing each plugin's name.

**Validates: Requirements 7.1**

### Property 11: Screen header formatting

*For any* rendered screen, the Terminal UI Provider output should contain a formatted header with the screen title.

**Validates: Requirements 7.2**

### Property 12: Action menu display

*For any* screen with available actions, the Terminal UI Provider should display a list containing identifiers for each action.

**Validates: Requirements 7.3**

### Property 13: Event log completeness

*For any* emitted event, the Terminal UI Provider's event log should contain an entry with the event name and data.

**Validates: Requirements 7.5**

### Property 14: Screen rendering produces output

*For any* screen definition, calling renderScreen on the Terminal UI Provider should produce non-empty output containing the screen's content.

**Validates: Requirements 8.5**

### Property 15: Demo screen registration completeness

*For any* initialized core-demo plugin, the plugin should register demonstration screens for plugin system, screen registry, action engine, event bus, and runtime context.

**Validates: Requirements 11.1**

### Property 16: Demo action execution returns results

*For any* demo action (greet, greet-user, calculate), executing the action should return a non-empty result value.

**Validates: Requirements 11.4**

### Property 17: Demo event emission propagation

*For any* demo event emission, all subscribed handlers should receive the event data.

**Validates: Requirements 11.5**

### Property 18: Demo action parameter validation

*For any* demo action that accepts parameters, providing valid parameters should execute successfully and invalid parameters should throw descriptive errors.

**Validates: Requirements 11.4**

## Error Handling

### Terminal UI Provider Errors

- **Invalid screen ID**: If renderScreen is called with a non-existent screen ID, the runtime will throw an error (handled by Runtime.renderScreen)
- **Readline errors**: If terminal input fails, log error and attempt to continue or gracefully shutdown
- **Action execution errors**: If an action handler throws, the ActionEngine wraps it in ActionExecutionError - display error message to user

### Plugin Errors

- **Setup failures**: If any plugin setup fails, the runtime's rollback mechanism handles cleanup (already tested in runtime)
- **Action handler errors**: Wrapped in ActionExecutionError by ActionEngine, displayed to user by Terminal UI Provider
- **Event handler errors**: Logged by EventBus, do not prevent other handlers from executing (already tested in runtime)

### User Input Errors

- **Invalid menu selection**: Display error message and re-prompt user
- **Invalid action selection**: Display error message and re-prompt user
- **Unexpected input**: Display help message with valid options

## Testing Strategy

### Unit Tests

Unit tests verify specific components and their behavior:

**Terminal UI Provider Tests:**
- Test mount initializes readline interface
- Test renderScreen produces formatted output
- Test unmount cleans up resources
- Test screen menu generation from registry
- Test event log formatting

**Plugin Tests:**
- Test counter plugin state management (increment, decrement, reset)
- Test settings plugin state management (theme toggle)
- Test core-demo plugin registers all demonstration screens
- Test core-demo plugin demo actions execute correctly
- Test core-demo plugin event emission and subscription
- Test plugin screen registration
- Test plugin action registration
- Test plugin event emission

**Integration Tests:**
- Test full initialization sequence (entry point → runtime → plugins → UI provider)
- Test screen navigation flow
- Test action execution flow
- Test event propagation between plugins
- Test graceful shutdown

### Property-Based Tests

Property-based tests verify universal properties using fast-check library with minimum 100 iterations:

**Property 1: Plugin screen registration completeness**
- Generate: Random number of mock plugins (1-10)
- Test: After initialization, screen count ≥ plugin count
- Tag: `**Feature: example-app, Property 1: Plugin screen registration completeness**`

**Property 2: Screen menu completeness**
- Generate: Random set of screen definitions (1-20 screens)
- Test: Menu contains all screen IDs from registry
- Tag: `**Feature: example-app, Property 2: Screen menu completeness**`

**Property 3: Screen rendering includes title**
- Generate: Random screen definitions with various titles
- Test: Rendered output contains screen title
- Tag: `**Feature: example-app, Property 3: Screen rendering includes title**`

**Property 4: Counter increment behavior**
- Generate: Random counter values (-1000 to 1000)
- Test: After increment, new value = old value + 1
- Tag: `**Feature: example-app, Property 4: Counter increment behavior**`

**Property 5: Counter decrement behavior**
- Generate: Random counter values (-1000 to 1000)
- Test: After decrement, new value = old value - 1
- Tag: `**Feature: example-app, Property 5: Counter decrement behavior**`

**Property 6: Counter change events**
- Generate: Random counter operations (increment/decrement/reset)
- Test: Each operation emits counter:changed with correct value
- Tag: `**Feature: example-app, Property 6: Counter change events**`

**Property 7: Theme toggle idempotence**
- Generate: Random theme values ('light' or 'dark')
- Test: Toggle twice returns to original theme
- Tag: `**Feature: example-app, Property 7: Theme toggle idempotence**`

**Property 8: Settings change events**
- Generate: Random settings changes
- Test: Each change emits settings:changed with setting name and value
- Tag: `**Feature: example-app, Property 8: Settings change events**`

**Property 9: Settings display completeness**
- Generate: Random settings objects with various keys
- Test: Rendered output contains all setting keys
- Tag: `**Feature: example-app, Property 9: Settings display completeness**`

**Property 10: Plugin initialization logging**
- Generate: Random set of plugin names (1-10 plugins)
- Test: Output contains all plugin names
- Tag: `**Feature: example-app, Property 10: Plugin initialization logging**`

**Property 11: Screen header formatting**
- Generate: Random screen definitions
- Test: Output contains formatted header with title
- Tag: `**Feature: example-app, Property 11: Screen header formatting**`

**Property 12: Action menu display**
- Generate: Random sets of actions (1-10 actions)
- Test: Output contains all action identifiers
- Tag: `**Feature: example-app, Property 12: Action menu display**`

**Property 13: Event log completeness**
- Generate: Random events with various names and data
- Test: Log contains entries for all emitted events
- Tag: `**Feature: example-app, Property 13: Event log completeness**`

**Property 14: Screen rendering produces output**
- Generate: Random screen definitions
- Test: renderScreen produces non-empty output
- Tag: `**Feature: example-app, Property 14: Screen rendering produces output**`

**Property 15: Demo screen registration completeness**
- Generate: Core-demo plugin instance
- Test: Plugin registers screens for plugin-system, screen-registry, action-engine, event-bus, and runtime-context demos
- Tag: `**Feature: example-app, Property 15: Demo screen registration completeness**`

**Property 16: Demo action execution returns results**
- Generate: Random demo action IDs (greet, greet-user, calculate) with valid parameters
- Test: Each action execution returns non-empty result
- Tag: `**Feature: example-app, Property 16: Demo action execution returns results**`

**Property 17: Demo event emission propagation**
- Generate: Random event names and data
- Test: All subscribed handlers receive emitted events
- Tag: `**Feature: example-app, Property 17: Demo event emission propagation**`

**Property 18: Demo action parameter validation**
- Generate: Random valid and invalid parameters for demo actions
- Test: Valid parameters execute successfully, invalid parameters throw descriptive errors
- Tag: `**Feature: example-app, Property 18: Demo action parameter validation**`

### Testing Framework

- **Unit & Integration Tests**: Vitest
- **Property-Based Tests**: fast-check library
- **Test Organization**: 
  - `tests/example/unit/` - Unit tests for individual components
  - `tests/example/integration/` - Integration tests for full flows
  - `tests/example/property/` - Property-based tests

### Manual Testing

- Run `npm run example` and verify:
  - Application starts without errors
  - All three plugins initialize
  - Screen menu displays all screens including demo screens
  - Navigation between screens works
  - Home screen displays welcome message and navigation guide
  - Plugin System Demo screen shows all registered plugins
  - Screen Registry Demo screen displays all screens with metadata
  - Action Engine Demo screen allows executing demo actions with parameters
  - Event Bus Demo screen shows real-time event propagation
  - Runtime Context Demo screen demonstrates unified API access
  - Counter increment/decrement works
  - Settings theme toggle works
  - Events are logged in real-time
  - Demo actions emit events that are displayed
  - Exit command shuts down gracefully
