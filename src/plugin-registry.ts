import { PluginDefinition, RuntimeContext } from './types.js';

export class PluginRegistry {
  private plugins: Map<string, PluginDefinition>;
  private initializedPlugins: Set<string>;

  constructor() {
    this.plugins = new Map();
    this.initializedPlugins = new Set();
  }

  registerPlugin(plugin: PluginDefinition): void {
    // Validate required fields
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }
    if (!plugin.setup || typeof plugin.setup !== 'function') {
      throw new Error('Plugin must have a valid setup function');
    }

    // Check for duplicate plugin name
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name "${plugin.name}" is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): PluginDefinition | null {
    return this.plugins.get(name) ?? null;
  }

  getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  async executeSetup(context: RuntimeContext): Promise<void> {
    // Execute plugin setup callbacks sequentially in registration order
    for (const plugin of this.plugins.values()) {
      try {
        // Support both sync and async setup callbacks
        await plugin.setup(context);
        // Track successfully initialized plugins
        this.initializedPlugins.add(plugin.name);
      } catch (error) {
        // Abort on first plugin setup failure with plugin name in error
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Plugin "${plugin.name}" setup failed: ${errorMessage}`);
      }
    }
  }

  async executeDispose(context: RuntimeContext): Promise<void> {
    // Execute dispose only for initialized plugins in same order as setup
    for (const plugin of this.plugins.values()) {
      // Only dispose plugins that completed setup successfully
      if (this.initializedPlugins.has(plugin.name) && plugin.dispose) {
        try {
          // Support both sync and async dispose callbacks
          await plugin.dispose(context);
        } catch (error) {
          // Log dispose errors but continue cleanup
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Plugin "${plugin.name}" dispose failed: ${errorMessage}`);
        }
      }
    }
  }

  clear(): void {
    this.plugins.clear();
    this.initializedPlugins.clear();
  }
}
