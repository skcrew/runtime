import { Runtime } from './runtime.js';
export class MemoryLogger {
    logs = [];
    debug(message, ...args) { this.logs.push({ level: 'debug', message, args }); }
    info(message, ...args) { this.logs.push({ level: 'info', message, args }); }
    warn(message, ...args) { this.logs.push({ level: 'warn', message, args }); }
    error(message, ...args) { this.logs.push({ level: 'error', message, args }); }
    clear() { this.logs = []; }
}
export function createTestRuntime(options = {}) {
    return new Runtime({
        logger: new MemoryLogger(),
        hostContext: options.hostContext || {},
        enablePerformanceMonitoring: false
    });
}
//# sourceMappingURL=test-utils.js.map