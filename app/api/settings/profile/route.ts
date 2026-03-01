// app/api/settings/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await req.json();

        // Whitelist allowed fields
        const allowed = [
            'display_name',
            'timezone',
            'language',
            'notification_enabled',
            'briefing_time',
            'onboarding_completed',
        ];

        const sanitized: Record<string, any> = {};
        for (const key of allowed) {
            if (key in updates) {
                sanitized[key] = updates[key];
            }
        }

        if (Object.keys(sanitized).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { error } = await supabase
            .from('profiles')
            .update(sanitized)
            .eq('id', session.user.id);

        if (error) throw error;

        // Also update user metadata if display_name changed
        if (sanitized.display_name) {
            await supabase.auth.updateUser({
                data: { full_name: sanitized.display_name },
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}