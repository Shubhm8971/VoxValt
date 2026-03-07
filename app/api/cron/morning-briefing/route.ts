import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use Service Role Key to bypass RLS for cron job
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured. Morning briefing API disabled.');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Placeholder function for push notifications
async function sendPushNotification(subscription: any, payload: any) {
    // TODO: Implement actual push notification logic
    console.log('Would send push notification:', payload);
    return Promise.resolve();
}

export async function GET(req: Request) {
    // 1. Security Check: Ensure this is actually a Cron service calling
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    try {
        // 2. Get all users who have a push subscription stored
        // Assumes you have a 'profiles' or 'subscriptions' table
        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select('id, push_subscription')
            .not('push_subscription', 'is', null);

        if (error) throw error;

        // 3. Trigger notifications (Simplified example using a hypothetical sendPush function)
        const notificationPromises = users.map(async (user) => {
            // We fetch briefing data for THIS specific user
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const briefingRes = await fetch(`${baseUrl}/api/briefing/summary?userId=${user.id}`, {
                headers: { 'x-internal-secret': process.env.CRON_SECRET! }
            });

            const { summary } = await briefingRes.json();

            // Send via Web Push (using 'web-push' library)
            return sendPushNotification(user.push_subscription, {
                title: "Your VoxValt Morning Briefing",
                body: summary,
                url: "/briefing"
            });
        });

        await Promise.all(notificationPromises);

        return NextResponse.json({ success: true, processed: users.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
