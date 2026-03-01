// app/api/settings/delete-account/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all user data first
        await supabase.from('analytics_events').delete().eq('user_id', userId);
        await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        await supabase.from('memories').delete().eq('user_id', userId);
        await supabase.from('user_subscriptions').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);

        // Delete auth user (requires service role)
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Failed to delete account' },
            { status: 500 }
        );
    }
}