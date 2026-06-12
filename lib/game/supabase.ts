import { type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://krgeexpexiodxkxightz.supabase.co'

// Cookie formats:
//   sso.v2.<userId>.<expiry>.<sig> — current, HMAC-signed (see lib/game/auth.ts)
//   sso.<userId>.<token>           — legacy, unsigned (phased out as cookies expire)
// This parser is lenient (no signature check) — use it for read/display routes only.
// OCC-mutating routes must use getVerifiedUserId from lib/game/auth.ts.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  const parts = cookie.value.split('.')
  if (parts[1] === 'v2' && parts[2] && UUID_REGEX.test(parts[2])) return parts[2]
  if (parts[1] && UUID_REGEX.test(parts[1])) return parts[1]
  return null
}
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

export async function dbGet<T = any>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function dbInsert<T = any>(table: string, body: object): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) ? rows[0] : rows
}

export async function dbUpsert<T = any>(table: string, body: object, onConflict: string): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) ? rows[0] : rows
}

export async function dbPatch<T = any>(table: string, filter: Record<string, string>, body: object): Promise<T | null> {
  const qs = new URLSearchParams(filter).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) ? rows[0] ?? null : rows
}

// Call a Postgres function (RPC). Game money-movement goes through SECURITY DEFINER
// functions (game_buy_district, game_pay_rent, game_adjust_oc) — service_role-only.
export async function dbRpc<T = any>(fn: string, args: object): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(args),
  })
  if (!res.ok) return null
  return res.json()
}

export async function dbDelete(table: string, filter: Record<string, string>): Promise<boolean> {
  const qs = new URLSearchParams(filter).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.ok
}
