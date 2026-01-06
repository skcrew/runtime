import glob from 'fast-glob';
import { pathToFileURL } from 'url';
import { join, resolve } from 'path';
export class DirectoryPluginLoader {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async loadPlugins(pluginPaths = [], pluginPackages = []) {
        const plugins = [];
        for (const path of pluginPaths) {
            try {
                const pathPlugins = await this.loadFromPath(path);
                plugins.push(...pathPlugins);
            }
            catch (error) {
                this.logger.error(`Failed to load plugins from path "${path}":`, error);
            }
        }
        for (const packageName of pluginPackages) {
            try {
                const packagePlugin = await this.loadFromPackage(packageName);
                if (packagePlugin) {
                    plugins.push(packagePlugin);
                }
            }
            catch (error) {
                this.logger.error(`Failed to load plugin package "${packageName}":`, error);
            }
        }
        this.logger.info(`Loaded ${plugins.length} plugins via DirectoryPluginLoader`);
        return this.sortPluginsByDependencies(plugins);
    }
    async loadFromPath(path) {
        const resolvedPath = resolve(path);
        if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.ts')) {
            const plugin = await this.loadPluginFile(resolvedPath);
            return plugin ? [plugin] : [];
        }
        const pattern = join(resolvedPath, '**/*.{js,mjs}');
        const files = await glob(pattern, {
            ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
        });
        const plugins = [];
        for (const file of files) {
            const plugin = await this.loadPluginFile(file);
            if (plugin) {
                plugins.push(plugin);
            }
        }
        return this.sortPluginsByDependencies(plugins);
    }
    async loadFromPackage(packageName) {
        try {
            const module = await import(packageName);
            const plugin = module.default || module.plugin || module;
            if (this.isValidPlugin(plugin)) {
                this.logger.debug(`Loaded plugin from package: ${packageName}`);
                return plugin;
            }
            else {
                this.logger.warn(`Package "${packageName}" does not export a valid plugin`);
                return null;
            }
        }
        catch (error) {
            throw new Error(`Cannot load package "${packageName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async loadPluginFile(filePath) {
        try {
            const fileUrl = pathToFileURL(filePath).href;
            const module = await import(fileUrl);
            const plugin = module.default || module.plugin || module;
            if (this.isValidPlugin(plugin)) {
                this.logger.debug(`Loaded plugin from file: ${filePath}`);
                return plugin;
            }
            else {
                this.logger.warn(`File "${filePath}" does not export a valid plugin`);
                return null;
            }
        }
        catch (error) {
            throw new Error(`Cannot load plugin file "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    isValidPlugin(obj) {
        return (typeof obj === 'object' &&
            obj !== null &&
            typeof obj.name === 'string' &&
            typeof obj.version === 'string' &&
            typeof obj.setup === 'function');
    }
    sortPluginsByDependencies(plugins) {
        const pluginMap = new Map();
        const visited = new Set();
        const visiting = new Set();
        const sorted = [];
        for (const plugin of plugins) {
            pluginMap.set(plugin.name, plugin);
        }
        const visit = (pluginName) => {
            if (visited.has(pluginName)) {
                return;
            }
            if (visiting.has(pluginName)) {
                this.logger.warn(`Circular dependency detected involving plugin "${pluginName}"`);
                return;
            }
            const plugin = pluginMap.get(pluginName);
            if (!plugin) {
                return;
            }
            visiting.add(pluginName);
            const dependencies = plugin.dependencies || [];
            for (const dep of dependencies) {
                visit(dep);
            }
            visiting.delete(pluginName);
            visited.add(pluginName);
            sorted.push(plugin);
        };
        for (const plugin of plugins) {
            visit(plugin.name);
        }
        this.logger.debug(`Sorted ${sorted.length} plugins by dependencies`);
        return sorted;
    }
}
//# sourceMappingURL=plugin-loader.js.map