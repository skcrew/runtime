import type { ScreenDefinition, Logger } from './types.js';
export declare class ScreenRegistry {
    private screens;
    private logger;
    constructor(logger: Logger);
    registerScreen(screen: ScreenDefinition): () => void;
    getScreen(id: string): ScreenDefinition | null;
    getAllScreens(): ScreenDefinition[];
    clear(): void;
}
//# sourceMappingURL=screen-registry.d.ts.map