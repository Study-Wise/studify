import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';

// Admin promotion configuration
const ADMIN_EMAILS = [
  'adarshravikumar2@gmail.com',
  'admin@conversaition.online'
];

const ADMIN_DOMAINS = [
  '@conversaition.online',
];

function shouldPromoteToAdmin(email: string): boolean {
  const emailLower = email.toLowerCase();
  
  // Check specific admin emails
  if (ADMIN_EMAILS.includes(emailLower)) {
    return true;
  }
  
  // Check admin domains
  return ADMIN_DOMAINS.some(domain => emailLower.endsWith(domain));
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle user.created webhook
    if (type === 'user.created') {
      const user = data;
      const email = user.email_addresses?.[0]?.email_address;
      
      if (email && shouldPromoteToAdmin(email)) {
        // Promote user to admin
        await clerkClient.users.updateUserMetadata(user.id, {
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
