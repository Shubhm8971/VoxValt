import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings?error=oauth_denied', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokens.error_description || 'Failed to get tokens');
        }

        // Save tokens to Supabase
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/landing', request.url));
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({
                google_calendar_token: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token, // Only returned on first consent or explicit access_type=offline
                    expiry_date: Date.now() + tokens.expires_in * 1000,
                }
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to save tokens:', updateError);
            return NextResponse.redirect(new URL('/settings?error=save_failed', request.url));
        }

        return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url));

    } catch (err) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url));
    }
}
