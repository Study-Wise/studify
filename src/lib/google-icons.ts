import { google_icons, custom_icons } from "./icons_list";

const icon_map = {
    about: 'info',
    features: 'info',
    'privacy-policy': 'description'
};

function hasGoogleIcon(name: string) {
    const hasIcon = !!Object.keys(google_icons).find(category => (
        google_icons[category as keyof typeof google_icons].includes(name)
    ));

    const hasMap = !!Object.keys(icon_map).find(icon => (
        !!icon_map[icon as keyof typeof icon_map]
    ));

    return hasIcon || hasMap;
}

function hasCustomIcon(name: string) {
    return custom_icons.some(icon => icon.name === name);
}

const hasIcon = (name: string) => hasGoogleIcon(name) ? 'google' : hasCustomIcon(name) ? 'custom' : false;

function getIcon(name: string) {
    return icon_map[name as keyof typeof icon_map] || name;
}

export { hasGoogleIcon, hasCustomIcon, hasIcon, getIcon };