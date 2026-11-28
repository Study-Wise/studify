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

interface GatewayModel {
    id: string;
    type: string;
    released?: number;
}

let latestModels: { fetchedAt: number; ids: Map<string, string> } | undefined;

export async function resolveModel(provider: string, stored: string): Promise<string> {
    if (!latestModels || Date.now() - latestModels.fetchedAt > config.latestModelsTtl) {
        try {
            const response = await fetch(config.gatewayModelsUrl, { signal: globalThis.AbortSignal.timeout(3000) });
            if (!response.ok) throw new Error(`Gateway model list returned ${response.status}`);

            const newest = new Map<string, GatewayModel>();
            for (const model of (await response.json()).data) {
                if (model.type !== 'language') continue;

                const tokens: string[] = model.id.split('/')[1].split('-');
                const versionIndex = tokens.findIndex(token => /^\d+(\.\d+)*$/.test(token));
                if (versionIndex === -1) continue;

                const [family, ...tier] = tokens.filter((token, index) => index !== versionIndex && token !== 'preview');
                const alias = tier.length > 0 ? `${family}/${tier.join('-')}` : family;

                if ((model.released ?? 0) > (newest.get(alias)?.released ?? 0)) newest.set(alias, model);
            }

            latestModels = { fetchedAt: Date.now(), ids: new Map([...newest].map(([alias, model]) => [alias, model.id])) };
        } catch (error) {
            console.warn('⚠️ Could not load the AI Gateway model list, using the built-in models:', error);
        }
    }

    const builtIn = Object.values(providers[provider]?.tiers ?? {}).find(tier => tier.alias === stored)?.model ?? stored;
    return latestModels?.ids.get(stored) ?? `${provider}/${builtIn}`;
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
