import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    console.log('[Auth API] Received OTP request');
    try {
        const { email, origin } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log('[Auth API] Sending OTP to:', email);
        const supabase = createServerClient();

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('[Auth API] Supabase error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Auth API] Unexpected server error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
