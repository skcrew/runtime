import type { PluginDefinition, Logger } from './types.js';
export declare class DirectoryPluginLoader {
    private logger;
    constructor(logger: Logger);
    loadPlugins(pluginPaths?: string[], pluginPackages?: string[]): Promise<PluginDefinition[]>;
    private loadFromPath;
    private loadFromPackage;
    private loadPluginFile;
    private isValidPlugin;
}
//# sourceMappingURL=plugin-loader.d.ts.map