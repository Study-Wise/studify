const pagesToHide = ['chat', 'settings', 'admin', '404'];

const pages = Object.entries(import.meta.glob('/src/pages/*.astro', { eager: true }))
    .map(([path, mod]) => {
        const fileName = path.split('/').pop();
        if (!fileName) return null;

        const name = fileName.replace('.astro', '');
        
        // Skip pages that start with underscore
        if (name.startsWith('_')) return null;
        
        const route = `/${name === 'index' ? '' : name}`;
        const modTyped = mod as Record<string, string[]>;
        const hiddenFromNav = modTyped?.inNav ? modTyped.inNav[0] === 'hide' : false;
        const isHidden = pagesToHide.includes(name);

        let pageTitle = modTyped?.title ? modTyped.title : `${name.charAt(0).toUpperCase()}${name.slice(1)}`

        if (name === 'index') pageTitle = 'Home';

        // Ensure pageTitle is a string before replacing
        const pageTitleStr = Array.isArray(pageTitle) ? pageTitle.join(' ') : pageTitle;
        const finalPageTitle = pageTitleStr.replaceAll('-', ' ');

        return {
            name: finalPageTitle,
            path: route,
            hiddenFromNav: hiddenFromNav || isHidden
        };
    })
    .filter((page): page is { name: string; path: string; hiddenFromNav: boolean } => !!page)
    .sort((a, b) => a.name === 'Home' ? -1 : b.name === 'Home' ? 1 : 0);
    

// TODO: If user is not logged in, add in a sign-in page link;

export default pages;