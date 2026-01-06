import type { ActionDefinition, RuntimeContext, Logger } from './types.js';
export declare class ActionEngine<TConfig = Record<string, unknown>> {
    private actions;
    private context;
    private logger;
    constructor(logger: Logger);
    setContext(context: RuntimeContext<TConfig>): void;
    registerAction<P = unknown, R = unknown>(action: ActionDefinition<P, R, TConfig>): () => void;
    runAction<P = unknown, R = unknown>(id: string, params?: P): Promise<R>;
    private runWithTimeout;
    getAction(id: string): ActionDefinition<unknown, unknown, TConfig> | null;
    getAllActions(): ActionDefinition<unknown, unknown, TConfig>[];
    clear(): void;
}
//# sourceMappingURL=action-engine.d.ts.map