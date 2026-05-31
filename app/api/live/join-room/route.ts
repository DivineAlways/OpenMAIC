import { NextRequest, NextResponse } from 'next/server';
import {
  createMeetingToken,
  supabaseGet,
  supabaseInsert,
  supabasePatch,
} from '@/lib/live/daily-config';

export const dynamic = 'force-dynamic';

function isAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get('openmaic_access');
  return !!cookie?.value?.startsWith('sso.');
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { session_id, user_id } = body as { session_id?: string; user_id?: string };

  if (!session_id || !user_id) {
    return NextResponse.json({ error: 'session_id and user_id are required' }, { status: 400 });
  }

  // Verify user is paid member
  const userRows = await supabaseGet('users', `id=eq.${user_id}&select=id,is_paid,username`);
  if (!userRows?.length || !userRows[0].is_paid) {
    return NextResponse.json(
      { error: 'Active membership required to join live sessions' },
      { status: 403 },
    );
  }

  // Get session
  const sessions = await supabaseGet('live_sessions', `id=eq.${session_id}&select=*`);
  if (!sessions?.length) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  const session = sessions[0];

  if (!session.daily_room_name || !session.daily_room_url) {
    return NextResponse.json({ error: 'Session is not live yet' }, { status: 409 });
  }
  if (session.status === 'ended' || session.status === 'cancelled' || session.is_cancelled) {
    return NextResponse.json({ error: 'Session has ended' }, { status: 410 });
  }

  const isHost = session.created_by === user_id;

  try {
    const token = await createMeetingToken(session.daily_room_name, isHost);

    // Upsert participant record
    const existingParticipant = await supabaseGet(
      'live_participants',
      `session_id=eq.${session_id}&user_id=eq.${user_id}&select=id`,
    );

    if (existingParticipant?.length) {
      await supabasePatch(
        'live_participants',
        `session_id=eq.${session_id}&user_id=eq.${user_id}`,
        { joined_at: new Date().toISOString(), left_at: null },
      );
    } else {
      await supabaseInsert('live_participants', {
        session_id,
        user_id,
        role: isHost ? 'host' : 'viewer',
        joined_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      token,
      room_url: session.daily_room_url,
      room_name: session.daily_room_name,
      is_host: isHost,
    });
  } catch (err: any) {
    console.error('join-room error:', err);
    return NextResponse.json({ error: err.message || 'Failed to join room' }, { status: 500 });
  }
}

// GET — fetch active sessions list
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const sessions = await supabaseGet(
    'live_sessions',
    'status=eq.active&is_cancelled=eq.false&select=id,title,description,stream_type,started_at,daily_room_url,created_by&order=started_at.desc',
  );

  return NextResponse.json({ sessions: sessions || [] });
}
