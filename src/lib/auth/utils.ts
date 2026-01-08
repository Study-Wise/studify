// Permission checking utilities
export function hasPermission(auth: any, permission: string): boolean {
    const { has } = auth();
    return has({ permission });
}

// User metadata utilities - fetch from user.publicMetadata
export function getUserRoleFromUser(user: any): string | null {
    return (user.publicMetadata as any)?.role || null;
}

export function getUserMetadataFromUser(user: any): any {
    return user.publicMetadata || {};
}

// Admin promotion configuration (same as webhook)
export const ADMIN_EMAILS = [
    'adarshravikumar2@gmail.com',
    'riengupta@gmail.com',
    'admin@studywise.onl'
];

export const ADMIN_DOMAINS = [
    '@studywise.onl',
];

export function shouldPromoteToAdmin(email: string): boolean {
    const emailLower = email.toLowerCase();
    console.log(`🔍 shouldPromoteToAdmin check for: ${emailLower}`);
    console.log(`📋 ADMIN_EMAILS:`, ADMIN_EMAILS);
    console.log(`📋 ADMIN_DOMAINS:`, ADMIN_DOMAINS);

    if (ADMIN_EMAILS.includes(emailLower)) {
        console.log(`✅ Email found in ADMIN_EMAILS`);
        return true;
    }

    const matchesDomain = ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain));
    if (matchesDomain) {
        console.log(`✅ Email matches ADMIN_DOMAINS`);
    } else {
        console.log(`❌ Email does not match any admin criteria`);
    }

    return matchesDomain;
}
