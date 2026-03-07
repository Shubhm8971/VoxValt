import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getRecordings, saveRecording } from '@/lib/db';
import { verifyAuth } from '@/lib/api-auth';
import { canUserRecord } from '@/lib/subscription';

// GET /api/recordings - Fetch user's recordings
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

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const boardId = searchParams.get('boardId');

    const recordings = await getRecordings(user.id, 20, teamId || undefined, boardId || undefined);
    return NextResponse.json({
      success: true,
      data: recordings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/recordings - Save new recording
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

    // Check usage limits based on subscription
    const { canRecord, reason } = await canUserRecord(user.id);
    if (!canRecord) {
      return NextResponse.json(
        { success: false, error: reason || 'Recording limit reached based on your current plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { audioUrl, transcription, duration } = body;

    if (!audioUrl || !transcription) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recording = await saveRecording(user.id, audioUrl, transcription, duration || 0);

    return NextResponse.json(
      {
        success: true,
        data: recording,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
