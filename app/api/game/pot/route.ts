import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbInsert, dbPatch, dbUpsert } from '@/lib/game/supabase'
import { getLevel } from '@/lib/game/types'

const PLATFORM_CUT_PCT = 0.1
const ROOM_CONFIG = {
  rookie: { entry_fee_oc: 2,  max_players: 20, min_players: 3, min_level: 1 },
  pro:    { entry_fee_oc: 10, max_players: 20, min_players: 3, min_level: 3 },
  whale:  { entry_fee_oc: 50, max_players: 20, min_players: 3, min_level: 6 },
}

function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  return cookie.value.split('.')[1] ?? null
}

// GET — list open pot rooms + player entries
export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [rooms, entries] = await Promise.all([
    dbGet('game_pot_rooms', { 'status': 'in.(open,active)', 'order': 'created_at.desc' }),
    dbGet('game_pot_entries', { 'user_id': `eq.${userId}`, 'select': 'room_id,score,rank,paid_out' }),
  ])

  // Get player counts per room
  const enteredRoomIds = new Set(entries.map((e: any) => e.room_id))

  const roomsWithCount = await Promise.all(rooms.map(async (room: any) => {
    const playerRows = await dbGet('game_pot_entries', { 'room_id': `eq.${room.room_id}`, 'select': 'entry_id' })
    return {
      ...room,
      player_count: playerRows.length,
      entered: enteredRoomIds.has(room.room_id),
    }
  }))

  return NextResponse.json({ rooms: roomsWithCount, my_entries: entries })
}

// POST — enter a pot room (or create one if none open for that level)
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { room_level } = await req.json()
  const config = ROOM_CONFIG[room_level as keyof typeof ROOM_CONFIG]
  if (!config) return NextResponse.json({ error: 'Invalid room level' }, { status: 400 })

  // Check player level gate
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0]
  const level = stats ? getLevel(stats.total_xp) : 1
  if (level < config.min_level) {
    return NextResponse.json({ error: `Level ${config.min_level}+ required for ${room_level} room`, code: 'level_gate' }, { status: 403 })
  }

  // Check OC balance
  if ((stats?.oc_balance ?? 0) < config.entry_fee_oc) {
    return NextResponse.json({ error: 'Insufficient OC balance' }, { status: 400 })
  }

  // Find an open room with space
  const openRooms = await dbGet('game_pot_rooms', {
    'room_level': `eq.${room_level}`,
    'status': 'eq.open',
    'order': 'created_at.asc',
    'limit': '1',
  })

  let room = openRooms[0]

  if (!room) {
    // Create a new room
    room = await dbInsert('game_pot_rooms', {
      room_level,
      entry_fee_oc: config.entry_fee_oc,
      max_players: config.max_players,
      min_players: config.min_players,
      status: 'open',
    })
  }

  // Check not already entered
  const existing = await dbGet('game_pot_entries', { 'room_id': `eq.${room.room_id}`, 'user_id': `eq.${userId}` })
  if (existing.length > 0) return NextResponse.json({ error: 'Already in this room', room }, { status: 400 })

  // Deduct entry fee, add to pot, create entry
  const currentPlayerCount = (await dbGet('game_pot_entries', { 'room_id': `eq.${room.room_id}`, 'select': 'entry_id' })).length

  await Promise.all([
    dbUpsert('game_player_stats', {
      user_id: userId,
      oc_balance: (stats?.oc_balance ?? 0) - config.entry_fee_oc,
      updated_at: new Date().toISOString(),
    }, 'user_id'),
    dbPatch('game_pot_rooms', { room_id: `eq.${room.room_id}` }, {
      pot_total: parseFloat(room.pot_total ?? 0) + config.entry_fee_oc,
    }),
    dbInsert('game_pot_entries', { room_id: room.room_id, user_id: userId }),
  ])

  // Auto-start if room is full
  const newCount = currentPlayerCount + 1
  if (newCount >= config.max_players) {
    await startRoom(room.room_id)
  }

  return NextResponse.json({ ok: true, room, entry_fee_paid: config.entry_fee_oc })
}

// PATCH — submit score for pot room
export async function PATCH(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { room_id, score, answer_time_ms } = await req.json()

  await dbPatch('game_pot_entries', {
    'room_id': `eq.${room_id}`,
    'user_id': `eq.${userId}`,
  }, { score: score ?? 0, answer_time_ms: answer_time_ms ?? 0 })

  // Check if all entries have scores
  const entries = await dbGet('game_pot_entries', { 'room_id': `eq.${room_id}` })
  const room = (await dbGet('game_pot_rooms', { 'room_id': `eq.${room_id}` }))[0]

  const allScored = entries.every((e: any) => e.score > 0 || e.answer_time_ms > 0)
  if (allScored && room?.status === 'active') {
    await finalizeRoom(room_id, entries, room)
  }

  return NextResponse.json({ ok: true })
}

async function startRoom(roomId: string) {
  const questions = await dbGet('game_quiz_questions', { 'active': 'eq.true', 'limit': '100' })
  const drawn = questions.sort(() => Math.random() - 0.5).slice(0, 10)
  await dbPatch('game_pot_rooms', { room_id: `eq.${roomId}` }, {
    status: 'active',
    starts_at: new Date().toISOString(),
    questions: drawn,
  })
}

async function finalizeRoom(roomId: string, entries: any[], room: any) {
  // Sort by score desc, then time asc
  const ranked = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.answer_time_ms - b.answer_time_ms
  })

  const winnerId = ranked[0].user_id
  const pot = parseFloat(room.pot_total ?? 0)
  const platformCut = Math.round(pot * PLATFORM_CUT_PCT * 100) / 100
  const winnerPayout = pot - platformCut

  // Update ranks
  await Promise.all(ranked.map((e: any, i: number) =>
    dbPatch('game_pot_entries', { 'room_id': `eq.${roomId}`, 'user_id': `eq.${e.user_id}` }, { rank: i + 1 })
  ))

  // Award winner
  await dbPatch('game_pot_rooms', { room_id: `eq.${roomId}` }, {
    status: 'finished',
    winner_id: winnerId,
    winner_payout: winnerPayout,
    platform_cut: platformCut,
    finished_at: new Date().toISOString(),
  })

  const winnerStats = (await dbGet('game_player_stats', { 'user_id': `eq.${winnerId}` }))[0]
  await dbUpsert('game_player_stats', {
    user_id: winnerId,
    oc_balance: (winnerStats?.oc_balance ?? 0) + winnerPayout,
    pot_wins: (winnerStats?.pot_wins ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }, 'user_id')
}
