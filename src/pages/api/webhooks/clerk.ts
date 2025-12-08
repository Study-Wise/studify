import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { shouldPromoteToAdmin } from '../../../lib/auth-utils';

export const POST: APIRoute = async (context) => {
    try {
        const body = await context.request.json();
        const { type, data } = body;

        console.log(`📨 Clerk webhook received: ${type}`);

        // Handle user.created webhook
        if (type === 'user.created') {
            const user = data;
            const email = user.email_addresses?.[0]?.email_address;
            const userId = user.id;

            console.log(`👤 New user created: ${email} (${userId})`);

            if (email && shouldPromoteToAdmin(email)) {
                try {
                    // Promote user to admin
                    const client = clerkClient(context);
                    await client.users.updateUserMetadata(userId, {
                        publicMetadata: {
                            role: 'admin',
                            promotedAt: new Date().toISOString(),
                            promotedBy: 'auto-webhook'
                        }
                    });

                    console.log(`✅ Auto-promoted user ${email} to admin role via webhook`);

                    return new Response(JSON.stringify({
                        success: true,
                        promoted: true,
                        email: email
                    }), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (promotionError) {
                    console.error(`❌ Failed to promote user ${email}:`, promotionError);
                    return new Response(JSON.stringify({
                        success: true,
                        promoted: false,
                        error: 'Failed to promote user',
                        details: String(promotionError)
                    }), {
                        status: 200, // Return 200 so Clerk doesn't retry
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } else {
                console.log(`ℹ️ User ${email} does not qualify for auto-promotion`);
            }
        }

        // Handle user.updated webhook (in case metadata was manually added)
        if (type === 'user.updated') {
            const user = data;
            const email = user.email_addresses?.[0]?.email_address;
            const userId = user.id;
            const currentRole = user.public_metadata?.role;

            console.log(`🔄 User updated: ${email} (${userId}), current role: ${currentRole || 'none'}`);

            // If user doesn't have admin role but should be promoted
            if (email && !currentRole && shouldPromoteToAdmin(email)) {
                try {
                    const client = clerkClient(context);
                    await client.users.updateUserMetadata(userId, {
                        publicMetadata: {
                            role: 'admin',
                            promotedAt: new Date().toISOString(),
                            promotedBy: 'auto-webhook-update'
                        }
                    });

                    console.log(`✅ Auto-promoted existing user ${email} to admin role via webhook`);
                } catch (promotionError) {
                    console.error(`❌ Failed to promote existing user ${email}:`, promotionError);
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return new Response(JSON.stringify({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

export const prerender = false;
