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

const socialProviderNames = ['google', 'github'] as const;

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

    socialProviders: {
        ...socialProviderNames.reduce((acc, provider) => {
            const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
            const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
            if (clientId && clientSecret) {
                acc[provider] = {
                    clientId,
                    clientSecret,
                };
            }
            return acc;
        }, {} as Record<string, { clientId: string; clientSecret: string }>),
    },

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
