function deepFreeze(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
        const value = obj[prop];
        if (typeof value === 'function') {
            return;
        }
        if (value && typeof value === 'object' && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return obj;
}
export class RuntimeContextImpl {
    screenRegistry;
    actionEngine;
    pluginRegistry;
    eventBus;
    runtime;
    frozenHostContext;
    introspectionAPI;
    loggerInstance;
    cachedScreensAPI;
    cachedActionsAPI;
    cachedPluginsAPI;
    cachedEventsAPI;
    constructor(screenRegistry, actionEngine, pluginRegistry, eventBus, runtime, hostContext, logger) {
        this.screenRegistry = screenRegistry;
        this.actionEngine = actionEngine;
        this.pluginRegistry = pluginRegistry;
        this.eventBus = eventBus;
        this.runtime = runtime;
        this.loggerInstance = logger;
        this.frozenHostContext = Object.freeze({ ...hostContext });
        this.introspectionAPI = this.createIntrospectionAPI();
        this.cachedScreensAPI = this.createScreensAPI();
        this.cachedActionsAPI = this.createActionsAPI();
        this.cachedPluginsAPI = this.createPluginsAPI();
        this.cachedEventsAPI = this.createEventsAPI();
    }
    get screens() {
        return this.cachedScreensAPI;
    }
    createScreensAPI() {
        return {
            registerScreen: (screen) => {
                return this.screenRegistry.registerScreen(screen);
            },
            getScreen: (id) => {
                return this.screenRegistry.getScreen(id);
            },
            getAllScreens: () => {
                return this.screenRegistry.getAllScreens();
            }
        };
    }
    get actions() {
        return this.cachedActionsAPI;
    }
    createActionsAPI() {
        return {
            registerAction: (action) => {
                return this.actionEngine.registerAction(action);
            },
            runAction: (id, params) => {
                return this.actionEngine.runAction(id, params);
            }
        };
    }
    get plugins() {
        return this.cachedPluginsAPI;
    }
    createPluginsAPI() {
        return {
            registerPlugin: (plugin) => {
                this.pluginRegistry.registerPlugin(plugin);
            },
            getPlugin: (name) => {
                return this.pluginRegistry.getPlugin(name);
            },
            getAllPlugins: () => {
                return this.pluginRegistry.getAllPlugins();
            },
            getInitializedPlugins: () => {
                return this.pluginRegistry.getInitializedPlugins();
            }
        };
    }
    get events() {
        return this.cachedEventsAPI;
    }
    createEventsAPI() {
        return {
            emit: (event, data) => {
                this.eventBus.emit(event, data);
            },
            emitAsync: (event, data) => {
                return this.eventBus.emitAsync(event, data);
            },
            on: (event, handler) => {
                return this.eventBus.on(event, handler);
            }
        };
    }
    getRuntime() {
        return this.runtime;
    }
    get logger() {
        return this.loggerInstance;
    }
    get host() {
        return this.frozenHostContext;
    }
    get config() {
        return this.runtime.getConfig();
    }
    get introspect() {
        return this.introspectionAPI;
    }
    createIntrospectionAPI() {
        return {
            listActions: () => {
                return this.actionEngine.getAllActions().map(action => action.id);
            },
            getActionDefinition: (id) => {
                const action = this.actionEngine.getAction(id);
                if (!action)
                    return null;
                const metadata = {
                    id: action.id,
                    timeout: action.timeout
                };
                return deepFreeze(metadata);
            },
            listPlugins: () => {
                return this.pluginRegistry.getAllPlugins().map(plugin => plugin.name);
            },
            getPluginDefinition: (name) => {
                const plugin = this.pluginRegistry.getPlugin(name);
                if (!plugin)
                    return null;
                const metadata = {
                    name: plugin.name,
                    version: plugin.version
                };
                return deepFreeze(metadata);
            },
            listScreens: () => {
                return this.screenRegistry.getAllScreens().map(screen => screen.id);
            },
            getScreenDefinition: (id) => {
                const screen = this.screenRegistry.getScreen(id);
                if (!screen)
                    return null;
                const metadata = {
                    id: screen.id,
                    title: screen.title,
                    component: screen.component
                };
                return deepFreeze(metadata);
            },
            getMetadata: () => {
                const metadata = {
                    runtimeVersion: '0.1.0',
                    totalActions: this.actionEngine.getAllActions().length,
                    totalPlugins: this.pluginRegistry.getAllPlugins().length,
                    totalScreens: this.screenRegistry.getAllScreens().length
                };
                return deepFreeze(metadata);
            }
        };
    }
}
//# sourceMappingURL=runtime-context.js.map