// Permission checking utilities
export function hasPermission(auth: any, permission: string): boolean {
    const { has } = auth();
    return has({ permission });
}

// User metadata utilities
export function getUserRole(auth: any): string | null {
    const { sessionClaims } = auth();
    return (sessionClaims?.metadata as any)?.role || null;
}

export function getUserMetadata(auth: any): any {
    const { sessionClaims } = auth();
    return sessionClaims?.metadata || {};
}

// Admin promotion configuration (same as webhook)
export const ADMIN_EMAILS = [
    'adarshravikumar2@gmail.com',
    'riengupta@gmail.com',
    'admin@conversaition.online'
];

export const ADMIN_DOMAINS = [
    '@conversaition.online',
];

export function shouldPromoteToAdmin(email: string): boolean {
    const emailLower = email.toLowerCase();
    if (ADMIN_EMAILS.includes(emailLower)) {
      return true;
    }
    return ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain));
}
