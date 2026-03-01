import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Handles user interactions with the Morning Briefing banner.
 * Action "read": User dismissed the banner or viewed it.
 * Action "listen": User clicked the Play button (includes "read" implicitly).
 */
export async function POST(req: Request) {
    const supabase = createServerClient();

    try {
        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Request
        const { logId, action } = await req.json();

        if (!logId) {
            return NextResponse.json({ error: 'logId is required' }, { status: 400 });
        }

        // 3. Determine Update Payload
        const updateData: any = {};

        if (action === 'listen') {
            updateData.was_listened = true;
            updateData.listened_at = new Date().toISOString();
            updateData.was_read = true; // Listening implies they read it
        } else if (action === 'read') {
            updateData.was_read = true;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 4. Update the Log Entry
        const { error: updateError } = await supabase
            .from('briefing_logs')
            .update(updateData)
            .eq('id', logId)
            .eq('user_id', user.id); // Security: ensure user owns this log

        if (updateError) {
            console.error('Database Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Interaction API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}