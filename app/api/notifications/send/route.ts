import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@voxvalt.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(request: Request) {
    try {
        const { userId, title, body, data } = await request.json();

        // Authorization check - this should be a protected internal endpoint
        // verifying a service role key or similar. For now, we'll check session.
        const supabase = createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        // In a real app, you might want to allow users to trigger notifications for themselves,
        // or restrict this to admin/cron jobs.
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch user subscriptions
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found' });
        }

        const payload = JSON.stringify({
            title,
            body,
            data
        });

        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, payload);
                return { success: true, endpoint: sub.endpoint };
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired/gone, remove from DB
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    return { success: false, endpoint: sub.endpoint, error: 'Expired' };
                }
                return { success: false, error: err.message };
            }
        }));

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error('Send notification error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
