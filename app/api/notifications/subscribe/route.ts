import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const subscription = await request.json();
        const supabase = createServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: request.headers.get('user-agent') || 'unknown',
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Subscription error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { endpoint } = await request.json();
        const supabase = createServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint)
            .eq('user_id', user.id); // Ensure user owns subscription

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Unsubscribe error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
