import { glob } from 'fast-glob';
import { pathToFileURL } from 'url';
import { join, resolve } from 'path';
import type { PluginDefinition, Logger } from './types.js';

/**
 * Plugin loader for automatic discovery and loading of plugins
 * Supports both file paths and npm packages
 */
export class DirectoryPluginLoader {
  constructor(private logger: Logger) {}

  /**
   * Load plugins from specified paths and packages
   * @param pluginPaths - Array of file paths or directory paths
   * @param pluginPackages - Array of npm package names
   * @returns Array of loaded plugin definitions
   */
  async loadPlugins(
    pluginPaths: string[] = [],
    pluginPackages: string[] = []
  ): Promise<PluginDefinition[]> {
    const plugins: PluginDefinition[] = [];

    // Load from file paths
    for (const path of pluginPaths) {
      try {
        const pathPlugins = await this.loadFromPath(path);
        plugins.push(...pathPlugins);
      } catch (error) {
        this.logger.error(`Failed to load plugins from path "${path}":`, error);
      }
    }

    // Load from npm packages
    for (const packageName of pluginPackages) {
      try {
        const packagePlugin = await this.loadFromPackage(packageName);
        if (packagePlugin) {
          plugins.push(packagePlugin);
        }
      } catch (error) {
        this.logger.error(`Failed to load plugin package "${packageName}":`, error);
      }
    }

    this.logger.info(`Loaded ${plugins.length} plugins via DirectoryPluginLoader`);
    return plugins;
  }

  /**
   * Load plugins from a file path or directory
   */
  private async loadFromPath(path: string): Promise<PluginDefinition[]> {
    const resolvedPath = resolve(path);
    
    // Check if it's a single file
    if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.ts')) {
      const plugin = await this.loadPluginFile(resolvedPath);
      return plugin ? [plugin] : [];
    }

    // Treat as directory - find all plugin files
    const pattern = join(resolvedPath, '**/*.{js,mjs}');
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
    });

    const plugins: PluginDefinition[] = [];
    for (const file of files) {
      const plugin = await this.loadPluginFile(file);
      if (plugin) {
        plugins.push(plugin);
      }
    }

    return plugins;
  }

  /**
   * Load a plugin from an npm package
   */
  private async loadFromPackage(packageName: string): Promise<PluginDefinition | null> {
    try {
      // Dynamic import of npm package
      const module = await import(packageName);
      
      // Look for default export or named exports that look like plugins
      const plugin = module.default || module.plugin || module;
      
      if (this.isValidPlugin(plugin)) {
        this.logger.debug(`Loaded plugin from package: ${packageName}`);
        return plugin;
      } else {
        this.logger.warn(`Package "${packageName}" does not export a valid plugin`);
        return null;
      }
    } catch (error) {
      throw new Error(`Cannot load package "${packageName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a single plugin file
   */
  private async loadPluginFile(filePath: string): Promise<PluginDefinition | null> {
    try {
      // Convert to file URL for dynamic import
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      
      // Look for plugin in various export patterns
      const plugin = module.default || module.plugin || module;
      
      if (this.isValidPlugin(plugin)) {
        this.logger.debug(`Loaded plugin from file: ${filePath}`);
        return plugin;
      } else {
        this.logger.warn(`File "${filePath}" does not export a valid plugin`);
        return null;
      }
    } catch (error) {
      throw new Error(`Cannot load plugin file "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that an object is a valid plugin definition
   */
  private isValidPlugin(obj: unknown): obj is PluginDefinition {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).name === 'string' &&
      typeof (obj as any).version === 'string' &&
      typeof (obj as any).setup === 'function'
    );
  }
}