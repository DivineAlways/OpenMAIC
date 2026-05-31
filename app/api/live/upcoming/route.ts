import { NextRequest, NextResponse } from 'next/server';
import { supabaseGet } from '@/lib/live/daily-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('openmaic_access');
  if (!cookie?.value?.startsWith('sso.')) {
    return NextResponse.json({ sessions: [] });
  }

  const now = new Date().toISOString();
  const sessions = await supabaseGet(
    'live_sessions',
    `scheduled_at=gte.${now}&is_cancelled=eq.false&status=eq.scheduled&select=id,title,description,scheduled_at,stream_type&order=scheduled_at.asc&limit=5`,
  );

  return NextResponse.json({ sessions: sessions ?? [] });
}
