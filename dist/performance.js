export class NoOpPerformanceMonitor {
    startTimer() {
        return () => 0;
    }
    recordMetric() {
    }
    getMetrics() {
        return {};
    }
}
export class SimplePerformanceMonitor {
    metrics = new Map();
    startTimer(label) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(label, duration);
            return duration;
        };
    }
    recordMetric(name, value) {
        this.metrics.set(name, value);
    }
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}
export function createPerformanceMonitor(enabled = false) {
    return enabled ? new SimplePerformanceMonitor() : new NoOpPerformanceMonitor();
}
//# sourceMappingURL=performance.js.map