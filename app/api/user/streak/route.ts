import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Return default streak for now
        return NextResponse.json({ streak: 0, history: [] });
    } catch (error: any) {
        return NextResponse.json({ streak: 0, history: [] });
    }
}