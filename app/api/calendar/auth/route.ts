import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getAuthUrl } from '@/lib/calendar-service';

/**
 * GET /api/calendar/auth
 * Get the Google OAuth consent URL
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate auth URL
    const authUrl = getAuthUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Redirect to this URL to authorize VoxValt to access your Google Calendar',
    });
  } catch (error) {
    console.error('Calendar auth error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
