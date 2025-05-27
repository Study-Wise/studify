import icons from './google_icons';

function hasGoogleIcon(name: string) {
  return !!Object.keys(icons).find((category: any) => icons[category].includes(name));
}

export { hasGoogleIcon };