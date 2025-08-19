const adminUsers = ['adarshravikumar2@gmail.com'];

import 'dotenv/config';

import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/initialize';
import { user, session, account, verification } from '../db/schema';
import { betterAuth } from 'better-auth';
import { passkey } from 'better-auth/plugins/passkey';
import { createAuthMiddleware } from 'better-auth/api';

const betterAuthBaseUrl = 'https://mathwise-v2.vercel.app';

const config = {
    baseURL: `${process.env.BETTER_AUTH_BASE_URL || betterAuthBaseUrl}/auth`,
    trustedOrigins: [
        'https://mathwise-v2.vercel.app',
        'http://localhost:4321',
    ],
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: { user, session, account, verification }
    }),
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string, 
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }, 
    },
    plugins: [ 
        passkey(), 
    ], 
    hooks: {
        after: createAuthMiddleware(async (ctx: any) => {
            if (ctx.path.startsWith('/sign-up')) {
                const newSession = ctx.context.newSession;
                if (newSession) {
                    if (adminUsers.includes(newSession.user.email)) {
                        newSession.user.role = 'admin';
                    }
                }
                return newSession;
            }
        }),
    },
}

const providerNameReplacements = {
    github: 'GitHub',
}

const auth = betterAuth(config);

const authProviders = Object.keys(config.socialProviders || {}).map(provider => {
    const replacement = providerNameReplacements[provider as keyof typeof providerNameReplacements];
    const name = replacement || provider.charAt(0).toUpperCase() + provider.slice(1);
    return { key: provider, name };
});

export { auth, authProviders }