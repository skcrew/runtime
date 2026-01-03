import glob from 'fast-glob';
import path from 'path';
import { PluginDefinition } from './types.js';

export interface LoadOptions {
    /** Pattern to match plugin files. Defaults to '*.js' */
    pattern?: string;
    /** Whether to load modules recursively. Defaults to false */
    recursive?: boolean;
}

/**
 * Dynamically loads plugins from a directory.
 * Plugins must be exported as 'default' or named exports that satisfy PluginDefinition interface.
 */
export async function loadPluginsFromDirectory(dir: string, options: LoadOptions = {}): Promise<PluginDefinition[]> {
    const pattern = options.pattern || '*.{js,ts}'; // Supports both JS and TS if running via ts-node or similar
    const recursive = options.recursive || false;

    // Normalize path
    const searchPath = path.resolve(dir);

    const files = await glob(pattern, {
        cwd: searchPath,
        absolute: true,
        deep: recursive ? undefined : 1
    });

    const plugins: PluginDefinition[] = [];

    for (const file of files) {
        try {
            const module = await import(file);

            // Check default export
            if (module.default && isValidPlugin(module.default)) {
                plugins.push(module.default);
            }
            // Check for named exports (simple heuristic: if any export looks like a plugin)
            else {
                for (const key of Object.keys(module)) {
                    if (key !== 'default' && isValidPlugin(module[key])) {
                        plugins.push(module[key]);
                    }
                }
            }

        } catch (error) {
            console.warn(`Failed to load plugin from ${file}:`, error);
        }
    }

    return plugins;
}

function isValidPlugin(obj: any): obj is PluginDefinition {
    return obj && typeof obj.name === 'string' && typeof obj.setup === 'function';
}
