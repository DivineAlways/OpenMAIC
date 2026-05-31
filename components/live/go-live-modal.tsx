'use client';

import { useState } from 'react';
import { X, Radio, Users, MonitorUp } from 'lucide-react';
import { STREAM_CONFIGS, type StreamType } from '@/lib/live/daily-config';

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
}

interface GoLiveModalProps {
  sessions: Session[];
  userId: string;
  onLive: (roomUrl: string, token: string, sessionId: string, isHost: boolean) => void;
  onClose: () => void;
}

const STREAM_ICONS = { '1on1': Users, group: Users, broadcast: Radio };

export function GoLiveModal({ sessions, userId, onLive, onClose }: GoLiveModalProps) {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [streamType, setStreamType] = useState<StreamType>('broadcast');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoLive = async () => {
    if (!selectedSession) {
      setError('Select a session first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Create the room
      const createRes = await fetch('/api/live/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession,
          stream_type: streamType,
          user_id: userId,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create room');

      // Get host token
      const joinRes = await fetch('/api/live/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSession, user_id: userId }),
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error || 'Failed to get token');

      onLive(joinData.room_url, joinData.token, selectedSession, true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-white">Go Live</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Session picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Session
          </label>
          {sessions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No sessions scheduled. Create one from the main platform admin panel first.
            </p>
          ) : (
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-zinc-900">
                — pick a session —
              </option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900">
                  {s.title} · {new Date(s.scheduled_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stream type */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Stream Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              Object.entries(STREAM_CONFIGS) as [StreamType, (typeof STREAM_CONFIGS)[StreamType]][]
            ).map(([type, cfg]) => {
              const Icon = STREAM_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setStreamType(type)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-colors ${
                    streamType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  <span className="text-[10px] font-normal text-zinc-500">
                    max {cfg.max_participants}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

        <button
          onClick={handleGoLive}
          disabled={loading || !selectedSession}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {loading ? 'Starting...' : 'Start Broadcast'}
        </button>
      </div>
    </div>
  );
}
