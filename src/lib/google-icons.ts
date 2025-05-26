import fs from 'fs-extra';
const icons = fs.readJsonSync(`${import.meta.dirname}/google_icons.json`);

function hasGoogleIcon(name: string) {
  return !!Object.keys(icons).find((category: any) => icons[category].includes(name));
}

export { hasGoogleIcon };