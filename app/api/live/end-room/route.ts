import { NextRequest, NextResponse } from 'next/server';
import { deleteDailyRoom, supabaseGet, supabasePatch } from '@/lib/live/daily-config';

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

  const sessions = await supabaseGet('live_sessions', `id=eq.${session_id}&select=*`);
  if (!sessions?.length) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  const session = sessions[0];

  if (session.created_by !== user_id) {
    return NextResponse.json({ error: 'Only the host can end the session' }, { status: 403 });
  }

  if (session.status === 'ended') {
    return NextResponse.json({ success: true, already_ended: true });
  }

  try {
    if (session.daily_room_name) {
      await deleteDailyRoom(session.daily_room_name).catch((e) =>
        console.warn('Daily room delete failed (may already be gone):', e.message),
      );
    }

    await supabasePatch('live_sessions', `id=eq.${session_id}`, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    });

    // Mark all active participants as left
    await supabasePatch('live_participants', `session_id=eq.${session_id}&left_at=is.null`, {
      left_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('end-room error:', err);
    return NextResponse.json({ error: err.message || 'Failed to end room' }, { status: 500 });
  }
}
