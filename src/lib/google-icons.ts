import icons from './google_icons';

function hasGoogleIcon(name: string) {
  return !!Object.keys(icons).find((category) => icons[category as keyof typeof icons].includes(name));
}

export { hasGoogleIcon };