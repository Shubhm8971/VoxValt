import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured. Notifications API disabled.');
}

const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Web Push configuration
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:your-email@voxvalt.com',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    try {
        const { userId, title, body, icon, badge, tag, data } = await request.json();

        if (!userId || !title) {
            return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
        }

        // Get user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No push subscriptions found' }, { status: 200 });
        }

        // Send notifications to all subscriptions
        const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/icons/icon-192.png',
            badge: badge || '/icons/badge-72x72.png',
            tag,
            data: data || { url: '/' }
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (subscription: any) => {
                try {
                    await webpush.sendNotification(subscription.subscription, payload);
                    return { success: true, subscriptionId: subscription.id };
                } catch (error: any) {
                    console.error('Failed to send notification:', error);
                    
                    // Remove invalid subscriptions
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', subscription.id);
                    }
                    
                    return { success: false, subscriptionId: subscription.id, error: error.message };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            message: `Notifications sent: ${successful} successful, ${failed} failed`,
            successful,
            failed,
            total: results.length
        });

    } catch (error: any) {
        console.error('Error in notifications API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
