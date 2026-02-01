// Server-side Better Auth configuration
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/initialize";
import { magicLink } from "better-auth/plugins";
import { user, session, account, verification } from "@/db/auth-schema";
import type { UserRole } from "../types";

// Admin email whitelist
const ADMIN_EMAILS = [
    'adarshravikumar2@gmail.com',
    'riengupta@gmail.com',
    'admin@studywise.onl'
];

// Admin domain whitelist
const ADMIN_DOMAINS: string[] = ['@studywise.onl'];

// Moderator domain whitelist (optional)
const MODERATOR_DOMAINS: string[] = [];

// Determine user role based on email
function determineUserRole(email: string): UserRole {
    const emailLower = email.toLowerCase();

    // Check for admin email match
    if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(emailLower)) {
        return "admin";
    }

    // Check for admin domain match
    if (ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain))) {
        return "admin";
    }

    // Check for moderator domain match
    if (MODERATOR_DOMAINS.some(domain => emailLower.endsWith(domain))) {
        return "moderator";
    }

    // Default role
    return "user";
}

// Helper to get environment variable with fallback between import.meta.env and process.env
// This ensures compatibility with both Vite/Astro and Node.js runtime environments
function getEnvVar(key: string): string | undefined {
    // Try import.meta.env first (Vite/Astro way)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        const value = (import.meta.env as Record<string, string>)[key];
        if (value) return value;
    }
    // Fallback to process.env (Node.js way)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
}

// Build social providers configuration
// Each provider is only added if both clientId and clientSecret are available
type SocialProviderConfig = {
    google?: { clientId: string; clientSecret: string };
    github?: { clientId: string; clientSecret: string };
};

function buildSocialProviders(): SocialProviderConfig {
    const providers: SocialProviderConfig = {};

    // Google OAuth
    const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
    const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');

    console.log('[Better Auth] GOOGLE_CLIENT_ID exists:', !!googleClientId);
    console.log('[Better Auth] GOOGLE_CLIENT_SECRET exists:', !!googleClientSecret);

    if (googleClientId && googleClientSecret) {
        providers.google = {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
        };
    }

    // GitHub OAuth
    const githubClientId = getEnvVar('GITHUB_CLIENT_ID');
    const githubClientSecret = getEnvVar('GITHUB_CLIENT_SECRET');

    console.log('[Better Auth] GITHUB_CLIENT_ID exists:', !!githubClientId);
    console.log('[Better Auth] GITHUB_CLIENT_SECRET exists:', !!githubClientSecret);

    if (githubClientId && githubClientSecret) {
        providers.github = {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
        };
    }

    return providers;
}

const socialProviders = buildSocialProviders();
const baseURL = getEnvVar('BETTER_AUTH_URL') || "http://localhost:4321";

// Debug logging for social providers
console.log('[Better Auth] Configured social providers:', Object.keys(socialProviders));
console.log('[Better Auth] Base URL:', baseURL);
if (!socialProviders.google) {
    console.warn('[Better Auth] Google provider NOT configured - check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars');
}
if (!socialProviders.github) {
    console.warn('[Better Auth] GitHub provider NOT configured - check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars');
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user,
            session,
            account,
            verification,
        },
    }),

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    socialProviders,

    plugins: [
        magicLink({
            sendMagicLink: async ({ email, token, url }) => {
                // TODO: Configure email service (Resend, SendGrid, etc.)
                console.log(`Magic link for ${email}: ${url}`);
                // Example with Resend:
                // await sendEmail({
                //   to: email,
                //   subject: "Your StudyWise Magic Link",
                //   html: `<a href="${url}">Click here to sign in</a>`,
                // });
            },
        }),
    ],

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Auto-promote user based on email/domain whitelist
                    const role = determineUserRole(user.email);
                    return {
                        data: {
                            ...user,
                            role,
                        },
                    };
                },
            },
        },
    },

    baseURL,
    trustedOrigins: [baseURL],
});
