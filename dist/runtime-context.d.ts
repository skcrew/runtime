import type { RuntimeContext, IntrospectionAPI, Logger } from './types.js';
import type { ScreenRegistry } from './screen-registry.js';
import type { ActionEngine } from './action-engine.js';
import type { PluginRegistry } from './plugin-registry.js';
import type { EventBus } from './event-bus.js';
import type { Runtime } from './runtime.js';
export declare class RuntimeContextImpl<TConfig = Record<string, unknown>> implements RuntimeContext<TConfig> {
    private screenRegistry;
    private actionEngine;
    private pluginRegistry;
    private eventBus;
    private runtime;
    private frozenHostContext;
    private introspectionAPI;
    private loggerInstance;
    private cachedScreensAPI;
    private cachedActionsAPI;
    private cachedPluginsAPI;
    private cachedEventsAPI;
    constructor(screenRegistry: ScreenRegistry, actionEngine: ActionEngine<TConfig>, pluginRegistry: PluginRegistry<TConfig>, eventBus: EventBus, runtime: Runtime<TConfig>, hostContext: Record<string, unknown>, logger: Logger);
    get screens(): any;
    private createScreensAPI;
    get actions(): any;
    private createActionsAPI;
    get plugins(): any;
    private createPluginsAPI;
    get events(): any;
    private createEventsAPI;
    getRuntime(): Runtime<TConfig>;
    get logger(): Logger;
    get host(): Readonly<Record<string, unknown>>;
    get config(): Readonly<TConfig>;
    get introspect(): IntrospectionAPI;
    private createIntrospectionAPI;
}
//# sourceMappingURL=runtime-context.d.ts.map