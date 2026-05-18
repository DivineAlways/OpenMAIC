"use client"

import { useEffect, useState } from "react"

interface LiveRoomProps {
  roomUrl: string
  token: string
  sessionId: string
  userId: string
  isHost: boolean
  onLeave: () => void
}

export function LiveRoom({ roomUrl, token, sessionId, userId, isHost, onLeave }: LiveRoomProps) {
  const [ending, setEnding] = useState(false)
  const [chatDropsAwarded, setChatDropsAwarded] = useState(false)

  useEffect(() => {
    let frame: any
    import("@daily-co/daily-js").then(({ default: DailyIframe }) => {
      frame = DailyIframe.createFrame(document.getElementById("daily-container")!, {
        iframeStyle: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          border: "none",
        },
        // Let Daily's native UI handle all controls
        showLeaveButton: true,
        showFullscreenButton: true,
      })

      frame.join({ url: roomUrl, token })

      // When user leaves via Daily's own Leave button
      frame.on("left-meeting", () => onLeave())

      // Award chat drops on first message sent (Daily native chat event)
      frame.on("app-message", ({ data }: any) => {
        if (data?.fromId && !chatDropsAwarded && userId) {
          // Check if this is from the local participant
        }
      })

      // Track when local participant sends a message — hook into Daily's sendAppMessage
      const origSend = frame.sendAppMessage?.bind(frame)
      if (origSend) {
        frame.sendAppMessage = (msg: any, recipient: any) => {
          if (!chatDropsAwarded && userId) {
            setChatDropsAwarded(true)
            fetch("/api/live/chat-drops", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, session_id: sessionId }),
            }).catch(() => {})
          }
          return origSend(msg, recipient)
        }
      }
    })

    return () => { frame?.destroy() }
  }, [roomUrl, token, onLeave, userId, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndSession = async () => {
    if (!confirm("End the session for everyone?")) return
    setEnding(true)
    await fetch("/api/live/end-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, user_id: userId }),
    })
    // Daily's own leave button will trigger onLeave via left-meeting event
    // Force it in case the iframe already left
    onLeave()
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Thin top bar — only End Session for host, nothing for viewers (Daily handles Leave) */}
      {isHost && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-white/10 shrink-0">
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
          >
            {ending ? "Ending…" : "End Session for Everyone"}
          </button>
        </div>
      )}

      {/* Daily iframe fills the rest */}
      <div className="relative flex-1">
        <div id="daily-container" className="absolute inset-0" />
      </div>
    </div>
  )
}
