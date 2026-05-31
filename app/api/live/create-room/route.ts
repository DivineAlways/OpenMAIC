import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  createDailyRoom,
  supabaseGet,
  supabasePatch,
  type StreamType,
} from '@/lib/live/daily-config';

export const dynamic = 'force-dynamic';

// Verify the SSO cookie is present — same gate as middleware
function isAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get('openmaic_access');
  return !!cookie?.value?.startsWith('sso.');
}

async function getUserIdFromCookie(req: NextRequest): Promise<string | null> {
  // The SSO token is userId.timestamp.signature — extract userId
  const cookie = req.cookies.get('openmaic_access');
  if (!cookie?.value?.startsWith('sso.')) return null;
  // Format: sso.userId.timestamp.valid OR sso.timestamp.valid (no userId in simple mode)
  // We'll read user_id from the request body instead
  return null;
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    session_id,
    stream_type = 'broadcast',
    user_id,
  } = body as {
    session_id?: string;
    stream_type?: StreamType;
    user_id?: string;
  };

  if (!session_id) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
  }
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  if (!['1on1', 'group', 'broadcast'].includes(stream_type)) {
    return NextResponse.json(
      { error: 'stream_type must be 1on1, group, or broadcast' },
      { status: 400 },
    );
  }

  // Verify user is active paid member in main platform
  const userRows = await supabaseGet('users', `id=eq.${user_id}&select=id,is_paid,membership_tier`);
  if (!userRows || userRows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 403 });
  }
  const user = userRows[0];
  if (!user.is_paid) {
    return NextResponse.json(
      { error: 'Active membership required to host live sessions' },
      { status: 403 },
    );
  }

  // Check session exists and isn't already live
  const sessions = await supabaseGet('live_sessions', `id=eq.${session_id}&select=*`);
  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  const session = sessions[0];
  if (session.daily_room_url && session.status === 'active') {
    return NextResponse.json({
      room_url: session.daily_room_url,
      room_name: session.daily_room_name,
      already_live: true,
    });
  }

  try {
    const roomName = `oc-${nanoid(10)}`;
    const room = await createDailyRoom(roomName, stream_type);

    // Update live_sessions with Daily room info
    await supabasePatch('live_sessions', `id=eq.${session_id}`, {
      daily_room_name: room.name,
      daily_room_url: room.url,
      stream_type,
      status: 'active',
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      room_url: room.url,
      room_name: room.name,
      session_id,
      stream_type,
    });
  } catch (err: any) {
    console.error('create-room error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create room' }, { status: 500 });
  }
}
