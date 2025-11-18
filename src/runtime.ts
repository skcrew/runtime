import type { RuntimeContext, UIProvider, PluginDefinition } from './types.js';
import { PluginRegistry } from './plugin-registry.js';
import { ScreenRegistry } from './screen-registry.js';
import { ActionEngine } from './action-engine.js';
import { EventBus } from './event-bus.js';
import { UIBridge } from './ui-bridge.js';
import { RuntimeContextImpl } from './runtime-context.js';

/**
 * Runtime is the main orchestrator that coordinates all subsystems.
 * Handles initialization, shutdown, and lifecycle state tracking.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.5, 9.7, 9.9, 15.1, 15.3, 15.5
 */
export class Runtime {
  private plugins!: PluginRegistry;
  private screens!: ScreenRegistry;
  private actions!: ActionEngine;
  private events!: EventBus;
  private ui!: UIBridge;
  private context!: RuntimeContext;
  private initialized: boolean = false;
  private pendingPlugins: PluginDefinition[] = [];

  /**
   * Registers a plugin before initialization.
   * Plugins registered this way will have their setup callbacks executed during initialize().
   * 
   * @param plugin - The plugin definition to register
   * @throws Error if runtime is already initialized
   */
  registerPlugin(plugin: PluginDefinition): void {
    if (this.initialized) {
      throw new Error('Cannot register plugins after initialization. Use context.plugins.registerPlugin() instead.');
    }
    this.pendingPlugins.push(plugin);
  }

  /**
   * Initializes the runtime following the strict initialization sequence.
   * Creates all subsystems in order, then executes plugin setup callbacks.
   * 
   * @throws Error if initialize is called twice
   * @throws Error if any plugin setup fails
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.5, 15.1, 15.3, 15.5
   */
  async initialize(): Promise<void> {
    // Throw error if initialize called twice (Requirement 15.1)
    if (this.initialized) {
      throw new Error('Runtime already initialized');
    }

    // Strict initialization sequence (Requirements 2.1, 2.2, 2.3, 2.4)
    
    // 1. Create PluginRegistry (Requirement 2.1)
    this.plugins = new PluginRegistry();
    
    // Register pending plugins
    for (const plugin of this.pendingPlugins) {
      this.plugins.registerPlugin(plugin);
    }
    this.pendingPlugins = [];
    
    // 2. Create ScreenRegistry (Requirement 2.2)
    this.screens = new ScreenRegistry();
    
    // 3. Create ActionEngine (Requirement 2.3)
    this.actions = new ActionEngine();
    
    // 4. Create EventBus (Requirement 2.4)
    this.events = new EventBus();
    
    // 5. Create UIBridge
    this.ui = new UIBridge();
    
    // 6. Create RuntimeContext after all subsystems (Requirements 2.4, 9.7)
    this.context = new RuntimeContextImpl(
      this.screens,
      this.actions,
      this.plugins,
      this.events,
      this
    );
    
    // 7. Pass RuntimeContext to ActionEngine (Requirement 9.9)
    this.actions.setContext(this.context);
    
    // 8. Execute plugin setup callbacks in registration order (Requirements 2.5, 2.6, 3.1)
    // This will abort on first plugin setup failure (Requirement 3.1)
    await this.plugins.executeSetup(this.context);
    
    // Mark as initialized
    this.initialized = true;
  }

  /**
   * Shuts down the runtime following the strict shutdown sequence.
   * Disposes initialized plugins, clears all registries, and releases resources.
   * Safe to call multiple times (idempotent).
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 15.2, 15.4, 15.6
   */
  async shutdown(): Promise<void> {
    // Make shutdown idempotent - safe to call multiple times (Requirement 4.5)
    if (!this.initialized) {
      return;
    }

    // 1. Execute dispose callbacks only for initialized plugins (Requirements 4.2, 4.3)
    // Dispose errors are logged but do not prevent cleanup (Requirement 4.4)
    await this.plugins.executeDispose(this.context);

    // 2. Clear all registries (Requirement 4.5)
    this.screens.clear();
    this.actions.clear();
    this.events.clear();
    this.plugins.clear();

    // 3. Set initialized flag to false (Requirement 4.5)
    this.initialized = false;
  }

  /**
   * Returns the RuntimeContext for this runtime instance.
   * 
   * @returns The RuntimeContext
   * @throws Error if runtime is not initialized
   * 
   * Requirement: 9.1
   */
  getContext(): RuntimeContext {
    if (!this.initialized) {
      throw new Error('Runtime not initialized');
    }
    return this.context;
  }

  /**
   * Registers a UI provider with the runtime.
   * Delegates to UIBridge subsystem.
   * Can be called after initialization completes.
   * 
   * @param provider - The UI provider implementation
   * @throws Error if provider is invalid or already registered
   * 
   * Requirements: 10.3, 10.9
   */
  setUIProvider(provider: UIProvider): void {
    this.ui.setProvider(provider);
  }

  /**
   * Returns the registered UI provider.
   * Delegates to UIBridge subsystem.
   * 
   * @returns The registered UIProvider or null if none registered
   * 
   * Requirement: 10.4
   */
  getUIProvider(): UIProvider | null {
    return this.ui.getProvider();
  }

  /**
   * Renders a screen by looking it up in the ScreenRegistry and delegating to UIBridge.
   * 
   * @param screenId - The screen identifier to render
   * @returns The result from the UI provider's render method
   * @throws Error if screen is not found
   * @throws Error if no UI provider is registered
   * 
   * Requirement: 10.5
   */
  renderScreen(screenId: string): unknown {
    // Look up the screen in the registry
    const screen = this.screens.getScreen(screenId);
    
    // Throw if screen not found
    if (screen === null) {
      throw new Error(`Screen with id "${screenId}" not found`);
    }

    // Delegate to UIBridge to render the screen
    return this.ui.renderScreen(screen);
  }
}
