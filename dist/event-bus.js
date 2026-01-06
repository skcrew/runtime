export class EventBus {
    handlers;
    logger;
    constructor(logger) {
        this.handlers = new Map();
        this.logger = logger;
    }
    emit(event, data) {
        const eventHandlers = this.handlers.get(event);
        if (!eventHandlers || eventHandlers.size === 0) {
            return;
        }
        if (eventHandlers.size === 1) {
            const handler = eventHandlers.values().next().value;
            if (handler) {
                try {
                    handler(data);
                }
                catch (error) {
                    this.logger.error(`Event handler for "${event}" threw error`, error);
                }
            }
            return;
        }
        for (const handler of eventHandlers) {
            try {
                handler(data);
            }
            catch (error) {
                this.logger.error(`Event handler for "${event}" threw error`, error);
            }
        }
    }
    async emitAsync(event, data) {
        const eventHandlers = this.handlers.get(event);
        if (!eventHandlers) {
            return;
        }
        const promises = Array.from(eventHandlers).map(handler => Promise.resolve()
            .then(() => handler(data))
            .catch(error => {
            this.logger.error(`Async event handler for "${event}" threw error`, error);
        }));
        await Promise.allSettled(promises);
    }
    on(event, handler) {
        let eventHandlers = this.handlers.get(event);
        if (!eventHandlers) {
            eventHandlers = new Set();
            this.handlers.set(event, eventHandlers);
        }
        eventHandlers.add(handler);
        return () => {
            eventHandlers?.delete(handler);
            if (eventHandlers?.size === 0) {
                this.handlers.delete(event);
            }
        };
    }
    clear() {
        this.handlers.clear();
    }
}
//# sourceMappingURL=event-bus.js.map