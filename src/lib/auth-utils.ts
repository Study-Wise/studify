import type { Auth } from '@clerk/astro/server';

// Permission checking utilities
export function hasPermission(auth: Auth, permission: string): boolean {
  const { has } = auth();
  return has({ permission });
}

// User metadata utilities
export function getUserRole(auth: Auth): string | null {
  const { sessionClaims } = auth();
  return (sessionClaims?.metadata as any)?.role || null;
}

export function getUserMetadata(auth: Auth): any {
  const { sessionClaims } = auth();
  return sessionClaims?.metadata || {};
}

// Admin promotion configuration (same as webhook)
export const ADMIN_EMAILS = [
  'adarsh@mathwise.com', // Replace with your email
  'admin@mathwise.com',
  'owner@mathwise.com'
];

export const ADMIN_DOMAINS = [
  '@mathwise.com',
  '@yourcompany.com' // Add your company domain
];

export function shouldPromoteToAdmin(email: string): boolean {
  const emailLower = email.toLowerCase();
  
  // Check specific admin emails
  if (ADMIN_EMAILS.includes(emailLower)) {
    return true;
  }
  
  // Check admin domains
  return ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain));
}
