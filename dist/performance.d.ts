export interface PerformanceMonitor {
    startTimer(label: string): () => number;
    recordMetric(name: string, value: number): void;
    getMetrics(): Record<string, number>;
}
export declare class NoOpPerformanceMonitor implements PerformanceMonitor {
    startTimer(): () => number;
    recordMetric(): void;
    getMetrics(): Record<string, number>;
}
export declare class SimplePerformanceMonitor implements PerformanceMonitor {
    private metrics;
    startTimer(label: string): () => number;
    recordMetric(name: string, value: number): void;
    getMetrics(): Record<string, number>;
}
export declare function createPerformanceMonitor(enabled?: boolean): PerformanceMonitor;
//# sourceMappingURL=performance.d.ts.map