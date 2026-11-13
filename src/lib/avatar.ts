export interface AvatarOptions {
    gender: 'female' | 'male';
    skin: string;
    hairColor: string;
    background: string;
    foreground: string;
    clothing: 'tee' | 'collar' | 'hoodie' | 'blazer' | 'turtleneck';
    faceShape: 'round' | 'oval' | 'square' | 'heart';
    eyes: string;
    nose: 'small' | 'button' | 'pointed' | 'wide';
    mouth: 'smile' | 'grin' | 'neutral' | 'open';
    faceSize: number;
    accessory?: 'none' | 'glasses' | 'beret' | 'hardhat';
}

export function generateAvatar({
    gender,
    skin,
    hairColor,
    background,
    foreground,
    clothing,
    faceShape,
    eyes,
    nose,
    mouth,
    faceSize,
    accessory = 'none',
}: AvatarOptions): string {
    const cy = 10.4;
    const r = 5.2 * faceSize;
    const left = 12 - r;
    const eyeOffset = r * 0.42;
    const eyeY = cy - r * 0.05;
    const noseY = cy + r * 0.28;
    const halfWidth = gender === 'female' ? 7.4 : 10.8;
    const feature = 'rgba(0,0,0,0.35)';

    const faceLeft = Math.round(left * 100) / 100;
    const faceRadius = Math.round(r * 100) / 100;
    const faceWidth = Math.round(2 * r * 100) / 100;

    let face = '';

    switch (faceShape) {
        case 'round':
            face = `<ellipse cx="12" cy="${Math.round((cy + 0.5) * 100) / 100}" rx="${faceRadius}" ry="${Math.round(r * 1.05 * 100) / 100}" fill="${skin}"/>`;
            break;
        case 'oval':
            face = `<ellipse cx="12" cy="${cy}" rx="${Math.round(r * 0.88 * 100) / 100}" ry="${Math.round(r * 1.1 * 100) / 100}" fill="${skin}"/>`;
            break;
        case 'square': {
            const jawTop = Math.round((cy + r * 0.65) * 100) / 100;
            const chin = Math.round((cy + r * 1.05) * 100) / 100;

            face = `<path d="M${faceLeft} ${cy}A${faceRadius} ${Math.round(r * 1.05 * 100) / 100} 0 0 1 ${Math.round((12 + r) * 100) / 100} ${cy}L${Math.round((12 + r) * 100) / 100} ${jawTop}Q${Math.round((12 + r) * 100) / 100} ${chin} ${Math.round((12 + r * 0.7) * 100) / 100} ${chin}L${Math.round((12 - r * 0.7) * 100) / 100} ${chin}Q${faceLeft} ${chin} ${faceLeft} ${jawTop}z" fill="${skin}"/>`;
            break;
        }
        case 'heart': {
            const heartDepth = Math.round(1.45 * r * 100) / 100;
            const negativeRadius = Math.round(-r * 100) / 100;

            face = `<path d="M${faceLeft} ${cy}a${faceRadius} ${faceRadius} 0 0 1 ${faceWidth} 0c0 ${Math.round(0.9 * r * 100) / 100} ${Math.round(-0.55 * r * 100) / 100} ${heartDepth} ${negativeRadius} ${heartDepth}c${Math.round(-0.45 * r * 100) / 100} 0 ${negativeRadius} ${Math.round(-0.55 * r * 100) / 100} ${negativeRadius} ${Math.round(-1.45 * r * 100) / 100}z" fill="${skin}"/>`;
            break;
        }
    }

    const eyeCenterY = Math.round(eyeY * 100) / 100;

    const eyeMarkup = [-1, 1].map(side => {
        const eyeX = Math.round((12 + side * eyeOffset) * 100) / 100;

        return `<circle cx="${eyeX}" cy="${eyeCenterY}" r="${Math.round(r * 0.15 * 100) / 100}" fill="#fff"/><circle cx="${eyeX}" cy="${eyeCenterY}" r="${Math.round(r * 0.095 * 100) / 100}" fill="${eyes}"/><circle cx="${eyeX}" cy="${eyeCenterY}" r="${Math.round(r * 0.045 * 100) / 100}" fill="#111827"/><path d="M${Math.round((12 + side * eyeOffset - r * 0.2) * 100) / 100} ${Math.round((eyeY - r * 0.28) * 100) / 100}q${Math.round(r * 0.2 * 100) / 100} ${Math.round(-r * 0.1 * 100) / 100} ${Math.round(r * 0.4 * 100) / 100} 0" stroke="${hairColor ?? eyes}" stroke-width="${Math.round(r * 0.07 * 100) / 100}" stroke-linecap="round" fill="none"/>`;
    }).join('');

    const noseCenterY = Math.round(noseY * 100) / 100;
    const featureStroke = Math.round(r * 0.06 * 100) / 100;

    let noseMarkup = '';

    switch (nose) {
        case 'small': {
            const noseSmallDelta = Math.round(r * 0.08 * 100) / 100;

            noseMarkup = `<path d="M${Math.round((12 - r * 0.08) * 100) / 100} ${noseCenterY}q${noseSmallDelta} ${noseSmallDelta} ${Math.round(r * 0.16 * 100) / 100} 0" stroke="${feature}" stroke-width="${featureStroke}" stroke-linecap="round" fill="none"/>`;
            break;
        }
        case 'button':
            noseMarkup = `<circle cx="12" cy="${noseCenterY}" r="${Math.round(r * 0.1 * 100) / 100}" fill="${feature}"/>`;
            break;
        case 'pointed':
            noseMarkup = `<path d="M12 ${Math.round((noseY - r * 0.28) * 100) / 100}l${Math.round(-r * 0.12 * 100) / 100} ${Math.round(r * 0.3 * 100) / 100}h${Math.round(r * 0.24 * 100) / 100}" stroke="${feature}" stroke-width="${featureStroke}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
            break;
        case 'wide':
            noseMarkup = `<path d="M${Math.round((12 - r * 0.2) * 100) / 100} ${noseCenterY}q${Math.round(r * 0.2 * 100) / 100} ${Math.round(r * 0.14 * 100) / 100} ${Math.round(r * 0.4 * 100) / 100} 0" stroke="${feature}" stroke-width="${featureStroke}" stroke-linecap="round" fill="none"/>`;
            break;
    }

    const mouthCenterY = Math.round((cy + r * 0.62) * 100) / 100;

    let mouthMarkup = '';

    switch (mouth) {
        case 'smile':
            mouthMarkup = `<path d="M${Math.round((12 - r * 0.26) * 100) / 100} ${mouthCenterY}q${Math.round(r * 0.26 * 100) / 100} ${Math.round(r * 0.24 * 100) / 100} ${Math.round(r * 0.52 * 100) / 100} 0" stroke="#7f1d1d" stroke-width="${Math.round(r * 0.07 * 100) / 100}" stroke-linecap="round" fill="none"/>`;
            break;
        case 'grin':
            mouthMarkup = `<path d="M${Math.round((12 - r * 0.3) * 100) / 100} ${mouthCenterY}h${Math.round(r * 0.6 * 100) / 100}a${Math.round(r * 0.3 * 100) / 100} ${Math.round(r * 0.26 * 100) / 100} 0 0 1 ${Math.round(-r * 0.6 * 100) / 100} 0z" fill="#fff" stroke="#7f1d1d" stroke-width="${Math.round(r * 0.05 * 100) / 100}" stroke-linejoin="round"/>`;
            break;
        case 'neutral':
            mouthMarkup = `<path d="M${Math.round((12 - r * 0.2) * 100) / 100} ${mouthCenterY}h${Math.round(r * 0.4 * 100) / 100}" stroke="#7f1d1d" stroke-width="${Math.round(r * 0.07 * 100) / 100}" stroke-linecap="round"/>`;
            break;
        case 'open':
            mouthMarkup = `<ellipse cx="12" cy="${mouthCenterY}" rx="${Math.round(r * 0.26 * 100) / 100}" ry="${Math.round(r * 0.22 * 100) / 100}" fill="#7f1d1d"/><ellipse cx="12" cy="${Math.round((cy + r * 0.62 + r * 0.1) * 100) / 100}" rx="${Math.round(r * 0.14 * 100) / 100}" ry="${Math.round(r * 0.08 * 100) / 100}" fill="#f87171"/>`;
            break;
    }

    const hairBack = gender === 'female'
        ? `<path d="M${Math.round((left - r * 0.1) * 100) / 100} ${cy}a${Math.round(r * 1.1 * 100) / 100} ${Math.round(r * 1.1 * 100) / 100} 0 0 1 ${Math.round(2.2 * r * 100) / 100} 0v${Math.round(r * 1.7 * 100) / 100}h${Math.round(-2.2 * r * 100) / 100}z" fill="${hairColor}"/>`
        : '';

    const hairlineY = Math.round((cy - r * 0.2) * 100) / 100;

    const hairFront = `<path d="M${faceLeft} ${hairlineY}A${faceRadius} ${Math.round(r * 1.05 * 100) / 100} 0 0 1 ${Math.round((12 + r) * 100) / 100} ${hairlineY}Q12 ${Math.round((cy - r * 0.95) * 100) / 100} ${faceLeft} ${hairlineY}z" fill="${hairColor}"/>`;

    let accessoryMarkup = '';

    switch (accessory) {
        case 'glasses': {
            const glassesRadius = Math.round(r * 0.26 * 100) / 100;

            accessoryMarkup = `<g fill="none" stroke="#111827" stroke-width="${Math.round(r * 0.06 * 100) / 100}"><circle cx="${Math.round((12 - eyeOffset) * 100) / 100}" cy="${eyeCenterY}" r="${glassesRadius}"/><circle cx="${Math.round((12 + eyeOffset) * 100) / 100}" cy="${eyeCenterY}" r="${glassesRadius}"/><path d="M${Math.round((12 - eyeOffset + r * 0.26) * 100) / 100} ${eyeCenterY}h${Math.round((2 * eyeOffset - r * 0.52) * 100) / 100}"/></g>`;
            break;
        }
        case 'beret': {
            const beretX = Math.round((12 + r * 0.15) * 100) / 100;

            accessoryMarkup = `<ellipse cx="${beretX}" cy="${Math.round((cy - r * 0.78) * 100) / 100}" rx="${Math.round(r * 1.02 * 100) / 100}" ry="${Math.round(r * 0.42 * 100) / 100}" fill="#ef4444"/><ellipse cx="${beretX}" cy="${Math.round((cy - r * 0.6) * 100) / 100}" rx="${Math.round(r * 0.9 * 100) / 100}" ry="${Math.round(r * 0.13 * 100) / 100}" fill="rgba(0,0,0,0.25)"/><circle cx="${beretX}" cy="${Math.round((cy - r * 1.18) * 100) / 100}" r="${Math.round(r * 0.09 * 100) / 100}" fill="#ef4444"/>`;
            break;
        }
        case 'hardhat': {
            const hatY = Math.round((cy - r * 0.45) * 100) / 100;

            accessoryMarkup = `<path d="M${Math.round((left - r * 0.05) * 100) / 100} ${hatY}a${Math.round(r * 1.05 * 100) / 100} ${Math.round(r * 0.95 * 100) / 100} 0 0 1 ${Math.round(2.1 * r * 100) / 100} 0z" fill="#facc15"/><path d="M${Math.round((left - r * 0.2) * 100) / 100} ${hatY}h${Math.round(2.4 * r * 100) / 100}" stroke="#facc15" stroke-width="${Math.round(r * 0.14 * 100) / 100}" stroke-linecap="round"/>`;
            break;
        }
    }

    const bodyLeft = Math.round((12 - halfWidth) * 100) / 100;
    const bodyRight = Math.round((12 + halfWidth) * 100) / 100;

    const body = `<path d="M${bodyLeft} 24V21.2C${bodyLeft} 18.8 8.4 17.8 12 17.8S${bodyRight} 18.8 ${bodyRight} 21.2V24z" fill="${foreground}"/>`;

    let clothingMarkup = '';

    switch (clothing) {
        case 'tee':
            clothingMarkup = `<path d="M9.8 17.9Q12 20.4 14.2 17.9" fill="${skin}"/>`;
            break;
        case 'collar':
            clothingMarkup = `<path d="M9.6 17.4L12 22 14.4 17.4Q12 18.5 9.6 17.4z" fill="#fff"/><path d="M10.2 17.9L12 20.4 13.8 17.9Q12 18.7 10.2 17.9z" fill="${skin}"/><path d="M9.6 17.3L7.8 20.4 11.6 21.2z" fill="#fff" stroke="rgba(0,0,0,0.3)" stroke-width="0.4" stroke-linejoin="round"/><path d="M14.4 17.3L16.2 20.4 12.4 21.2z" fill="#fff" stroke="rgba(0,0,0,0.3)" stroke-width="0.4" stroke-linejoin="round"/>`;
            break;
        case 'hoodie':
            clothingMarkup = `<ellipse cx="12" cy="16.4" rx="6.4" ry="5" fill="${foreground}" stroke="rgba(0,0,0,0.45)" stroke-width="0.6"/><ellipse cx="12" cy="16.2" rx="4.8" ry="3.6" fill="rgba(0,0,0,0.3)"/><path d="M11 20.2v2.8M13 20.2v2.8" stroke="#fff" stroke-width="0.35" stroke-linecap="round"/>`;
            break;
        case 'blazer':
            clothingMarkup = `<path d="M9.8 17.7L12 21.6 14.2 17.7Q12 18.6 9.8 17.7z" fill="#fff"/><path d="M9.4 17.5L12 22.6 9.8 24 7.6 20.4z" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.35)" stroke-width="0.4" stroke-linejoin="round"/><path d="M14.6 17.5L12 22.6 14.2 24 16.4 20.4z" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.35)" stroke-width="0.4" stroke-linejoin="round"/>`;
            break;
        case 'turtleneck':
            clothingMarkup = `<rect x="9.7" y="15.4" width="4.6" height="3.8" rx="1.3" fill="${foreground}"/><rect x="9.7" y="15.4" width="4.6" height="3.8" rx="1.3" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.4"/><path d="M9.9 17Q12 18 14.1 17" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" stroke-linecap="round"/><ellipse cx="12" cy="16.5" rx="2.6" ry="0.9" fill="rgba(0,0,0,0.28)"/>`;
            break;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="avatar-clip"><circle cx="12" cy="12" r="12"/></clipPath></defs><g clip-path="url(#avatar-clip)"><rect width="24" height="24" fill="${background}"/>${hairBack}<rect x="10.5" y="14" width="3" height="4.4" fill="${skin}"/>${body}${clothingMarkup}${face}${noseMarkup}${eyeMarkup}${mouthMarkup}${hairFront}${accessoryMarkup}</g></svg>`;
}
