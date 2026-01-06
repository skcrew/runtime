export class ValidationError extends Error {
    resourceType;
    field;
    resourceId;
    constructor(resourceType, field, resourceId) {
        super(`Validation failed for ${resourceType}${resourceId ? ` "${resourceId}"` : ''}: missing or invalid field "${field}"`);
        this.resourceType = resourceType;
        this.field = field;
        this.resourceId = resourceId;
        this.name = 'ValidationError';
    }
}
export class DuplicateRegistrationError extends Error {
    resourceType;
    identifier;
    constructor(resourceType, identifier) {
        super(`${resourceType} with identifier "${identifier}" is already registered`);
        this.resourceType = resourceType;
        this.identifier = identifier;
        this.name = 'DuplicateRegistrationError';
    }
}
export class ActionTimeoutError extends Error {
    actionId;
    timeoutMs;
    constructor(actionId, timeoutMs) {
        super(`Action "${actionId}" timed out after ${timeoutMs}ms`);
        this.actionId = actionId;
        this.timeoutMs = timeoutMs;
        this.name = 'ActionTimeoutError';
    }
}
export class ActionExecutionError extends Error {
    actionId;
    cause;
    constructor(actionId, cause) {
        super(`Action "${actionId}" execution failed: ${cause.message}`);
        this.actionId = actionId;
        this.cause = cause;
        this.name = 'ActionExecutionError';
        this.cause = cause;
    }
}
export class ConsoleLogger {
    debug(message, ...args) {
        console.debug(message, ...args);
    }
    info(message, ...args) {
        console.info(message, ...args);
    }
    warn(message, ...args) {
        console.warn(message, ...args);
    }
    error(message, ...args) {
        console.error(message, ...args);
    }
}
export var RuntimeState;
(function (RuntimeState) {
    RuntimeState["Uninitialized"] = "uninitialized";
    RuntimeState["Initializing"] = "initializing";
    RuntimeState["Initialized"] = "initialized";
    RuntimeState["ShuttingDown"] = "shutting_down";
    RuntimeState["Shutdown"] = "shutdown";
})(RuntimeState || (RuntimeState = {}));
//# sourceMappingURL=types.js.map