import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configuration
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@voxvalt.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function GET(request: Request) {
    try {
        // 1. Security check
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        const now = new Date().toISOString();

        // 2. Fetch pending notifications
        const { data: notifications, error: fetchError } = await supabase
            .from('scheduled_notifications')
            .select('*')
            .eq('sent', false)
            .lte('scheduled_for', now)
            .limit(50);

        if (fetchError) throw fetchError;
        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ success: true, processed: 0 });
        }

        console.log(`[NotificationProcessor] Processing ${notifications.length} notifications...`);

        const results = await Promise.all(notifications.map(async (notif) => {
            try {
                // Get user's push subscriptions
                const { data: subscriptions } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .eq('user_id', notif.user_id);

                if (!subscriptions || subscriptions.length === 0) {
                    await supabase.from('scheduled_notifications').update({ sent: true, error: 'No subscriptions' }).eq('id', notif.id);
                    return { id: notif.id, status: 'no_subscriptions' };
                }

                const payload = JSON.stringify({
                    title: notif.title,
                    body: notif.body,
                    data: {
                        taskId: notif.task_id,
                        memoryId: notif.memory_id,
                        type: notif.type,
                        url: '/'
                    }
                });

                // Send to all endpoints
                await Promise.all(subscriptions.map(async (sub) => {
                    try {
                        await webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }, payload);
                    } catch (err: any) {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                        }
                        throw err;
                    }
                }));

                // Mark sent
                await supabase.from('scheduled_notifications')
                    .update({
                        sent: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', notif.id);

                return { id: notif.id, status: 'sent' };
            } catch (err: any) {
                console.error(`[NotificationProcessor] Failed for ${notif.id}:`, err.message);
                await supabase.from('scheduled_notifications')
                    .update({
                        error: err.message,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', notif.id);
                return { id: notif.id, status: 'error', error: err.message };
            }
        }));

        return NextResponse.json({
            success: true,
            processed: notifications.length,
            results
        });

    } catch (err: any) {
        console.error('[NotificationProcessor] Fatal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
