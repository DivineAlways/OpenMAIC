"use client"

import { useEffect, useCallback, useState } from "react"
import DailyIframe from "@daily-co/daily-js"
import { Mic, MicOff, Video, VideoOff, MonitorUp, Phone, MessageSquare, Users } from "lucide-react"

interface LiveRoomProps {
  roomUrl: string
  token: string
  sessionId: string
  userId: string
  isHost: boolean
  onLeave: () => void
}

export function LiveRoom({ roomUrl, token, sessionId, userId, isHost, onLeave }: LiveRoomProps) {
  const [callFrame, setCallFrame] = useState<any>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [participantCount, setParticipantCount] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<{ user: string; text: string; ts: number }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    const frame = DailyIframe.createFrame(document.getElementById("daily-container")!, {
      iframeStyle: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "12px",
      },
      showLeaveButton: false,
      showFullscreenButton: true,
    })

    frame.join({ url: roomUrl, token })

    frame.on("participant-updated", () => {
      setParticipantCount(Object.keys(frame.participants()).length)
    })
    frame.on("participant-joined", () => {
      setParticipantCount(Object.keys(frame.participants()).length)
    })
    frame.on("participant-left", () => {
      setParticipantCount(Object.keys(frame.participants()).length)
    })
    frame.on("app-message", ({ data }: any) => {
      if (data?.type === "chat") {
        setMessages((prev) => [...prev, { user: data.user, text: data.text, ts: Date.now() }])
      }
    })
    frame.on("left-meeting", () => {
      onLeave()
    })

    setCallFrame(frame)

    return () => {
      frame.destroy()
    }
  }, [roomUrl, token, onLeave])

  const toggleMic = useCallback(() => {
    if (!callFrame) return
    callFrame.setLocalAudio(!micOn)
    setMicOn(!micOn)
  }, [callFrame, micOn])

  const toggleCam = useCallback(() => {
    if (!callFrame) return
    callFrame.setLocalVideo(!camOn)
    setCamOn(!camOn)
  }, [callFrame, camOn])

  const startScreenShare = useCallback(() => {
    callFrame?.startScreenShare()
  }, [callFrame])

  const handleLeave = useCallback(async () => {
    callFrame?.leave()
  }, [callFrame])

  const handleEndSession = useCallback(async () => {
    if (!confirm("End the session for everyone?")) return
    setEnding(true)
    await fetch("/api/live/end-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, user_id: userId }),
    })
    callFrame?.leave()
  }, [callFrame, sessionId, userId])

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !callFrame) return
    callFrame.sendAppMessage({ type: "chat", user: "You", text: chatInput }, "*")
    setMessages((prev) => [...prev, { user: "You", text: chatInput, ts: Date.now() }])
    setChatInput("")
  }, [callFrame, chatInput])

  return (
    <div className="flex h-full min-h-[600px] bg-zinc-950 rounded-xl overflow-hidden border border-white/10">
      {/* Video area */}
      <div className="relative flex-1">
        <div id="daily-container" className="absolute inset-0" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
              Live
            </span>
            <span className="text-white/70 text-xs flex items-center gap-1">
              <Users size={12} /> {participantCount}
            </span>
          </div>
          {isHost && (
            <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-400/40 px-2 py-0.5 rounded">
              Host
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-t from-black/70 to-transparent">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full border transition-colors ${micOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500/20 border-red-500/40 text-red-400"}`}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button
            onClick={toggleCam}
            className={`p-3 rounded-full border transition-colors ${camOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500/20 border-red-500/40 text-red-400"}`}
          >
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {isHost && (
            <button
              onClick={startScreenShare}
              className="p-3 rounded-full border bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <MonitorUp size={18} />
            </button>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-3 rounded-full border transition-colors ${chatOpen ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
          >
            <MessageSquare size={18} />
          </button>

          {isHost ? (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <Phone size={14} className="rotate-[135deg]" />
              End Session
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Phone size={14} className="rotate-[135deg]" />
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="w-72 flex flex-col border-l border-white/10 bg-zinc-900/80">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-white">Chat</span>
            <button onClick={() => setChatOpen(false)} className="text-zinc-500 hover:text-white text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 && (
              <p className="text-zinc-600 text-xs text-center mt-4">No messages yet</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-primary font-bold text-xs">{m.user}: </span>
                <span className="text-zinc-300">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Message..."
              className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={sendChat}
              className="px-3 py-2 rounded-lg bg-primary text-black text-xs font-black"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
