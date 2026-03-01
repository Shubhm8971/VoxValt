// app/api/memories/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('memories')
            .update({
                status: 'archived',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Archive error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to archive' },
            { status: 500 }
        );
    }
}