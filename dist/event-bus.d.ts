import type { Logger } from './types.js';
export declare class EventBus {
    private handlers;
    private logger;
    constructor(logger: Logger);
    emit(event: string, data?: unknown): void;
    emitAsync(event: string, data?: unknown): Promise<void>;
    on(event: string, handler: (data: unknown) => void): () => void;
    clear(): void;
}
//# sourceMappingURL=event-bus.d.ts.map