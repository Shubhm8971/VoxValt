import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the last 7 days of logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error } = await supabase
        .from('briefing_logs')
        .select('date_ref, was_read, was_listened')
        .eq('user_id', user.id)
        .gte('date_ref', sevenDaysAgo.toISOString().split('T')[0])
        .order('date_ref', { ascending: true });

    if (error) {
        console.error('Error fetching briefing logs:', error);
        return NextResponse.json({ streak: 0, history: [] });
    }

    const safeLogs = logs || [];

    // Calculate current streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Logic: Check logs starting from today/yesterday backwards
    const logDates = new Set(safeLogs.map(l => l.date_ref));

    // Simple check: if they did today or yesterday, start counting
    let checkDate = logDates.has(today) ? new Date() : yesterday;

    while (logDates.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return NextResponse.json({
        streak,
        history: safeLogs
    });
}