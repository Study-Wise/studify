import aiConfig from '@/lib/ai.config';
import appConfig from '@/lib/app.config';
import { contentTypes } from '@/lib/content';
import modeDefinitions from '@/lib/modes/definitions';

import type { APIRoute } from 'astro';

const subjects = Object.entries(modeDefinitions)
    .map(([categoryKey, category]) => {
        const shownModes = Object.entries(category.modes).filter(([, mode]) => mode.show !== false);
        if (shownModes.length === 0) return null;

        return {
            name: category.name,
            description: category.description,
            modes: shownModes.map(([modeKey, mode]) => ({
                name: mode.name,
                path: `/${categoryKey}/${modeKey}`,
            })),
        };
    })
    .filter(subject => subject !== null);

const pages = Object.keys(import.meta.glob('../*.astro'))
    .map(path => path.replace('../', '').replace('.astro', ''))
    .filter(name => !name.startsWith('_') && !appConfig.hiddenPages.includes(name))
    .sort((a, b) => a === 'index' ? -1 : b === 'index' ? 1 : 0)
    .map(name => ({
        name: name === 'index' ? 'home' : name,
        path: name === 'index' ? '/' : `/${name}`,
    }));

export const GET: APIRoute = () => {
    return new Response(
        JSON.stringify({ subjects, contentTypes, pages, appConfig, aiConfig }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
};
