import { Runtime } from './runtime.js';
import { Logger } from './types.js';
export declare class MemoryLogger implements Logger {
    logs: {
        level: string;
        message: string;
        args: unknown[];
    }[];
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    clear(): void;
}
export interface TestRuntimeOptions {
    hostContext?: Record<string, unknown>;
}
export declare function createTestRuntime(options?: TestRuntimeOptions): Runtime;
//# sourceMappingURL=test-utils.d.ts.map