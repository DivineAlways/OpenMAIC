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

  // Pre-load the certificate background as a data URL so Canvas can draw it
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
      // Load background image
      const bg = new Image();
      bg.src = bgDataUrl;
      await new Promise<void>((res) => { bg.onload = () => res(); bg.onerror = () => res(); });

      const W = bg.naturalWidth || 1006;
      const H = bg.naturalHeight || 712;
      const S = 2; // 2× for sharp download
      const canvas = document.createElement('canvas');
      canvas.width = W * S;
      canvas.height = H * S;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(S, S);

      // Draw the exact certificate background image
      ctx.drawImage(bg, 0, 0, W, H);

      // ── Overlay: member name (italic script, centered ~56% from top) ──
      ctx.textAlign = 'center';
      ctx.fillStyle = '#dce8f8';
      ctx.font = `italic ${Math.round(H * 0.072)}px Georgia, serif`;
      ctx.fillText(displayName || 'OnlyCrypto Member', W / 2, H * 0.535);

      // ── Overlay: course completion sentence (two lines, ~63–68% from top) ──
      ctx.fillStyle = '#c8d8ee';
      ctx.font = `${Math.round(H * 0.024)}px Arial, sans-serif`;
      const line1 = `has successfully completed the course "${courseName}"`;
      const line2 = 'demonstrating proficiency in fundamental blockchain technology concepts.';
      ctx.fillText(line1, W / 2, H * 0.635);
      ctx.fillText(line2, W / 2, H * 0.665);

      // ── Overlay: DATE ISSUED value (bottom-left, ~85% from top) ──
      ctx.textAlign = 'left';
      ctx.fillStyle = '#5b9bd5';
      ctx.font = `italic ${Math.round(H * 0.022)}px Georgia, serif`;
      ctx.fillText(completedDate, W * 0.195, H * 0.862);

      // ── Overlay: PASS badge percentage (center badge, ~82% from top) ──
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(H * 0.028)}px Arial, sans-serif`;
      ctx.fillText(`${pct}%`, W / 2, H * 0.82);

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
  }, [courseName, downloading, displayName, pct, completedDate, bgDataUrl]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-12 pb-16 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-3xl my-auto"
        >
          {/* Controls above certificate */}
          <div className="flex items-center justify-between mb-3 px-1">
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

          {/* Certificate preview — bg image + text overlaid */}
          <div className="relative w-full" style={{ aspectRatio: '1006 / 712' }}>
            {/* The exact certificate image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/certificate-bg.png"
              alt="Certificate"
              className="w-full h-full object-cover rounded-sm"
            />

            {/* Dynamic text overlaid on top */}
            <div className="absolute inset-0 flex flex-col items-center" style={{ fontFamily: 'Georgia, serif' }}>

              {/* Member name — sits at ~53.5% from top */}
              <div
                style={{
                  position: 'absolute',
                  top: '51%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#dce8f8',
                  fontSize: 'clamp(18px, 4.2vw, 38px)',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >
                {displayName || 'OnlyCrypto Member'}
              </div>

              {/* Course completion lines — ~63–68% from top */}
              <div
                style={{
                  position: 'absolute',
                  top: '62%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#c8d8ee',
                  fontSize: 'clamp(8px, 1.4vw, 13px)',
                  fontFamily: 'Arial, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.7,
                }}
              >
                has successfully completed the course &ldquo;{courseName}&rdquo;<br />
                demonstrating proficiency in fundamental blockchain technology concepts.
              </div>

              {/* DATE ISSUED value — bottom-left ~86% from top */}
              <div
                style={{
                  position: 'absolute',
                  top: '84%',
                  left: '19.5%',
                  color: '#5b9bd5',
                  fontSize: 'clamp(7px, 1.2vw, 12px)',
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {completedDate}
              </div>

              {/* PASS badge % override — center ~82% from top */}
              <div
                style={{
                  position: 'absolute',
                  top: '79%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#ffffff',
                  fontSize: 'clamp(7px, 1.1vw, 11px)',
                  fontWeight: 700,
                  fontFamily: 'Arial, sans-serif',
                  textAlign: 'center',
                }}
              >
                {pct}%
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
