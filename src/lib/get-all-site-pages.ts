import type { JSONValue } from '@/lib/threads';

const pagesToHide = ['chat', 'settings', 'admin', '404'];

export default function getAllSitePages() {
    const pages = (Object.entries(import.meta.glob('/src/pages/*.astro', { eager: true })) as [string, Record<string, JSONValue>][])
        .map(([path, mod]) => {
            const fileName = path.split('/').pop();
            if (!fileName) return null;

            const name = fileName.replace('.astro', '');

            // Skip pages that start with underscore
            if (name.startsWith('_')) return null;

            const route = `/${name === 'index' ? '' : name}`;

            // Astro module type checking
            const module = mod as { inNav?: string; title?: string | string[] };
            const hiddenFromNav = module?.inNav === 'hide';
            const isHidden = pagesToHide.includes(name);

            let pageTitle = module?.title ? module.title : `${name.charAt(0).toUpperCase()}${name.slice(1)}`

            if (name === 'index') pageTitle = 'Home';

            // Ensure pageTitle is a string before replacing
            const pageTitleStr = Array.isArray(pageTitle) ? pageTitle.join(' ') : (pageTitle as string);
            const finalPageTitle = pageTitleStr.replaceAll('-', ' ');

            return {
                name: finalPageTitle,
                path: route,
                hiddenFromNav: hiddenFromNav || isHidden
            };
        })
        .filter((page): page is { name: string; path: string; hiddenFromNav: boolean } => !!page)
        .sort((a, b) => a.name === 'Home' ? -1 : b.name === 'Home' ? 1 : 0);

    return pages;
}