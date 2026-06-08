const SUPABASE_URL = 'https://krgeexpexiodxkxightz.supabase.co'
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
