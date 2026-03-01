// app/api/settings/delete-all-data/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete in order (foreign keys)
        await supabase.from('analytics_events').delete().eq('user_id', userId);
        await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        await supabase.from('memories').delete().eq('user_id', userId);

        // Reset profile stats
        await supabase
            .from('profiles')
            .update({ total_recordings: 0 })
            .eq('id', userId);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Failed to delete data' },
            { status: 500 }
        );
    }
}