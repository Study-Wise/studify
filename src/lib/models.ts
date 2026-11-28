import config from '@/lib/ai.config';

// OpenAI gpt-image models supported sizes
export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

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
            console.warn('⚠️ Could not load the AI Gateway model list, using the stored model as given:', error);
        }
    }

    return latestModels?.ids.get(stored) ?? `${provider}/${stored}`;
}

export async function getValidModelAndProvider(
    providerKey: string | null,
    tierKey: string | null
): Promise<{ model: string; provider: string; tier: string }> {
    return {
        model: Object.entries(config.tiers).find(([key]) => key === (tierKey || config.tier))?.[1] ?? config.model,
        provider: providerKey || config.provider,
        tier: tierKey || config.tier
    };
}
