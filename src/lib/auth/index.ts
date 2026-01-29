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

// Build social providers configuration
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

// Add Google provider if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
}

// Add GitHub provider if configured (skip placeholder values)
if (process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_ID !== 'your-github-client-id' &&
    process.env.GITHUB_CLIENT_SECRET !== 'your-github-client-secret') {
    socialProviders.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
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

    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:4321"],
});
