// OpenAI gpt-image models supported sizes
export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

export interface ModelOption {
    name: string;
    selectableInUI?: boolean;
}

export interface Provider {
    name: string;
    models: Record<string, ModelOption>;
}

export type Providers = Record<string, Provider>;

const providers: Providers = {
    openai: {
        name: 'OpenAI',
        models: {
            'gpt-5.1': { name: 'GPT-5.1' },
            'gpt-5-mini': { name: 'GPT-5 Mini' },
            'gpt-5-nano': { name: 'GPT-5 Nano' },
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
            'gemini-3-pro': { name: 'Gemini 2.5 Pro' },
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

const models: ModelOption[] = Object.values(providers).flatMap(p => Object.values(p.models));

export { providers, models };
