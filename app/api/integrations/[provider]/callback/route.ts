import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getTokensFromCode as getGoogleTokens } from '@/lib/calendar-service';
import { getNotionTokensFromCode } from '@/lib/notion-service';
import { getTodoistTokensFromCode } from '@/lib/todoist-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider.toLowerCase();
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const errorParam = url.searchParams.get('error');
    
    // Attempt to recover the state and return URL
    const stateCookie = req.cookies.get('voxvalt_oauth_state')?.value;
    let returnUrl = '/settings'; // Default
    
    if (stateCookie) {
        try {
            const stateData = JSON.parse(atob(stateCookie));
            if (stateData.returnUrl) returnUrl = stateData.returnUrl;
        } catch(e) {}
    }

    // Handled user denying consent
    if (errorParam) {
      return NextResponse.redirect(new URL(`${returnUrl}?error=${errorParam}`, req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL(`${returnUrl}?error=missing_code`, req.url));
    }

    // Require the user to be logged in to save the token!
    // Since this is a browser redirect back from Google/Notion, the standard Supabase Auth cookie is available.
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        console.error(`[OAuth Callback] No active session found for provider ${provider}`);
        return NextResponse.redirect(new URL(`/auth?returnUrl=${encodeURIComponent(req.url)}`, req.url));
    }
    
    const userId = session.user.id;

    // Exchange the code for tokens
    let accessToken = '';
    let refreshToken = null;
    let providerUserId = null;
    let tokenExpiry = null;

    switch (provider) {
      case 'google':
        const googleTokens = await getGoogleTokens(code);
        accessToken = googleTokens.access_token!;
        refreshToken = googleTokens.refresh_token || null;
        if (googleTokens.expiry_date) {
            tokenExpiry = new Date(googleTokens.expiry_date).toISOString();
        }
        break;

      case 'notion':
        const notionTokens = await getNotionTokensFromCode(code);
        accessToken = notionTokens.access_token;
        providerUserId = notionTokens.owner?.user?.id || notionTokens.bot_id;
        // Notion tokens don't currently expire, so no refresh token needed
        break;

      case 'todoist':
        const todoistTokens = await getTodoistTokensFromCode(code);
        accessToken = todoistTokens.access_token;
        // Todoist tokens default to non-expiring currently
        break;

      default:
        return NextResponse.redirect(new URL(`${returnUrl}?error=unsupported_provider`, req.url));
    }

    // Save tokens securely to the database
    // We use an upsert to gracefully handle reconnections
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
         user_id: userId,
         provider,
         access_token: accessToken,
         refresh_token: refreshToken,
         token_expiry: tokenExpiry,
         provider_user_id: providerUserId,
         updated_at: new Date().toISOString()
      }, {
         onConflict: 'user_id, provider'
      });

    if (dbError) {
      console.error('[OAuth Callback] DB Error:', dbError);
      return NextResponse.redirect(new URL(`${returnUrl}?error=db_save_failed`, req.url));
    }

    // Success! Redirect back to settings with a success flag
    const response = NextResponse.redirect(new URL(`${returnUrl}?integration_success=${provider}`, req.url));
    response.cookies.delete('voxvalt_oauth_state'); // Cleanup
    return response;

  } catch (error: any) {
    console.error(`[OAuth Callback] Error for ${params.provider}:`, error);
    const returnUrl = '/settings';
    return NextResponse.redirect(new URL(`${returnUrl}?error=auth_failed`, req.url));
  }
}
