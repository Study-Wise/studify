const pagesToHide = ['chat', 'settings', 'admin', '404'];

export default function getAllSitePages() {
    const pages = Object.entries(import.meta.glob<{ inNav?: string; title?: string | string[] }>('/src/pages/*.astro', { eager: true }))
        .map(([path, mod]) => {
            const fileName = path.split('/').pop();
            if (!fileName) return null;

            const name = fileName.replace('.astro', '');

            if (name.startsWith('_')) return null;

            const route = `/${name === 'index' ? '' : name}`;

            const isHidden = pagesToHide.includes(name);

            let pageTitle = mod?.title ? mod.title : `${name.charAt(0).toUpperCase()}${name.slice(1)}`

            if (name === 'index') pageTitle = 'Home';

            // Ensure pageTitle is a string before replacing
            const pageTitleStr = Array.isArray(pageTitle) ? pageTitle.join(' ') : (pageTitle);
            const finalPageTitle = pageTitleStr.replaceAll('-', ' ');

            return {
                name: finalPageTitle,
                path: route,
                hiddenFromNav: mod?.inNav === 'hide' || isHidden
            };
        })
        .filter((page): page is { name: string; path: string; hiddenFromNav: boolean } => !!page)
        .sort((a, b) => a.name === 'Home' ? -1 : b.name === 'Home' ? 1 : 0);

    return pages;
}
