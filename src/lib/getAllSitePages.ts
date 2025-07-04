const pagesToHide = ['chat'];

const pages = Object.entries(import.meta.glob('/src/pages/*.astro', { eager: true }))
  .map(([path, mod]) => {
    const fileName = path.split('/').pop();
    if (!fileName) return null;
    const name = fileName.replace('.astro', '');
    const route = `/${name === 'index' ? '' : name}`;
    const modTyped = mod as Record<string, string[]>;
    const hiddenFromNav = modTyped?.inNav ? modTyped.inNav[0] === 'hide' : false;
    const isHidden = pagesToHide.includes(name);
    let pageTitle = modTyped?.title ? modTyped.title : (name.charAt(0).toUpperCase() + name.slice(1));
    if (name === 'index') pageTitle = 'Home';
    return { name: pageTitle, path: route, hiddenFromNav: hiddenFromNav || isHidden };
  })
  .filter((page): page is { name: string; path: string; hiddenFromNav: boolean } => !!page)
  .sort((a, b) => (a.name === 'Home' ? -1 : (b.name === 'Home' ? 1 : 0)));

export default pages;