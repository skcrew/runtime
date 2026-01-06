import { PluginDefinition } from '../types.js';
export interface ConfigPluginOptions {
    validate?: (config: any) => boolean | Promise<boolean>;
}
export declare const ConfigPlugin: PluginDefinition;
//# sourceMappingURL=ConfigPlugin.d.ts.map