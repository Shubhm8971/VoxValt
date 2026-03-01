import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/calendar/disconnect
 * Disconnect Google Calendar account
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete calendar account
    const { error } = await supabase
      .from('calendar_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Disconnected from Google Calendar',
    });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
