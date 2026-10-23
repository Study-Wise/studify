import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { user, session, account, verification } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import type { SocialProviderConfig } from '@/lib/auth/types';

const ADMIN_EMAILS = [
    'adarshravikumar2@gmail.com',
    'riengupta@gmail.com',
    'admin@studywise.onl'
];

const ADMIN_DOMAINS: string[] = ['@studywise.onl'];

// Moderator domain whitelist (optional)
const MODERATOR_DOMAINS: string[] = [];

// Helper to get environment variable with fallback between import.meta.env and process.env
// This ensures compatibility with both Vite/Astro and Node.js runtime environments
function getEnvVar(key: string): string | undefined {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        if (import.meta.env[key]) return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env) return process.env[key];
    return undefined;
}

const socialProviders: SocialProviderConfig = {};

// Google OAuth
const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
if (googleClientId && googleClientSecret) {
    socialProviders.google = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
    };
}

// GitHub OAuth
const githubClientId = getEnvVar('GITHUB_CLIENT_ID');
const githubClientSecret = getEnvVar('GITHUB_CLIENT_SECRET');
if (githubClientId && githubClientSecret) {
    socialProviders.github = {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
    };
}

const baseURL = getEnvVar('BETTER_AUTH_URL') || 'http://localhost:4321';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
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
            sendMagicLink: async ({ email: _email, token: _token, url: _url }) => {
                // TODO: Configure email service (Resend, SendGrid, etc.)
                // console.log(`Magic link for ${email}: ${url}`);
                // Example with Resend:
                // await sendEmail({
                //   to: email,
                //   subject: 'Your Studify Magic Link',
                //   html: `<a href="${url}">Click here to sign in</a>`,
                // });
            },
        }),
    ],

    databaseHooks: {
        user: {
            create: {
                before: async user => {
                    // Auto-promote user based on email/domain whitelist
                    return {
                        data: {
                            ...user,
                            role: ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()) || ADMIN_DOMAINS.some(domain => user.email.toLowerCase().endsWith(domain))
                                ? 'admin'
                                : (MODERATOR_DOMAINS.some(domain => user.email.toLowerCase().endsWith(domain)) ? 'moderator' : 'user'),
                        },
                    };
                },
            },
        },
    },

    baseURL: baseURL,
    trustedOrigins: [baseURL, import.meta.env.SITE, ...[getEnvVar('VERCEL_URL'), getEnvVar('VERCEL_BRANCH_URL'), getEnvVar('VERCEL_PROJECT_PRODUCTION_URL')].filter(Boolean).map(host => `https://${host}`)],
});
