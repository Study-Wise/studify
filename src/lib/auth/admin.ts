// Admin role management for Neon Auth
// Note: Admin status is determined by email matching against a whitelist

const ADMIN_EMAILS = [
    'adarshravikumar2@gmail.com',
    'riengupta@gmail.com',
    'admin@studywise.onl'
];

const ADMIN_DOMAINS = [
    '@studywise.onl',
];

/**
 * Check if an email should have admin privileges
 */
export function shouldPromoteToAdmin(email: string): boolean {
    const emailLower = email.toLowerCase();

    // Check exact email matches
    if (ADMIN_EMAILS.includes(emailLower)) {
        return true;
    }

    // Check domain matches
    return ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain));
}

/**
 * Check if a user is an admin based on their email
 */
export async function isUserAdmin(email: string): Promise<boolean> {
    return shouldPromoteToAdmin(email);
}

/**
 * Get user role (either 'admin' or 'user')
 */
export async function getUserRole(email: string): Promise<'admin' | 'user'> {
    return (await isUserAdmin(email)) ? 'admin' : 'user';
}
