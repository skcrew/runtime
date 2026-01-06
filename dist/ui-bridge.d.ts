import { UIProvider, ScreenDefinition, Logger } from './types.js';
export declare class UIBridge<TConfig = Record<string, unknown>> {
    private provider;
    private logger;
    constructor(logger: Logger);
    setProvider(provider: UIProvider<TConfig>): void;
    getProvider(): UIProvider<TConfig> | null;
    renderScreen(screen: ScreenDefinition): unknown;
    shutdown(): Promise<void>;
    clear(): void;
}
//# sourceMappingURL=ui-bridge.d.ts.map