export const DAILY_API_URL = "https://api.daily.co/v1"
export const DAILY_API_KEY = process.env.DAILY_API_KEY ?? ""

export const SUPABASE_URL = "https://krgeexpexiodxkxightz.supabase.co"
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

export type StreamType = "1on1" | "group" | "broadcast"
export type SessionStatus = "scheduled" | "active" | "ended" | "cancelled"

export interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: {
    max_participants?: number
    exp?: number
    enable_recording?: string
    enable_chat?: boolean
  }
}

export interface LiveSession {
  id: string
  title: string
  description?: string
  scheduled_at: string
  zoom_link?: string
  daily_room_name?: string
  daily_room_url?: string
  stream_type?: StreamType
  status?: SessionStatus
  started_at?: string
  ended_at?: string
  peak_viewers?: number
  recording_url?: string
  created_by: string
  is_cancelled: boolean
  created_at: string
}

export interface LiveParticipant {
  id: string
  session_id: string
  user_id: string
  daily_participant_id?: string
  joined_at: string
  left_at?: string
  role: "host" | "viewer"
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  message: string
  message_type: string
  created_at: string
}

// Stream type config
export const STREAM_CONFIGS = {
  "1on1":    { max_participants: 2,    label: "1-on-1 Tutoring",  icon: "👥" },
  group:     { max_participants: 50,   label: "Group Class",      icon: "🎓" },
  broadcast: { max_participants: 1000, label: "Live Broadcast",   icon: "📡" },
} as const

async function dailyRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DAILY_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Daily.co API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function createDailyRoom(name: string, streamType: StreamType): Promise<DailyRoom> {
  const config = STREAM_CONFIGS[streamType]
  return dailyRequest("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      properties: {
        max_participants: config.max_participants,
        enable_recording: "cloud",
        enable_chat: true,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // 6 hour expiry
      },
    }),
  })
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  await dailyRequest(`/rooms/${roomName}`, { method: "DELETE" })
}

export async function createMeetingToken(roomName: string, isOwner: boolean): Promise<string> {
  const data = await dailyRequest("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4 hour token
      },
    }),
  })
  return data.token
}

// Supabase helpers — service role, server-side only
export function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  }
}

export async function supabaseGet(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: supabaseHeaders(),
  })
  return res.json()
}

export async function supabasePatch(table: string, query: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function supabaseInsert(table: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(body),
  })
  return res.json()
}
