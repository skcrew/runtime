import type { RuntimeContext, ScreenDefinition, ActionDefinition, PluginDefinition } from './types.js';
import type { ScreenRegistry } from './screen-registry.js';
import type { ActionEngine } from './action-engine.js';
import type { PluginRegistry } from './plugin-registry.js';
import type { EventBus } from './event-bus.js';
import type { Runtime } from './types.js';

/**
 * RuntimeContext provides a safe API facade for subsystems.
 * Passed to plugins and action handlers without exposing internal mutable structures.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export class RuntimeContextImpl implements RuntimeContext {
  private screenRegistry: ScreenRegistry;
  private actionEngine: ActionEngine;
  private pluginRegistry: PluginRegistry;
  private eventBus: EventBus;
  private runtime: Runtime;

  constructor(
    screenRegistry: ScreenRegistry,
    actionEngine: ActionEngine,
    pluginRegistry: PluginRegistry,
    eventBus: EventBus,
    runtime: Runtime
  ) {
    this.screenRegistry = screenRegistry;
    this.actionEngine = actionEngine;
    this.pluginRegistry = pluginRegistry;
    this.eventBus = eventBus;
    this.runtime = runtime;
  }

  /**
   * Screens API - exposes Screen Registry operations
   * Requirement: 9.2
   */
  get screens() {
    return {
      registerScreen: (screen: ScreenDefinition): void => {
        this.screenRegistry.registerScreen(screen);
      },
      getScreen: (id: string): ScreenDefinition | null => {
        return this.screenRegistry.getScreen(id);
      },
      getAllScreens: (): ScreenDefinition[] => {
        return this.screenRegistry.getAllScreens();
      }
    };
  }

  /**
   * Actions API - exposes Action Engine operations
   * Requirement: 9.3
   */
  get actions() {
    return {
      registerAction: (action: ActionDefinition): void => {
        this.actionEngine.registerAction(action);
      },
      runAction: (id: string, params?: unknown): Promise<unknown> => {
        return this.actionEngine.runAction(id, params);
      }
    };
  }

  /**
   * Plugins API - exposes Plugin Registry operations
   * Requirement: 9.4
   */
  get plugins() {
    return {
      registerPlugin: (plugin: PluginDefinition): void => {
        this.pluginRegistry.registerPlugin(plugin);
      },
      getPlugin: (name: string): PluginDefinition | null => {
        return this.pluginRegistry.getPlugin(name);
      },
      getAllPlugins: (): PluginDefinition[] => {
        return this.pluginRegistry.getAllPlugins();
      }
    };
  }

  /**
   * Events API - exposes Event Bus operations
   * Requirement: 9.5
   */
  get events() {
    return {
      emit: (event: string, data?: unknown): void => {
        this.eventBus.emit(event, data);
      },
      on: (event: string, handler: (data: unknown) => void): (() => void) => {
        return this.eventBus.on(event, handler);
      }
    };
  }

  /**
   * Returns the Runtime instance
   * Requirement: 9.6
   */
  getRuntime(): Runtime {
    return this.runtime;
  }
}
