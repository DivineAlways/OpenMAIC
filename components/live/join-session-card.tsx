'use client';

import { useState } from 'react';
import { Radio, Users, Clock } from 'lucide-react';
import { STREAM_CONFIGS, type LiveSession } from '@/lib/live/daily-config';

interface JoinSessionCardProps {
  session: LiveSession;
  userId: string;
  onJoin: (roomUrl: string, token: string, sessionId: string, isHost: boolean) => void;
}

export function JoinSessionCard({ session, userId, onJoin }: JoinSessionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const streamType = session.stream_type ?? 'broadcast';
  const cfg = STREAM_CONFIGS[streamType];
  const isHost = session.created_by === userId;

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/live/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');
      onJoin(data.room_url, data.token, session.id, data.is_host);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startedAgo = session.started_at
    ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)
    : 0;

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
          <span className="text-sm">{cfg.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-white truncate">{session.title}</span>
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
              Live
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span>{cfg.label}</span>
            {startedAgo > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> Started {startedAgo}m ago
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0">
        {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {loading ? 'Joining...' : isHost ? 'Rejoin' : 'Join Live'}
        </button>
      </div>
    </div>
  );
}
