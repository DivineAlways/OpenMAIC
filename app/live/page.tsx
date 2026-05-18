"use client"

import { useState, useEffect } from "react"
import { Radio, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LiveRoom } from "@/components/live/live-room"
import { GoLiveModal } from "@/components/live/go-live-modal"
import { JoinSessionCard } from "@/components/live/join-session-card"
import type { LiveSession } from "@/lib/live/daily-config"

interface UserInfo {
  id: string
  is_paid: boolean
}

// Read user ID from SSO cookie payload (set by main platform SSO)
// The cookie value is `sso.userId.timestamp.valid`
function getUserIdFromCookies(): string | null {
  if (typeof document === "undefined") return null
  // We can't read httpOnly cookies from JS — userId must come from the SSO flow
  // The main platform passes user_id as a query param on SSO redirect
  const params = new URLSearchParams(window.location.search)
  return params.get("uid") ?? sessionStorage.getItem("oc_user_id")
}

export default function LivePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoLive, setShowGoLive] = useState(false)
  const [liveState, setLiveState] = useState<{
    roomUrl: string
    token: string
    sessionId: string
    isHost: boolean
  } | null>(null)

  useEffect(() => {
    // Get userId from query param (passed by main platform SSO) or sessionStorage
    const uid = getUserIdFromCookies()
    if (uid) {
      setUserId(uid)
      sessionStorage.setItem("oc_user_id", uid)
    }
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      // Active live sessions
      const activeRes = await fetch("/api/live/join-room")
      const activeData = await activeRes.json()
      setActiveSessions(activeData.sessions ?? [])

      // Upcoming scheduled sessions (from main platform Supabase)
      const upcomingRes = await fetch("/api/live/upcoming")
      const upcomingData = await upcomingRes.json()
      setUpcomingSessions(upcomingData.sessions ?? [])
    } catch {
      // silently fail — page still usable
    } finally {
      setLoading(false)
    }
  }

  const handleJoined = (roomUrl: string, token: string, sessionId: string, isHost: boolean) => {
    setShowGoLive(false)
    setLiveState({ roomUrl, token, sessionId, isHost })
  }

  const handleLeave = () => {
    setLiveState(null)
    fetchSessions()
  }

  // ── Active call view ─────────────────────────────────────────────────────────
  if (liveState) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm"
          >
            <ArrowLeft size={14} /> Leave
          </button>
          <div className="flex-1" />
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-black uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
          </span>
        </div>
        <div className="flex-1 p-4">
          <LiveRoom
            roomUrl={liveState.roomUrl}
            token={liveState.token}
            sessionId={liveState.sessionId}
            userId={userId ?? ""}
            isHost={liveState.isHost}
            onLeave={handleLeave}
          />
        </div>
      </div>
    )
  }

  // ── Lobby view ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">
              <Radio size={18} className="text-red-500" /> Live Sessions
            </h1>
            <p className="text-xs text-zinc-500">Join or host a live session</p>
          </div>
        </div>
        {userId && (
          <button
            onClick={() => setShowGoLive(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Go Live
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Active sessions */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Live Now
          </h2>
          {loading ? (
            <div className="animate-pulse h-16 rounded-xl bg-white/5" />
          ) : activeSessions.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <Radio size={24} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No sessions live right now</p>
              <p className="text-xs text-zinc-600 mt-1">Check back for the next scheduled session</p>
            </div>
          ) : (
            activeSessions.map((s) => (
              <JoinSessionCard
                key={s.id}
                session={s}
                userId={userId ?? ""}
                onJoin={handleJoined}
              />
            ))
          )}
        </section>

        {/* Upcoming sessions */}
        {upcomingSessions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Upcoming
            </h2>
            {upcomingSessions.map((s) => {
              const dt = new Date(s.scheduled_at)
              const diffMs = dt.getTime() - Date.now()
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
              const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
              const countdown = diffDays > 0 ? `In ${diffDays}d ${diffHrs}h` : diffHrs > 0 ? `In ${diffHrs}h` : "Starting soon"

              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Calendar size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{s.title}</p>
                      <p className="text-xs text-zinc-500">
                        {dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400 font-bold">{countdown}</span>
                </div>
              )
            })}
          </section>
        )}

        {/* No userId — not logged in */}
        {!userId && !loading && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
            <p className="text-sm text-amber-300 font-bold">Members only</p>
            <p className="text-xs text-zinc-400 mt-1">
              Access live sessions from your{" "}
              <a href="https://onlycrypto.io/dashboard/learning" className="text-primary underline">
                OnlyCrypto dashboard
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Go Live modal */}
      {showGoLive && (
        <GoLiveModal
          sessions={upcomingSessions}
          userId={userId ?? ""}
          onLive={handleJoined}
          onClose={() => setShowGoLive(false)}
        />
      )}
    </div>
  )
}
