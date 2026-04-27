'use client';

import { useState, useCallback, useEffect } from 'react';
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
    year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => { if (!nickname) setEditingName(true); }, [nickname]);

  useEffect(() => {
    fetch('/certificate-bg.png')
      .then(r => r.blob())
      .then(blob => {
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
      await new Promise<void>(res => { bg.onload = () => res(); bg.onerror = () => res(); });
      const W = bg.naturalWidth, H = bg.naturalHeight, S = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * S; canvas.height = H * S;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(S, S);
      ctx.drawImage(bg, 0, 0, W, H);
      await document.fonts.load(`bold ${Math.round(H * 0.068)}px "Dancing Script"`);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4a843';
      ctx.font = `bold ${Math.round(H * 0.068)}px "Dancing Script", cursive`;
      ctx.fillText(displayName || 'OnlyCrypto Member', W / 2, H * 0.515);
      ctx.fillStyle = '#b8cce0';
      ctx.font = `${Math.round(H * 0.030)}px Arial, sans-serif`;
      ctx.fillText(`has successfully completed the course "${courseName}"`, W / 2, H * 0.622);
      ctx.fillText('demonstrating proficiency in fundamental blockchain technology concepts.', W / 2, H * 0.662);
      ctx.fillStyle = '#5b9bd5';
      ctx.font = `italic ${Math.round(H * 0.032)}px Georgia, serif`;
      ctx.fillText(completedDate, W * 0.28, H * 0.862);
      const slug = courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      canvas.toBlob(blob => {
        if (!blob) { alert('Download failed.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${slug}-certificate.png`; a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error(err);
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
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="flex flex-col gap-2 w-full h-full"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          {/* Controls bar */}
          <div className="flex items-center justify-between shrink-0 px-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmName()}
                    placeholder="Your name on certificate"
                    className="text-sm px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 w-56"
                  />
                  <button onClick={confirmName} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setNameInput(displayName); setEditingName(true); }} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit name
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
              <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Certificate — fills remaining space, maintains aspect ratio */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div
              className="relative"
              style={{
                /* Scale to fit: whichever dimension is the constraint */
                width: 'min(100%, calc((100vh - 80px) * 1008 / 734))',
                aspectRatio: '1008 / 734',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/certificate-bg.png"
                alt="Certificate"
                className="absolute inset-0 w-full h-full object-fill rounded-sm select-none"
                draggable={false}
              />

              {/* All overlays use % of the container so they scale perfectly */}

              {/* Member name */}
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ paddingTop: '46%' }}>
                <span style={{
                  color: '#d4a843',
                  fontSize: '4.5%',
                  fontFamily: 'var(--font-dancing), "Dancing Script", cursive',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                }}>
                  {displayName || 'OnlyCrypto Member'}
                </span>
              </div>

              {/* Course line 1 */}
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ paddingTop: '60%' }}>
                <span style={{
                  color: '#b8cce0',
                  fontSize: '1.9%',
                  fontFamily: 'Arial, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  has successfully completed the course &ldquo;{courseName}&rdquo;
                </span>
              </div>

              {/* Course line 2 */}
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ paddingTop: '66%' }}>
                <span style={{
                  color: '#b8cce0',
                  fontSize: '1.9%',
                  fontFamily: 'Arial, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  demonstrating proficiency in fundamental blockchain technology concepts.
                </span>
              </div>

              {/* Date — centered under DATE ISSUED */}
              <div className="absolute pointer-events-none" style={{ top: '83%', left: '14%', width: '28%', textAlign: 'center' }}>
                <span style={{
                  color: '#5b9bd5',
                  fontSize: '1.9%',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                }}>
                  {completedDate}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
