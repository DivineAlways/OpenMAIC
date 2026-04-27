import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken } from '@/app/api/access-code/verify/route';

const TOKEN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function verifySSOToken(token: string, secret: string): boolean {
  // token format: userId.timestamp.signature
  const parts = token.split('.');
  if (parts.length < 3) return false;
  const signature = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join('.');

  // Check age
  const timestamp = parseInt(parts[parts.length - 2], 10);
  if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_MAX_AGE_MS) return false;

  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

// GET — exchange a main-site SSO token for an access cookie, then redirect
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect') ?? '/';

  const secret = process.env.ACADEMY_SSO_SECRET;
  const accessCode = process.env.ACCESS_CODE;

  if (!secret || !token || !verifySSOToken(token, secret)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Issue the standard openmaic_access cookie
  const accessToken = accessCode ? `sso.${createAccessToken(accessCode)}` : `sso.${Date.now()}.valid`;
  const cookieStore = await cookies();
  cookieStore.set('openmaic_access', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });

  const safeRedirect = redirect.startsWith('/') ? redirect : '/';
  return NextResponse.redirect(new URL(safeRedirect, request.url));
}
