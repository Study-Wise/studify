import { google_icons, custom_icons } from "./icons_list";

function hasGoogleIcon(name: string) {
  return !!Object.keys(google_icons).find(category => (
    google_icons[category as keyof typeof google_icons].includes(name)
  ));
}

function hasCustomIcon(name: string) {
  return !!custom_icons.find(icon => icon.name === name);
}

const hasIcon = (name: string) => hasGoogleIcon(name) ? 'google' : hasCustomIcon(name) ? 'custom' : false;

export { hasGoogleIcon, hasCustomIcon, hasIcon };