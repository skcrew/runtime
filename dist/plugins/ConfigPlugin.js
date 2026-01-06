export const ConfigPlugin = {
    name: 'config',
    version: '1.0.0',
    async setup(ctx) {
        const host = ctx.host;
        const configSource = host.config || {};
        ctx.actions.registerAction({
            id: 'config:get',
            handler: async (key) => {
                const config = configSource;
                if (key) {
                    return config[key];
                }
                return config;
            }
        });
        ctx.actions.registerAction({
            id: 'config:set',
            handler: async (payload) => {
                const config = configSource;
                Object.assign(config, payload);
                return config;
            }
        });
        ctx.actions.registerAction({
            id: 'config:validate',
            handler: async () => {
                const validator = ctx.host._configValidator;
                if (typeof validator === 'function') {
                    return await validator(ctx.host.config);
                }
                return true;
            }
        });
    }
};
//# sourceMappingURL=ConfigPlugin.js.map