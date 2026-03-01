import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/calendar/status
 * Get current calendar connection status
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

    // Check if user has a connected calendar
    const { data, error } = await supabase
      .from('calendar_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected if not connected
      throw error;
    }

    return NextResponse.json({
      success: true,
      connected: !!data,
      data: data || null,
    });
  } catch (error) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
