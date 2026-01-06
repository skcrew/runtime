import { ValidationError, DuplicateRegistrationError } from './types.js';
export class UIBridge {
    provider = null;
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    setProvider(provider) {
        if (this.provider !== null) {
            throw new DuplicateRegistrationError('UIProvider', 'default');
        }
        if (typeof provider.mount !== 'function') {
            throw new ValidationError('UIProvider', 'mount');
        }
        if (typeof provider.renderScreen !== 'function') {
            throw new ValidationError('UIProvider', 'renderScreen');
        }
        this.provider = provider;
    }
    getProvider() {
        return this.provider;
    }
    renderScreen(screen) {
        if (this.provider === null) {
            throw new Error('No UI provider registered');
        }
        return this.provider.renderScreen(screen);
    }
    async shutdown() {
        if (this.provider?.unmount) {
            try {
                await Promise.resolve(this.provider.unmount());
                this.logger.debug('UI provider unmounted');
            }
            catch (error) {
                this.logger.error('UI provider unmount failed', error);
            }
        }
        this.provider = null;
    }
    clear() {
        this.provider = null;
    }
}
//# sourceMappingURL=ui-bridge.js.map