import { ConsoleLogger, RuntimeState } from './types.js';
import { PluginRegistry } from './plugin-registry.js';
import { ScreenRegistry } from './screen-registry.js';
import { ActionEngine } from './action-engine.js';
import { EventBus } from './event-bus.js';
import { UIBridge } from './ui-bridge.js';
import { RuntimeContextImpl } from './runtime-context.js';
import { createPerformanceMonitor } from './performance.js';
import { DirectoryPluginLoader } from './plugin-loader.js';
export class Runtime {
    plugins;
    screens;
    actions;
    events;
    ui;
    context;
    initialized = false;
    pendingPlugins = [];
    logger;
    state = RuntimeState.Uninitialized;
    hostContext;
    config;
    performanceMonitor;
    pluginLoader;
    pluginPaths;
    pluginPackages;
    constructor(options) {
        this.logger = options?.logger ?? new ConsoleLogger();
        this.hostContext = options?.hostContext ?? {};
        this.config = options?.config ? { ...options.config } : {};
        if (this.config && typeof this.config === 'object') {
            Object.freeze(this.config);
        }
        this.performanceMonitor = createPerformanceMonitor(options?.enablePerformanceMonitoring ?? false);
        this.pluginLoader = new DirectoryPluginLoader(this.logger);
        this.pluginPaths = options?.pluginPaths ?? [];
        this.pluginPackages = options?.pluginPackages ?? [];
        this.validateHostContext(this.hostContext);
    }
    validateHostContext(context) {
        if (Object.keys(context).length === 0) {
            return;
        }
        Object.entries(context).forEach(([key, value]) => {
            try {
                const size = JSON.stringify(value).length;
                if (size > 1024 * 1024) {
                    this.logger.warn(`Host context key "${key}" is large (${size} bytes)`);
                }
            }
            catch (error) {
                this.logger.warn(`Host context key "${key}" could not be serialized for size check`);
            }
            if (typeof value === 'function') {
                this.logger.warn(`Host context key "${key}" is a function. Consider wrapping it in an object.`);
            }
        });
    }
    registerPlugin(plugin) {
        if (this.initialized) {
            throw new Error('Cannot register plugins after initialization. Use context.plugins.registerPlugin() instead.');
        }
        this.pendingPlugins.push(plugin);
    }
    async initialize() {
        if (this.initialized) {
            throw new Error('Runtime already initialized');
        }
        this.state = RuntimeState.Initializing;
        const timer = this.performanceMonitor.startTimer('runtime:initialize');
        try {
            this.plugins = new PluginRegistry(this.logger);
            if (this.pluginPaths.length > 0 || this.pluginPackages.length > 0) {
                this.logger.info('Loading plugins via DirectoryPluginLoader...');
                const discoveredPlugins = await this.pluginLoader.loadPlugins(this.pluginPaths, this.pluginPackages);
                for (const plugin of discoveredPlugins) {
                    this.plugins.registerPlugin(plugin);
                }
            }
            for (const plugin of this.pendingPlugins) {
                this.plugins.registerPlugin(plugin);
            }
            this.pendingPlugins = [];
            this.screens = new ScreenRegistry(this.logger);
            this.actions = new ActionEngine(this.logger);
            this.events = new EventBus(this.logger);
            this.ui = new UIBridge(this.logger);
            this.context = new RuntimeContextImpl(this.screens, this.actions, this.plugins, this.events, this, this.hostContext, this.logger);
            this.actions.setContext(this.context);
            await this.plugins.executeSetup(this.context);
            this.initialized = true;
            this.state = RuntimeState.Initialized;
            this.events.emit('runtime:initialized', { context: this.context });
            timer();
        }
        catch (error) {
            this.state = RuntimeState.Uninitialized;
            timer();
            throw error;
        }
    }
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        this.state = RuntimeState.ShuttingDown;
        this.events.emit('runtime:shutdown', { context: this.context });
        await this.plugins.executeDispose(this.context);
        try {
            await this.ui.shutdown();
        }
        catch (error) {
            this.logger.error('UIBridge shutdown failed', error);
        }
        this.screens.clear();
        this.actions.clear();
        this.events.clear();
        this.plugins.clear();
        this.actions.setContext(null);
        this.initialized = false;
        this.state = RuntimeState.Shutdown;
    }
    getContext() {
        if (!this.initialized) {
            throw new Error('Runtime not initialized');
        }
        return this.context;
    }
    isInitialized() {
        return this.state === RuntimeState.Initialized;
    }
    getState() {
        return this.state;
    }
    setUIProvider(provider) {
        this.ui.setProvider(provider);
    }
    getUIProvider() {
        return this.ui.getProvider();
    }
    renderScreen(screenId) {
        const screen = this.screens.getScreen(screenId);
        if (screen === null) {
            throw new Error(`Screen with id "${screenId}" not found`);
        }
        return this.ui.renderScreen(screen);
    }
    getConfig() {
        return this.config;
    }
    updateConfig(config) {
        if (!this.config || typeof this.config !== 'object') {
            this.config = config;
        }
        else {
            this.config = { ...this.config, ...config };
        }
        Object.freeze(this.config);
    }
}
//# sourceMappingURL=runtime.js.map