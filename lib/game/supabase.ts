import { type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://krgeexpexiodxkxightz.supabase.co'

// Cookie format after SSO: sso.<userId>.<token>  (userId is a UUID)
// Older format without userId: sso.<token>
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  const parts = cookie.value.split('.')
  // Format: sso.<userId>.<rest...> — userId is always a UUID
  // Try parts[1] as UUID first
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

export async function dbDelete(table: string, filter: Record<string, string>): Promise<boolean> {
  const qs = new URLSearchParams(filter).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.ok
}
