'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function signInWithOtpAction(email: string, origin: string) {
    console.log('[Auth Action] Sending OTP to:', email);
    console.log('[Auth Action] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
    console.log('[Auth Action] KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');

    const supabase = createServerClient();

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('[Auth Action] Sign-in error:', error.message);
            return { error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('[Auth Action] Unexpected error:', err);
        return { error: 'An unexpected connection error occurred. Please check your internet.' };
    }
}

export async function verifyOtpAction(email: string, token: string) {
    console.log('[Auth Action] Verifying OTP for:', email);
    const supabase = createServerClient();

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) {
            console.error('[Auth Action] Verification error:', error.message);
            return { error: error.message };
        }

        return { success: true, session: data.session };
    } catch (err: any) {
        console.error('[Auth Action] Unexpected error:', err);
        return { error: 'Failed to verify code. Please try again.' };
    }
}
