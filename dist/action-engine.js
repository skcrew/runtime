import { ValidationError, DuplicateRegistrationError, ActionTimeoutError, ActionExecutionError } from './types.js';
export class ActionEngine {
    actions;
    context;
    logger;
    constructor(logger) {
        this.actions = new Map();
        this.context = null;
        this.logger = logger;
    }
    setContext(context) {
        this.context = context;
    }
    registerAction(action) {
        if (!action.id || typeof action.id !== 'string') {
            throw new ValidationError('Action', 'id');
        }
        if (!action.handler || typeof action.handler !== 'function') {
            throw new ValidationError('Action', 'handler', action.id);
        }
        if (this.actions.has(action.id)) {
            throw new DuplicateRegistrationError('Action', action.id);
        }
        this.actions.set(action.id, action);
        this.logger.debug(`Action "${action.id}" registered successfully`);
        return () => {
            this.actions.delete(action.id);
        };
    }
    async runAction(id, params) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action with id "${id}" not found`);
        }
        if (!this.context) {
            throw new Error('RuntimeContext not set in ActionEngine');
        }
        try {
            if (action.timeout) {
                const result = await this.runWithTimeout(action, params);
                return result;
            }
            const result = await Promise.resolve(action.handler(params, this.context));
            return result;
        }
        catch (error) {
            if (error instanceof ActionTimeoutError) {
                this.logger.error(`Action "${id}" timed out`, error);
                throw error;
            }
            this.logger.error(`Action "${id}" execution failed`, error);
            throw new ActionExecutionError(id, error);
        }
    }
    async runWithTimeout(action, params) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new ActionTimeoutError(action.id, action.timeout));
            }, action.timeout);
        });
        const handlerPromise = Promise.resolve(action.handler(params, this.context));
        try {
            const result = await Promise.race([handlerPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    getAction(id) {
        return this.actions.get(id) ?? null;
    }
    getAllActions() {
        return Array.from(this.actions.values());
    }
    clear() {
        this.actions.clear();
    }
}
//# sourceMappingURL=action-engine.js.map