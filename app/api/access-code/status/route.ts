import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/server/api-response';
import { verifyAccessToken } from '@/app/api/access-code/verify/route';

export async function GET() {
  const accessCode = process.env.ACCESS_CODE;
  const ssoSecret = process.env.ACADEMY_SSO_SECRET;
  const enabled = !!(accessCode || ssoSecret);

  let authenticated = false;
  if (enabled) {
    const cookieStore = await cookies();
    const token = cookieStore.get('openmaic_access')?.value;
    if (token) {
      if (token.startsWith('sso.') && ssoSecret) {
        authenticated = true;
      } else if (accessCode) {
        authenticated = verifyAccessToken(token, accessCode);
      }
    }
  }

  return apiSuccess({ enabled, authenticated });
}
