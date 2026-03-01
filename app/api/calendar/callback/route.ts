import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getTokensFromCode } from '@/lib/calendar-service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/calendar/callback
 * OAuth callback from Google Calendar
 * Expects: code, state
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from Google
    if (error) {
      const errorMessage = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=${encodeURIComponent(errorMessage)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=No authorization code received`
      );
    }

    // Verify authentication via cookie/token
    // Since we're in a callback, we'll need to pass userId via state or get from session
    // For now, we'll use the auth token from the request if available
    const user = await verifyAuth(request);
    
    if (!user) {
      // If no auth token, try to get from state parameter
      // State should contain userId (encode it when generating auth URL)
      if (!state) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=Authentication required`
        );
      }
    }

    const userId = user?.id;
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=Could not determine user`
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Save or update calendar account
    const { data: existingAccount } = await supabase
      .from('calendar_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    let calendarAccount;

    if (existingAccount) {
      // Update existing account
      const { data, error } = await supabase
        .from('calendar_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existingAccount.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select()
        .single();

      if (error) throw error;
      calendarAccount = data;
    } else {
      // Create new account
      const { data, error } = await supabase
        .from('calendar_accounts')
        .insert({
          user_id: userId,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      calendarAccount = data;
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?success=Connected to Google Calendar`
    );
  } catch (error) {
    console.error('Calendar callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=${encodeURIComponent((error as Error).message)}`
    );
  }
}
