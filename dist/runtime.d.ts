import type { RuntimeContext, UIProvider, PluginDefinition, RuntimeOptions, Logger } from './types.js';
import { RuntimeState } from './types.js';
export declare class Runtime<TConfig = Record<string, unknown>> {
    private plugins;
    private screens;
    private actions;
    private events;
    private ui;
    private context;
    private initialized;
    private pendingPlugins;
    readonly logger: Logger;
    private state;
    private hostContext;
    private config;
    private performanceMonitor;
    private pluginLoader;
    private pluginPaths;
    private pluginPackages;
    constructor(options?: RuntimeOptions<TConfig>);
    private validateHostContext;
    registerPlugin(plugin: PluginDefinition<TConfig>): void;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getContext(): RuntimeContext<TConfig>;
    isInitialized(): boolean;
    getState(): RuntimeState;
    setUIProvider(provider: UIProvider<TConfig>): void;
    getUIProvider(): UIProvider<TConfig> | null;
    renderScreen(screenId: string): unknown;
    getConfig(): Readonly<TConfig>;
    updateConfig(config: Partial<TConfig>): void;
}
//# sourceMappingURL=runtime.d.ts.map