import { google_icons, custom_icons } from '@/lib/icons-list';

const icon_map = {
    about: 'info',
    features: 'info',
    'privacy_policy': 'privacy_tip',
    'sign_in': 'login',
};

export function hasIcon(name: string) {
    return Object.values(google_icons).some(category => category.includes(name)) || Object.hasOwn(icon_map, name)
        ? 'google'
        : custom_icons.some(icon => icon.name === name) ? 'custom' : false;
}

export function getIcon(name: string) {
    const mappedIcon = Object.entries(icon_map).find(([key]) => key === name)?.[1];
    return mappedIcon || name;
}
