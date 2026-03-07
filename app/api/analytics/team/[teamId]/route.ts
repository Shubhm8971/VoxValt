// app/api/analytics/team/[teamId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTeamAnalytics } from '@/lib/db';
import { createClient } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { teamId } = await params;
        const analytics = await getTeamAnalytics(teamId, session.user.id);

        // Resolve top contributor name
        if (analytics.topContributorId) {
            const { data: userData } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', analytics.topContributorId)
                .single();

            analytics.topContributorName = userData?.full_name || userData?.email || 'Unknown';
        }

        return NextResponse.json({ success: true, analytics });
    } catch (error: any) {
        console.error('Analytics Fetch Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team analytics' },
            { status: 500 }
        );
    }
}
