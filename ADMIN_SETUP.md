# Admin Setup Guide

This guide explains how to set up admin users in the application.

## How Admin Roles Work

The application uses Clerk's metadata system to manage admin roles. There are two ways admin status is checked:

1. **Session Claims (Primary)**: `sessionClaims.metadata.role === 'admin'` - Used by most of the app
2. **Public Metadata (Fallback)**: `user.publicMetadata.role === 'admin'` - Used as backup

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

### Step 2: Configure Session Claims (REQUIRED)

For the admin role to work properly throughout the app, you need to add `publicMetadata.role` to the JWT session token:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Sessions** (in the left sidebar)
3. Click on **"Customize session token"**
4. Add this code to include the role in session claims:

    ```json
    {
        "metadata": {
        "role": "{{user.public_metadata.role}}"
        }
    }
    ```

5. Click **"Save"**

### Step 3: Sign Out and Sign Back In

After configuring session claims, users must sign out and sign back in for the changes to take effect. Session tokens are only updated on new sign-ins.

## Auto-Promotion via Webhook

The application supports automatic admin promotion via webhook for specific emails/domains configured in `src/lib/auth-utils.ts`.

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

#### Testing the Webhook

After setting up the webhook:

1. Create a new test account with one of the admin emails (e.g., `test@studywise.onl`)
2. Check your server logs for:

   ```text
   📨 Clerk webhook received: user.created
   👤 New user created: test@studywise.onl (user_xxx)
   ✅ Auto-promoted user test@studywise.onl to admin role via webhook
   ```

3. Sign out and sign back in with the new account
4. Verify admin access by visiting `/admin` or creating more than 5 threads

## Admin Features

Once a user has admin role, they get:

- **Unlimited thread creation** (bypasses the 5-thread limit)
- **Access to `/admin` page**
- **Access to all threads** (can view/edit any user's threads)
- **Special admin UI indicators**

## Verifying Admin Status

Check the console logs when creating a thread. You should see:

```text
🔍 User metadata: { sessionClaimsRole: 'admin', publicMetadata: { role: 'admin' }, ... }
👤 User info: { userId: '...', userEmail: '...', userRole: 'admin', isAdmin: true }
👑 Admin user detected - skipping thread limit check
```

## Troubleshooting

### "Thread limit exceeded" error for admins

**Problem**: Admin users still see the thread limit error.

**Solutions**:

1. Verify `publicMetadata.role` is set to `'admin'` in Clerk Dashboard
2. Verify session token customization is configured (Step 2 above)
3. Sign out and sign back in to refresh the session token
4. Check console logs to see what role is detected

### Admin page redirects to home

**Problem**: Accessing `/admin` redirects to homepage.

**Solutions**:

1. Ensure session token customization is configured
2. Sign out and sign back in
3. Check `sessionClaims.metadata.role` in browser DevTools:
   - Open DevTools → Application → Cookies
   - Look for Clerk session cookie
   - Decode JWT at jwt.io to verify `metadata.role` exists

### Auto-promotion not working

**Problem**: Users with admin emails/domains aren't auto-promoted.

**Solutions**:

1. Verify webhook is configured in Clerk Dashboard
2. Check webhook endpoint is accessible: `POST /api/webhooks/clerk`
3. Check server logs for webhook processing errors
4. Verify email/domain is in `ADMIN_EMAILS` or `ADMIN_DOMAINS` in `src/lib/auth-utils.ts`
