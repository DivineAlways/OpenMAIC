import { NextRequest, NextResponse } from 'next/server';
import { supabaseGet } from '@/lib/live/daily-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('openmaic_access');
  if (!cookie?.value?.startsWith('sso.')) {
    return NextResponse.json({ user: null });
  }

  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ user: null });

  const rows = await supabaseGet('users', `id=eq.${uid}&select=id,is_paid,is_admin,can_go_live`);
  if (!rows || rows.length === 0) return NextResponse.json({ user: null });

  const u = rows[0];
  return NextResponse.json({
    user: {
      id: u.id,
      is_paid: u.is_paid,
      is_admin: u.is_admin === true,
      can_go_live: u.is_admin === true || u.can_go_live === true,
    },
  });
}
