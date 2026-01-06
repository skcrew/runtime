import { ValidationError, DuplicateRegistrationError } from './types.js';
export class PluginRegistry {
    plugins;
    initializedPlugins;
    logger;
    constructor(logger) {
        this.plugins = new Map();
        this.initializedPlugins = [];
        this.logger = logger;
    }
    registerPlugin(plugin) {
        if (!plugin.name || typeof plugin.name !== 'string') {
            throw new ValidationError('Plugin', 'name');
        }
        if (!plugin.version || typeof plugin.version !== 'string') {
            throw new ValidationError('Plugin', 'version', plugin.name);
        }
        if (!plugin.setup || typeof plugin.setup !== 'function') {
            throw new ValidationError('Plugin', 'setup', plugin.name);
        }
        if (this.plugins.has(plugin.name)) {
            throw new DuplicateRegistrationError('Plugin', plugin.name);
        }
        this.plugins.set(plugin.name, plugin);
    }
    getPlugin(name) {
        return this.plugins.get(name) ?? null;
    }
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    getInitializedPlugins() {
        return [...this.initializedPlugins];
    }
    async executeSetup(context) {
        const initialized = [];
        let failingPluginName;
        try {
            for (const plugin of this.plugins.values()) {
                failingPluginName = plugin.name;
                if (plugin.dependencies && plugin.dependencies.length > 0) {
                    for (const dep of plugin.dependencies) {
                        if (!this.plugins.has(dep)) {
                            throw new Error(`Plugin "${plugin.name}" requires missing dependency "${dep}"`);
                        }
                        if (!this.initializedPlugins.includes(dep)) {
                            throw new Error(`Plugin "${plugin.name}" requires dependency "${dep}" to be initialized first`);
                        }
                    }
                }
                await plugin.setup(context);
                initialized.push(plugin.name);
                this.initializedPlugins.push(plugin.name);
                this.logger.debug(`Plugin "${plugin.name}" initialized successfully`);
            }
        }
        catch (error) {
            this.logger.error('Plugin setup failed, rolling back initialized plugins');
            for (let i = initialized.length - 1; i >= 0; i--) {
                const pluginName = initialized[i];
                const plugin = this.plugins.get(pluginName);
                if (plugin?.dispose) {
                    try {
                        await plugin.dispose(context);
                        this.logger.debug(`Rolled back plugin: ${pluginName}`);
                    }
                    catch (disposeError) {
                        this.logger.error(`Rollback dispose failed for plugin "${pluginName}"`, disposeError);
                    }
                }
            }
            this.initializedPlugins = [];
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Plugin "${failingPluginName}" setup failed: ${errorMessage}`);
        }
    }
    async executeDispose(context) {
        for (let i = this.initializedPlugins.length - 1; i >= 0; i--) {
            const pluginName = this.initializedPlugins[i];
            const plugin = this.plugins.get(pluginName);
            if (plugin?.dispose) {
                try {
                    await plugin.dispose(context);
                    this.logger.debug(`Disposed plugin: ${pluginName}`);
                }
                catch (error) {
                    this.logger.error(`Plugin "${pluginName}" dispose failed`, error);
                }
            }
        }
    }
    clear() {
        this.plugins.clear();
        this.initializedPlugins = [];
    }
}
//# sourceMappingURL=plugin-registry.js.map