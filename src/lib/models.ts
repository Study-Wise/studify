import config from '@/lib/ai.config';

// OpenAI gpt-image models supported sizes
export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

export interface TierOption {
    name: string;
    model: string;
    alias?: string;
    selectableInUI?: boolean;
}

export interface Provider {
    name: string;
    tiers: Record<string, TierOption>;
}

export type Providers = Record<string, Provider>;

const providers: Providers = {
    openai: {
        name: 'OpenAI',
        tiers: {
            default: { name: 'Default', model: 'gpt-5.1' },
            mini: { name: 'Mini', model: 'gpt-5-mini' },
            nano: { name: 'Nano', model: 'gpt-5-nano' },
            reasoning: { name: 'Reasoning', model: 'o3' },
            'reasoning-mini': { name: 'Reasoning Mini', model: 'o4-mini' },
        },
    },
    google: {
        name: 'Google',
        tiers: {
            default: { name: 'Default', model: 'gemini-3.1-pro-preview', alias: 'gemini/pro' },
            mini: { name: 'Mini', model: 'gemini-2.5-flash', alias: 'gemini/flash' },
            nano: { name: 'Nano', model: 'gemini-2.5-flash-lite', alias: 'gemini/flash-lite' },
        },
    },
    vercel: {
        name: 'Vercel',
        tiers: {
            default: { name: 'Medium', model: 'v0-1.5-md', selectableInUI: false },
            large: { name: 'Large', model: 'v0-1.5-lg', selectableInUI: false },
        },
    },
};

export function getSelectableProviders(): Providers {
    const selectable: Providers = {};
    for (const [key, provider] of Object.entries(providers)) {
        if (key === 'vercel') continue;
        selectable[key] = provider;
    }
    return selectable;
}

export function resolveModel(stored: string): string {
    return Object.values(providers).flatMap(provider => Object.values(provider.tiers)).find(tier => tier.alias === stored)?.model ?? stored;
}

export async function getValidModelAndProvider(
    providerKey: string | null,
    tierKey: string | null
): Promise<{ model: string; provider: string; tier: string }> {
    const tier = providers[providerKey || config.provider]?.tiers[tierKey || config.tier];

    return {
        model: tier?.alias ?? tier?.model ?? config.model,
        provider: providerKey || config.provider,
        tier: tierKey || config.tier
    };
}

export { providers };
