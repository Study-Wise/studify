import { google_icons, custom_icons } from '@/lib/icons-list';

const icon_map = {
    about: 'info',
    features: 'info',
    'privacy_policy': 'privacy_tip',
    'sign_in': 'login',
};

function hasGoogleIcon(name: string) {
    const hasIcon = Object.values(google_icons).some(category => category.includes(name));

    const hasMap = Object.hasOwn(icon_map, name);

    return hasIcon || hasMap;
}

function hasCustomIcon(name: string) {
    return custom_icons.some(icon => icon.name === name);
}

function hasIcon(name: string) {
    return hasGoogleIcon(name) ? 'google' : hasCustomIcon(name) ? 'custom' : false;
}

function getIcon(name: string) {
    const mappedIcon = Object.entries(icon_map).find(([key]) => key === name)?.[1];
    return mappedIcon || name;
}

export { hasGoogleIcon, hasCustomIcon, hasIcon, getIcon };
