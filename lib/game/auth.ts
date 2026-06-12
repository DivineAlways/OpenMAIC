import { createHmac, timingSafeEqual } from 'crypto'
import { type NextRequest } from 'next/server'

// Signed game identity token, carried in the `openmaic_access` cookie.
// Format: sso.v2.<userId>.<expiresMs>.<hmacHex>
// - Keeps the `sso.` prefix so middleware's SSO-mode prefix check still passes.
// - HMAC is over `${userId}.${expiresMs}` keyed with ACADEMY_SSO_SECRET, so the
//   user id cannot be swapped client-side (the legacy `sso.<userId>.<token>`
//   format embedded the id unsigned).
// OCC-mutating routes (buy, turn, session PATCH for new flows) must use
// getVerifiedUserId; legacy cookies fail verification and force a re-SSO
// round-trip through onlycrypto.io/api/academy/game-link.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // matches cookie maxAge

export function createGameToken(userId: string, secret: string, ttlMs = DEFAULT_TTL_MS): string {
  const expires = Date.now() + ttlMs
  const sig = createHmac('sha256', secret).update(`${userId}.${expires}`).digest('hex')
  return `sso.v2.${userId}.${expires}.${sig}`
}

export function verifyGameToken(value: string, secret: string, now = Date.now()): string | null {
  const parts = value.split('.')
  if (parts.length !== 5 || parts[0] !== 'sso' || parts[1] !== 'v2') return null
  const [, , userId, expiresStr, sig] = parts
  if (!UUID_REGEX.test(userId)) return null
  const expires = parseInt(expiresStr, 10)
  if (isNaN(expires) || now > expires) return null

  const expected = createHmac('sha256', secret).update(`${userId}.${expires}`).digest('hex')
  const sigBuf = Buffer.from(sig, 'hex')
  const expBuf = Buffer.from(expected, 'hex')
  if (sigBuf.length === 0 || sigBuf.length !== expBuf.length) return null
  return timingSafeEqual(sigBuf, expBuf) ? userId : null
}

export function getVerifiedUserId(req: NextRequest): string | null {
  const secret = process.env.ACADEMY_SSO_SECRET
  if (!secret) return null
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value) return null
  return verifyGameToken(cookie.value, secret)
}
