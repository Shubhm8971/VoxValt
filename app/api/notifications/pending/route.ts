import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check for Tasks due within next hour
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', false)
            .gte('due_date', now.toISOString())
            .lte('due_date', nextHour.toISOString());

        // Check for Promises made
        // (Assuming promises are tasks with type='promise')

        // This endpoint is polled by SW to see if it should show local notifications
        // independent of push.

        return NextResponse.json({
            hasPending: (tasks?.length || 0) > 0,
            count: tasks?.length || 0,
            tasks: tasks || []
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
