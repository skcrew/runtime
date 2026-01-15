import { PluginDefinition, RuntimeContext, Logger, ValidationError, DuplicateRegistrationError } from './types.js';

export class PluginRegistry<TConfig = Record<string, unknown>> {
  private plugins: Map<string, PluginDefinition<TConfig>>;
  private initializedPlugins: string[]; // Changed from Set to Array to preserve order
  private logger: Logger;

  constructor(logger: Logger) {
    this.plugins = new Map();
    this.initializedPlugins = [];
    this.logger = logger;
  }

  registerPlugin(plugin: PluginDefinition<TConfig>): void {
    // Validate required fields with ValidationError
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new ValidationError('Plugin', 'name');
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new ValidationError('Plugin', 'version', plugin.name);
    }
    if (!plugin.setup || typeof plugin.setup !== 'function') {
      throw new ValidationError('Plugin', 'setup', plugin.name);
    }

    // Check for duplicate plugin name with DuplicateRegistrationError
    if (this.plugins.has(plugin.name)) {
      throw new DuplicateRegistrationError('Plugin', plugin.name);
    }

    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): PluginDefinition<TConfig> | null {
    return this.plugins.get(name) ?? null;
  }

  getAllPlugins(): PluginDefinition<TConfig>[] {
    // Return array copy to prevent external mutation
    return Array.from(this.plugins.values());
  }

  /**
   * Returns the names of all successfully initialized plugins.
   * Returns an array copy to prevent external mutation.
   * 
   * @returns Array of initialized plugin names in initialization order
   * 
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  getInitializedPlugins(): string[] {
    // Return array copy to prevent external mutation
    return [...this.initializedPlugins];
  }

  async executeSetup(context: RuntimeContext<TConfig>): Promise<void> {
    const initialized: string[] = [];
    let failingPluginName: string | undefined;

    try {
      // Execute plugin setup callbacks sequentially in registration order
      for (const plugin of this.plugins.values()) {
        failingPluginName = plugin.name; // Track current plugin in case it fails

        // Dependency Validation (Requirement 14.7)
        if (plugin.dependencies && plugin.dependencies.length > 0) {
          for (const dep of plugin.dependencies) {
            // Check if dependency is present in registry
            if (!this.plugins.has(dep)) {
              throw new Error(`Plugin "${plugin.name}" requires missing dependency "${dep}"`);
            }
            // Check if dependency is already initialized (order matters)
            // Note: SCR processes plugins in registration order. If dependencies are registered but not yet initialized,
            // it implies a wrong order.
            if (!this.initializedPlugins.includes(dep)) {
              throw new Error(`Plugin "${plugin.name}" requires dependency "${dep}" to be initialized first`);
            }
          }
        }

        // Config Validation (v0.3 Feature)
        // Validate plugin config before setup if validateConfig is defined
        if (plugin.validateConfig) {
          const validationResult = await plugin.validateConfig(context.config);
          const isValid = typeof validationResult === 'boolean'
            ? validationResult
            : validationResult.valid;

          if (!isValid) {
            const errors = typeof validationResult === 'object' && validationResult.errors
              ? validationResult.errors.join(', ')
              : 'config validation failed';
            throw new ValidationError('Plugin', `config (${errors})`, plugin.name);
          }
          this.logger.debug(`Plugin "${plugin.name}" config validated successfully`);
        }

        // Support both sync and async setup callbacks
        await plugin.setup(context);
        // Track successfully initialized plugins
        initialized.push(plugin.name);
        this.initializedPlugins.push(plugin.name);
        this.logger.debug(`Plugin "${plugin.name}" initialized successfully`);
      }
    } catch (error) {
      // Rollback: dispose already-initialized plugins in reverse order
      this.logger.error('Plugin setup failed, rolling back initialized plugins');

      for (let i = initialized.length - 1; i >= 0; i--) {
        const pluginName = initialized[i];
        const plugin = this.plugins.get(pluginName);

        if (plugin?.dispose) {
          try {
            await plugin.dispose(context);
            this.logger.debug(`Rolled back plugin: ${pluginName}`);
          } catch (disposeError) {
            this.logger.error(`Rollback dispose failed for plugin "${pluginName}"`, disposeError);
          }
        }
      }

      // Clear initializedPlugins after rollback
      this.initializedPlugins = [];

      // Re-throw with context including plugin name
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Plugin "${failingPluginName}" setup failed: ${errorMessage}`);
    }
  }

  async executeDispose(context: RuntimeContext<TConfig>): Promise<void> {
    // Dispose in reverse order of initialization
    for (let i = this.initializedPlugins.length - 1; i >= 0; i--) {
      const pluginName = this.initializedPlugins[i];
      const plugin = this.plugins.get(pluginName);

      if (plugin?.dispose) {
        try {
          // Support both sync and async dispose callbacks
          await plugin.dispose(context);
          this.logger.debug(`Disposed plugin: ${pluginName}`);
        } catch (error) {
          // Log dispose errors but continue cleanup
          this.logger.error(`Plugin "${pluginName}" dispose failed`, error);
        }
      }
    }
  }

  clear(): void {
    this.plugins.clear();
    this.initializedPlugins = [];
  }
}
