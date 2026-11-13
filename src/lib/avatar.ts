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
    const cy = 9.5;
    const r = 6 * faceSize;
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
            const jawTop = Math.round((cy + r * 0.4) * 100) / 100;
            const chin = Math.round((cy + r * 1.08) * 100) / 100;

            face = `<path d="M${faceLeft} ${cy}A${faceRadius} ${Math.round(r * 1.05 * 100) / 100} 0 0 1 ${Math.round((12 + r) * 100) / 100} ${cy}L${Math.round((12 + r) * 100) / 100} ${jawTop}Q${Math.round((12 + r) * 100) / 100} ${chin} ${Math.round((12 + r * 0.45) * 100) / 100} ${chin}L${Math.round((12 - r * 0.45) * 100) / 100} ${chin}Q${faceLeft} ${chin} ${faceLeft} ${jawTop}z" fill="${skin}"/>`;
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
            const beretX = 12;

            accessoryMarkup = `<ellipse cx="${beretX}" cy="${Math.round((cy - r * 0.9) * 100) / 100}" rx="${Math.round(r * 1.2 * 100) / 100}" ry="${Math.round(r * 0.65 * 100) / 100}" fill="#ef4444"/><path d="M${Math.round((12 - r * 1.05) * 100) / 100} ${Math.round((cy - r * 0.42) * 100) / 100}Q12 ${Math.round((cy - r * 0.22) * 100) / 100} ${Math.round((12 + r * 1.05) * 100) / 100} ${Math.round((cy - r * 0.42) * 100) / 100}" fill="none" stroke="#b91c1c" stroke-width="${Math.round(r * 0.14 * 100) / 100}" stroke-linecap="round"/><circle cx="${beretX}" cy="${Math.round((cy - r * 1.5) * 100) / 100}" r="${Math.round(r * 0.09 * 100) / 100}" fill="#ef4444"/>`;
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

    const body = clothing === 'hoodie' ? '' : `<path d="M${bodyLeft} 24V21.2C${bodyLeft} 18.8 8.4 17.8 12 17.8S${bodyRight} 18.8 ${bodyRight} 21.2V24z" fill="${foreground}"/>`;

    let clothingMarkup = '';

    switch (clothing) {
        case 'tee':
            clothingMarkup = `<path d="M9.25 17.8Q12 20.4 14.75 17.8" fill="${skin}"/>`;
            break;
        case 'collar':
            clothingMarkup = `<path d="M9 17.8L12 22 15 17.8Q12 18.9 9 17.8z" fill="#fff"/><path d="M9.75 17.8L12 20.4 14.25 17.8Q12 18.7 9.75 17.8z" fill="${skin}"/><path d="M9 17.8L6.75 20.4 11.5 21.2z" fill="#fff" stroke="rgba(0,0,0,0.3)" stroke-width="0.4" stroke-linejoin="round"/><path d="M15 17.8L17.25 20.4 12.5 21.2z" fill="#fff" stroke="rgba(0,0,0,0.3)" stroke-width="0.4" stroke-linejoin="round"/>`;
            break;
        case 'hoodie': {
            const hoodLine = `color-mix(in srgb, ${foreground} 76%, #000)`;

            clothingMarkup = `<g transform="translate(0 13.19) scale(0.046875)" stroke-width="8" stroke-linejoin="round"><path d="M 140 51 Q 143 62 147 70 Q 151 79 157 85 Q 163 91 173 101 Q 185 113 198 123 Q 209 132 220 139 Q 232 146 240 148 Q 248 150 256 152 Q 264 150 272 148 Q 280 146 292 139 Q 303 132 314 123 Q 327 113 339 101 Q 349 91 355 85 Q 361 79 365 70 Q 369 62 372 51 Q 371 48 370 47 Q 363 34 352 26 Q 340 15 327 9 Q 313 3 297 1 Q 277 -2 256 -2 Q 235 -2 215 1 Q 199 3 185 9 Q 172 15 160 26 Q 149 34 142 47 Q 141 48 140 51 Z" fill="color-mix(in srgb, ${foreground} 88%, #000)" stroke="${hoodLine}"/><rect x="203" y="17" width="106" height="135" fill="${skin}"/><path d="M 105 106 Q 108 100 110 95 Q 115 87 120 80 Q 132 63 140 51 Q 143 62 147 70 Q 151 79 157 85 Q 163 91 173 101 Q 185 113 198 123 Q 209 132 220 139 Q 232 146 240 148 Q 248 150 256 152 Q 264 150 272 148 Q 280 146 292 139 Q 303 132 314 123 Q 327 113 339 101 Q 349 91 355 85 Q 361 79 365 70 Q 369 62 372 51 Q 380 63 392 80 Q 397 87 402 95 Q 405 100 407 106 Q 397 112 387 119 Q 374 126 362 133 Q 349 141 337 148 Q 327 153 318 157 Q 312 160 305 163 Q 281 172 256 172 Q 232 172 207 163 Q 200 160 194 157 Q 184 153 175 148 Q 162 141 150 133 Q 137 126 125 119 Q 115 112 105 106 Z" fill="color-mix(in srgb, ${foreground} 94%, #000)" stroke="${hoodLine}"/><path d="M 0 274 L 0 250 Q 10 230 20 210 Q 35 180 50 150 Q 68 132 85 118 Q 95 111 105 106 Q 115 112 125 119 Q 137 126 150 133 Q 162 141 175 148 Q 184 153 194 157 Q 200 160 207 163 Q 232 172 256 172 Q 281 172 305 163 Q 312 160 318 157 Q 327 153 337 148 Q 349 141 362 133 Q 374 126 387 119 Q 397 112 407 106 Q 417 111 427 118 Q 445 132 462 150 Q 477 180 492 210 Q 502 230 512 250 L 512 274 Z" fill="${foreground}" stroke="${hoodLine}"/><path d="M 50 150 Q 54 200 68 250 Q 82 264 106 272 M 462 150 Q 458 200 444 250 Q 430 264 406 272" fill="none" stroke="${hoodLine}" stroke-linecap="round"/></g>`;
            break;
        }
        case 'blazer':
            clothingMarkup = `<path d="M9.25 17.8L12 21.6 14.75 17.8Q12 18.7 9.25 17.8z" fill="#fff"/><path d="M8.75 17.8L12 22.6 9.25 24 6.5 20.4z" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.35)" stroke-width="0.4" stroke-linejoin="round"/><path d="M15.25 17.8L12 22.6 14.75 24 17.5 20.4z" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.35)" stroke-width="0.4" stroke-linejoin="round"/>`;
            break;
        case 'turtleneck':
            clothingMarkup = `<rect x="9.1" y="17.8" width="5.8" height="3.8" rx="1.3" fill="${foreground}"/><rect x="9.1" y="17.8" width="5.8" height="3.8" rx="1.3" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.4"/><path d="M9.35 19.4Q12 20.4 14.65 19.4" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" stroke-linecap="round"/><ellipse cx="12" cy="18.9" rx="3.3" ry="0.9" fill="rgba(0,0,0,0.28)"/>`;
            break;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="avatar-clip"><circle cx="12" cy="12" r="12"/></clipPath></defs><g clip-path="url(#avatar-clip)"><rect width="24" height="24" fill="${background}"/>${hairBack}<rect x="9.5" y="14" width="5" height="6.5" fill="${skin}"/>${body}${clothingMarkup}${face}${noseMarkup}${eyeMarkup}${mouthMarkup}${hairFront}${accessoryMarkup}</g></svg>`;
}
