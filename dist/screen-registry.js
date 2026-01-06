import { ValidationError, DuplicateRegistrationError } from './types.js';
export class ScreenRegistry {
    screens;
    logger;
    constructor(logger) {
        this.screens = new Map();
        this.logger = logger;
    }
    registerScreen(screen) {
        if (!screen.id || typeof screen.id !== 'string') {
            throw new ValidationError('Screen', 'id');
        }
        if (!screen.title || typeof screen.title !== 'string') {
            throw new ValidationError('Screen', 'title', screen.id);
        }
        if (!screen.component || typeof screen.component !== 'string') {
            throw new ValidationError('Screen', 'component', screen.id);
        }
        if (this.screens.has(screen.id)) {
            throw new DuplicateRegistrationError('Screen', screen.id);
        }
        this.screens.set(screen.id, screen);
        this.logger.debug(`Screen "${screen.id}" registered successfully`);
        return () => {
            this.screens.delete(screen.id);
        };
    }
    getScreen(id) {
        return this.screens.get(id) ?? null;
    }
    getAllScreens() {
        return Array.from(this.screens.values());
    }
    clear() {
        this.screens.clear();
    }
}
//# sourceMappingURL=screen-registry.js.map