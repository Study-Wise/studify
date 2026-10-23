import appConfig from '@/lib/app.config';

export default function getAllSitePages() {
    const pages = Object.entries(import.meta.glob<{ inNav?: string; title?: string | string[] }>('/src/pages/*.astro', { eager: true }))
        .map(([path, mod]) => {
            const fileName = path.split('/').pop();
            if (!fileName) return null;

            const name = fileName.replace('.astro', '');

            if (name.startsWith('_')) return null;

            let pageTitle = mod?.title ? mod.title : `${name.charAt(0).toUpperCase()}${name.slice(1)}`

            if (name === 'index') pageTitle = 'Home';

            // Ensure pageTitle is a string before replacing
            return {
                name: (Array.isArray(pageTitle) ? pageTitle.join(' ') : pageTitle).replaceAll('-', ' '),
                path: `/${name === 'index' ? '' : name}`,
                hiddenFromNav: mod?.inNav === 'hide' || appConfig.hiddenPages.includes(name)
            };
        })
        .filter((page): page is { name: string; path: string; hiddenFromNav: boolean } => !!page)
        .sort((a, b) => a.name === 'Home' ? -1 : b.name === 'Home' ? 1 : 0);

    return pages;
}
