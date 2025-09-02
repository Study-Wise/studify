import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { shouldPromoteToAdmin } from '../../../lib/auth-utils';

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { type, data } = body;

    // Handle user.created webhook
    if (type === 'user.created') {
      const user = data;
      const email = user.email_addresses?.[0]?.email_address;
      
      if (email && shouldPromoteToAdmin(email)) {
        // Promote user to admin
        const client = clerkClient(context);
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: {
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: 'webhook'
          }
        });
        
        console.log(`Auto-promoted user ${email} to admin role via webhook`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
