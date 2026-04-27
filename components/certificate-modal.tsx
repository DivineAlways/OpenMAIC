'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Edit2, Check } from 'lucide-react';
import { useUserProfileStore } from '@/lib/store/user-profile';

interface CertificateModalProps {
  readonly courseName: string;
  readonly score: number;
  readonly totalPoints: number;
  readonly onClose: () => void;
  readonly completedDate?: string;
}

export function CertificateModal({ courseName, score, totalPoints, onClose, completedDate: completedDateProp }: CertificateModalProps) {
  const { nickname, setNickname } = useUserProfileStore();
  const [downloading, setDownloading] = useState(false);
  const [editingName, setEditingName] = useState(!nickname);
  const [nameInput, setNameInput] = useState(nickname || '');
  const [displayName, setDisplayName] = useState(nickname || '');
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 100;
  const completedDate = completedDateProp ?? new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (!nickname) setEditingName(true);
  }, [nickname]);

  // Pre-load the clean certificate background as a data URL for Canvas download
  useEffect(() => {
    fetch('/certificate-bg.png')
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => setBgDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => setBgDataUrl(null));
  }, []);

  const confirmName = useCallback(() => {
    const trimmed = nameInput.trim() || 'OnlyCrypto Member';
    setDisplayName(trimmed);
    setNickname(trimmed);
    setEditingName(false);
  }, [nameInput, setNickname]);

  const handleDownload = useCallback(async () => {
    if (downloading || !bgDataUrl) return;
    setDownloading(true);
    try {
      const bg = new Image();
      bg.src = bgDataUrl;
      await new Promise<void>((res) => { bg.onload = () => res(); bg.onerror = () => res(); });

      const W = bg.naturalWidth;   // 1008
      const H = bg.naturalHeight;  // 734
      const S = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * S;
      canvas.height = H * S;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(S, S);

      // Draw the clean background (baked-in text already erased)
      ctx.drawImage(bg, 0, 0, W, H);

      // ── Member name — Dancing Script gold, centered at ~51% from top ──
      // Ensure the font is loaded before drawing
      await document.fonts.load(`bold ${Math.round(H * 0.068)}px "Dancing Script"`);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4a843';
      ctx.font = `bold ${Math.round(H * 0.068)}px "Dancing Script", cursive`;
      ctx.fillText(displayName || 'OnlyCrypto Member', W / 2, H * 0.515);

      // ── Course line 1 — ~62% from top ──
      ctx.fillStyle = '#b8cce0';
      ctx.font = `${Math.round(H * 0.030)}px Arial, sans-serif`;
      ctx.fillText(
        `has successfully completed the course "${courseName}"`,
        W / 2,
        H * 0.622,
      );

      // ── Course line 2 — ~66% from top ──
      ctx.fillText(
        'demonstrating proficiency in fundamental blockchain technology concepts.',
        W / 2,
        H * 0.662,
      );

      // ── Date value — centered under DATE ISSUED label (~28% from left) ──
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5b9bd5';
      ctx.font = `italic ${Math.round(H * 0.032)}px Georgia, serif`;
      ctx.fillText(completedDate, W * 0.28, H * 0.862);

      const slug = courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      canvas.toBlob((blob) => {
        if (!blob) { alert('Download failed. Please try again.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-certificate.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Certificate download failed:', err);
      alert('Download failed. Please try again or take a screenshot.');
    } finally {
      setDownloading(false);
    }
  }, [courseName, downloading, displayName, completedDate, bgDataUrl]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 gap-3"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full flex flex-col gap-3"
          style={{ maxWidth: 'min(92vw, calc((100vh - 80px) * 1008 / 734))' }}
        >
          {/* Controls */}
          <div className="flex items-center justify-between shrink-0 px-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmName()}
                    placeholder="Your name on certificate"
                    className="text-sm px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 w-56"
                  />
                  <button
                    onClick={confirmName}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(displayName); setEditingName(true); }}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit name
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading || editingName || !bgDataUrl}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? 'Saving…' : 'Download PNG'}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Certificate — bg image with text overlaid at exact positions */}
          <div className="relative w-full" style={{ aspectRatio: '1008 / 734', minHeight: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/certificate-bg.png"
              alt="Certificate"
              className="w-full h-full object-cover rounded-sm select-none"
              draggable={false}
            />

            {/* Member name — centered, ~51% from top, gold cursive */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
              style={{
                top: '49.5%',
                color: '#d4a843',
                fontSize: 'clamp(16px, 3.8vw, 36px)',
                fontFamily: 'var(--font-dancing), "Dancing Script", cursive',
                fontWeight: 700,
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}
            >
              {displayName || 'OnlyCrypto Member'}
            </div>

            {/* Course line 1 — ~62% from top */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
              style={{
                top: '61%',
                color: '#b8cce0',
                fontSize: 'clamp(9px, 1.6vw, 15px)',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              has successfully completed the course &ldquo;{courseName}&rdquo;
            </div>

            {/* Course line 2 — ~66% from top */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
              style={{
                top: '65.5%',
                color: '#b8cce0',
                fontSize: 'clamp(9px, 1.6vw, 15px)',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              demonstrating proficiency in fundamental blockchain technology concepts.
            </div>

            {/* Date value — centered under "DATE ISSUED" label, ~84% from top */}
            <div
              className="absolute pointer-events-none text-center"
              style={{
                top: '83.5%',
                left: '14%',
                width: '28%',
                color: '#5b9bd5',
                fontSize: 'clamp(10px, 1.6vw, 16px)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {completedDate}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
