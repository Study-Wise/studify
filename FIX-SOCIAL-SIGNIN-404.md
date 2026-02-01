# Fix: Social Sign-In 404 Error

## Issue

When attempting to sign in using social providers (Google or GitHub), the application returned a 404 error:

```
/api/auth/sign-in/social:1 Failed to load resource: the server responded with a status of 404 ()
```

## Root Cause

The 404 error was being returned by **Better Auth itself** (not Astro routing) when it couldn't find the configured social provider. This occurs when Better Auth's `signInSocial` endpoint is called but the provider isn't registered in the `socialProviders` configuration.

The underlying issue was that the OAuth environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.) weren't being properly read during module initialization due to differences in how Vite/Astro and Node.js handle environment variables.

### Technical Details

In the Better Auth source code (`sign-in.ts`), when a provider isn't found:

```typescript
const provider = c.context.socialProviders.find(
    (p) => p.id === c.body.provider,
);
if (!provider) {
    throw new APIError("NOT_FOUND", {
        message: BASE_ERROR_CODES.PROVIDER_NOT_FOUND,
    });
}
```

This `APIError("NOT_FOUND")` returns a 404 status code.

## Changes Made

### 1. `src/lib/auth/index.ts`

#### Added `getEnvVar` Helper Function

Created a helper function that checks both `import.meta.env` (Vite/Astro) and `process.env` (Node.js) for environment variables:

```typescript
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
```

#### Replaced Dynamic Property Access

**Before:**
```typescript
const socialProviderNames = ['google', 'github'] as const;

socialProviders: {
    ...socialProviderNames.reduce((acc, provider) => {
        const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
        const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
        if (clientId && clientSecret) {
            acc[provider] = { clientId, clientSecret };
        }
        return acc;
    }, {} as Record<string, { clientId: string; clientSecret: string }>),
},
```

**After:**
```typescript
function buildSocialProviders(): SocialProviderConfig {
    const providers: SocialProviderConfig = {};

    // Google OAuth
    const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
    const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
    if (googleClientId && googleClientSecret) {
        providers.google = {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
        };
    }

    // GitHub OAuth
    const githubClientId = getEnvVar('GITHUB_CLIENT_ID');
    const githubClientSecret = getEnvVar('GITHUB_CLIENT_SECRET');
    if (githubClientId && githubClientSecret) {
        providers.github = {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
        };
    }

    return providers;
}

const socialProviders = buildSocialProviders();
```

#### Extracted baseURL Variable

```typescript
const baseURL = getEnvVar('BETTER_AUTH_URL') || "http://localhost:4321";

export const auth = betterAuth({
    // ...
    baseURL,
    trustedOrigins: [baseURL],
});
```

### 2. `src/pages/api/auth/[...all].ts`

Added error logging to help debug auth API issues:

```typescript
const handler: APIRoute = async (ctx) => {
    try {
        return await auth.handler(ctx.request);
    } catch (error) {
        console.error("[Auth API Error]", error);
        throw error;
    }
};
```

## Deployment Checklist

If the 404 error persists after deploying these changes, verify the following environment variables are set in your Vercel (or hosting provider) dashboard:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `BETTER_AUTH_URL` | Base URL for auth (e.g., `https://studywise.onl`) |

## References

- [Better Auth Astro Integration](https://www.better-auth.com/docs/integrations/astro)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Better Auth Basic Usage](https://www.better-auth.com/docs/basic-usage)
- [GitHub Issue #6671 - NextJs API route returns 404](https://github.com/better-auth/better-auth/issues/6671)
