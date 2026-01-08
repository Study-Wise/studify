# Admin Setup Guide

This guide explains how to set up admin users in the application.

## How Admin Roles Work

The application uses Clerk's public metadata system to manage admin roles. Admin status is checked by fetching the user from Clerk API and checking:

**User Public Metadata**: `user.publicMetadata.role === 'admin'` - The application fetches the user object from Clerk and checks their public metadata directly. This approach doesn't require session token customization.

## Setting Up Admin Users

### Step 1: Add Role to User Public Metadata

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Users**
3. Select the user you want to make an admin
4. Scroll to the **"Metadata"** section
5. Click **"Edit"** on **"Public metadata"**
6. Add this JSON:

    ```json
    {
      "role": "admin"
    }
    ```

7. Click **"Save"**

### Step 2: Verify Admin Access

The admin role will take effect immediately on the next page load or API request. No need to sign out and back in since we fetch the user's publicMetadata directly from Clerk on each request.

## Auto-Promotion via Webhook

The application supports automatic admin promotion via webhook for specific emails/domains configured in `src/lib/auth/utils.ts`.

To configure which emails/domains should be auto-promoted to admin, edit the `ADMIN_EMAILS` and `ADMIN_DOMAINS` arrays in that file.

### Setting Up the Webhook

**IMPORTANT**: The webhook must be configured for auto-promotion to work. Without it, you'll need to manually add the admin role in Clerk Dashboard.

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Webhooks** (in the left sidebar)
3. Click **"Add Endpoint"** or **"Create"**
4. Configure the endpoint:
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/clerk`
     - For development: Use your dev URL
     - For production: Use your production URL
   - **Subscribe to events**:
     - ✅ `user.created` (required for auto-promotion on signup)
     - ✅ `user.updated` (optional, for retroactive promotion)
5. Click **"Create"** or **"Add Endpoint"**
6. **Copy the Signing Secret**:
   - After creating the endpoint, Clerk will display a **"Signing Secret"** (starts with `whsec_`)
   - Copy this secret - you'll need it for the next step
   - You can also find it later by clicking on the webhook endpoint

#### Add Webhook Secret to Environment Variables

Add the webhook signing secret to your environment:

1. **Local Development**: Add to your `.env` file:

   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

2. **Production (Vercel)**: Add environment variable in Vercel Dashboard:
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add `CLERK_WEBHOOK_SECRET` with the value from Clerk
   - Redeploy your application

**Security Note**: The webhook secret is required to verify that webhook requests are legitimately from Clerk. Without it, the webhook endpoint will reject all requests.

#### Testing the Webhook

After setting up the webhook:

1. Create a new test account with one of the admin emails (e.g., `test@studywise.onl`)
2. Check your server logs for:

   ```text
   📨 Clerk webhook received: user.created
   👤 New user created: test@studywise.onl (user_xxx)
   ✅ Auto-promoted user test@studywise.onl to admin role via webhook
   ```

3. Verify admin access by visiting `/admin` or creating more than 5 threads

## Admin Features

Once a user has admin role, they get:

- **Unlimited thread creation** (bypasses the 5-thread limit)
- **Access to `/admin` page**
- **Access to all threads** (can view/edit any user's threads)
- **Special admin UI indicators**

## Verifying Admin Status

Check the console logs when creating a thread. You should see:

```text
🔐 Admin check (from user.publicMetadata): { userRole: 'admin', isAdmin: true }
👤 User info: { userId: '...', userEmail: '...', userRole: 'admin', isAdmin: true }
👑 Admin user detected - skipping thread limit check
```

## Troubleshooting

### "Thread limit exceeded" error for admins

**Problem**: Admin users still see the thread limit error.

**Solutions**:

1. Verify `publicMetadata.role` is set to `'admin'` in Clerk Dashboard
2. Check console logs to see what role is detected
3. Ensure the role value is exactly `'admin'` (lowercase)

### Admin page redirects to home

**Problem**: Accessing `/admin` redirects to homepage.

**Solutions**:

1. Verify `publicMetadata.role` is set to `'admin'` in Clerk Dashboard
2. Check the value is exactly `'admin'` (lowercase, no extra spaces)
3. Check server logs for any errors when fetching the user

### Auto-promotion not working

**Problem**: Users with admin emails/domains aren't auto-promoted.

**Solutions**:

1. **Verify `CLERK_WEBHOOK_SECRET` is set**:
   - Check your `.env` file (local) or Vercel environment variables (production)
   - The secret should start with `whsec_`
   - Without this, all webhook requests will be rejected

2. Verify webhook is configured in Clerk Dashboard:
   - Go to Webhooks section
   - Ensure endpoint URL matches your deployment
   - Verify `user.created` event is checked
   - Copy the signing secret and add it to environment variables

3. Check webhook endpoint is accessible:
   - Test: `POST /api/webhooks/clerk`
   - Check server logs for webhook processing errors
   - Look for "Webhook signature verification failed" errors

4. Verify email/domain is in the auto-promotion list:
   - Edit `src/lib/auth/utils.ts`
   - Add your email to `ADMIN_EMAILS` array
   - Or add your domain to `ADMIN_DOMAINS` array

5. Check server logs when creating a new user:
   - You should see: "📨 Clerk webhook received: user.created"
   - Then: "✅ Auto-promoted user \[email\] to admin role via webhook"
   - If you see errors, check the webhook secret and configuration
