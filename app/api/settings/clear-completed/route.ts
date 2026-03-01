// app/api/settings/clear-completed/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Count before delete
        const { count } = await supabase
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'completed');

        // Delete completed items
        const { error } = await supabase
            .from('memories')
            .delete()
            .eq('user_id', session.user.id)
            .eq('status', 'completed');

        if (error) throw error;

        return NextResponse.json({
            success: true,
            deleted: count || 0,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Failed to clear' },
            { status: 500 }
        );
    }
}