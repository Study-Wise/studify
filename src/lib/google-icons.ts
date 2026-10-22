import { google_icons, custom_icons } from '@/lib/icons-list';

const iconMap = {
    about: 'info',
    features: 'info',
    'privacy_policy': 'privacy_tip',
    'sign_in': 'login',
};

export function hasIcon(name: string) {
    return Object.values(google_icons).some(category => category.includes(name)) || Object.hasOwn(iconMap, name)
        ? 'google'
        : custom_icons.some(icon => icon.name === name) ? 'custom' : false;
}

export function getIcon(name: string) {
    return Object.entries(iconMap).find(([key]) => key === name)?.[1] || name;
}
