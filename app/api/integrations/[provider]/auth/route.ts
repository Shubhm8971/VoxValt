import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getAuthUrl as getGoogleAuthUrl } from '@/lib/calendar-service';
import { getNotionAuthUrl } from '@/lib/notion-service';
import { getTodoistAuthUrl } from '@/lib/todoist-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    // We optionally verify auth here, but since it's a browser redirect, 
    // it's easier to verify via a session cookie if we are not passing Bearer token.
    // However, the OAuth redirect is mostly public; the protection happens on the callback 
    // when we save the token to the database tied to a specific user.
    // For now, we will just redirect. Best practice would be to generate a state token
    // containing the user ID and verify it on callback.

    const providerLower = provider.toLowerCase();
    const url = new URL(req.url);
    const returnUrl = url.searchParams.get('returnUrl') || '/settings';
    
    // We attach the returnUrl and optionally a userId to a cookie so we know where to go back
    const responseCookies = new NextResponse('Redirecting...').cookies;
    
    // For a real prod app, store a cryptographically signed state token in a secure HttpOnly cookie.
    const stateToken = btoa(JSON.stringify({
       returnUrl,
       timestamp: Date.now()
    }));

    let authUrl = '';

    switch (providerLower) {
      case 'google':
        authUrl = getGoogleAuthUrl(); // You might need to update this function to accept state
        break;
      case 'notion':
        // Notion allows state too, but let's just use the URL
        authUrl = getNotionAuthUrl();
        break;
      case 'todoist':
        authUrl = getTodoistAuthUrl();
        break;
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const response = NextResponse.redirect(authUrl);
    // Remember state for the callback
    response.cookies.set('voxvalt_oauth_state', stateToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 mins
    });

    return response;

  } catch (error: any) {
    console.error(`[OAuth Initiator] Error for ${params.provider}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
