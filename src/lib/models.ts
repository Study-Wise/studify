const providers = {
    openai: {
        name: 'OpenAI',
        models: {
            'gpt-4.1': { name: 'GPT-4.1' },
            'gpt-4.1-mini': { name: 'GPT-4.1 Mini' },
            'gpt-4.1-nano': { name: 'GPT-4.1 Nano' },
            'o3': { name: 'o3' },
            'o4-mini': { name: 'o4-mini' },
        },
    },
    // anthropic: {
    //     name: 'Anthropic',
    //     models: {
    //         'claude-3-7-sonnet': { name: 'Claude 3.7 Sonnet' },
    //         'claude-3-7-haiku': { name: 'Claude 3.7 Haiku' },
    //         'claude-4-sonnet': { name: 'Claude 4 Sonnet' },
    //         'claude-4-opus': { name: 'Claude 4 Opus' },
    //     },
    // },
    google: {
        name: 'Google',
        models: {
            // 'gemini-3-pro': { name: 'Gemini 3 Pro' },
            'gemini-2.5-pro': { name: 'Gemini 2.5 Pro' },
            'gemini-2.5-flash': { name: 'Gemini 2.5 Flash' },
            'gemini-2.5-flash-lite': { name: 'Gemini 2.5 Flash Lite' },
        },
    },
    // xai: {
    //     name: 'xAI (Grok)',
    //     models: {
    //         'grok-3': { name: 'Grok 3' },
    //         'grok-3-mini': { name: 'Grok 3 Mini' },
    //     },
    // },
    vercel: {
        name: 'Vercel',
        models: {
            'v0-1.5-md': { name: 'Vercel 1.5 Medium', selectableInUI: false },
            'v0-1.5-lg': { name: 'Vercel 1.5 Large', selectableInUI: false },
        },
    },
};

const models = Object.values(providers).flatMap((p: any) => Object.values(p.models));

export { providers, models };