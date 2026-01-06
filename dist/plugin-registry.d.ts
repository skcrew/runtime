import { PluginDefinition, RuntimeContext, Logger } from './types.js';
export declare class PluginRegistry<TConfig = Record<string, unknown>> {
    private plugins;
    private initializedPlugins;
    private logger;
    constructor(logger: Logger);
    registerPlugin(plugin: PluginDefinition<TConfig>): void;
    getPlugin(name: string): PluginDefinition<TConfig> | null;
    getAllPlugins(): PluginDefinition<TConfig>[];
    getInitializedPlugins(): string[];
    executeSetup(context: RuntimeContext<TConfig>): Promise<void>;
    executeDispose(context: RuntimeContext<TConfig>): Promise<void>;
    clear(): void;
}
//# sourceMappingURL=plugin-registry.d.ts.map