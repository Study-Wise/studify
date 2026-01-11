// Server-side Better Auth configuration
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/initialize";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
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

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:4321"],
});
