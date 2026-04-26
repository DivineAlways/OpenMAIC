'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Award, Edit2, Check } from 'lucide-react';
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
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [editingName, setEditingName] = useState(!nickname);
  const [nameInput, setNameInput] = useState(nickname || '');
  const [displayName, setDisplayName] = useState(nickname || '');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const completedDate = completedDateProp ?? new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // If nickname is empty on mount, focus the name input
  useEffect(() => {
    if (!nickname) setEditingName(true);
  }, [nickname]);

  // Pre-load logo as data URL so html2canvas can render it without CORS taint
  useEffect(() => {
    fetch('/onlycrypto-logo.jpg')
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => setLogoDataUrl(null));
  }, []);

  const confirmName = useCallback(() => {
    const trimmed = nameInput.trim() || 'OnlyCrypto Member';
    setDisplayName(trimmed);
    setNickname(trimmed);
    setEditingName(false);
  }, [nameInput, setNickname]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const W = 900, H = 560;
      const canvas = document.createElement('canvas');
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0f1729');
      bg.addColorStop(0.5, '#1a2744');
      bg.addColorStop(1, '#0f1729');
      ctx.fillStyle = bg;
      ctx.roundRect(0, 0, W, H, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.roundRect(1, 1, W - 2, H - 2, 15);
      ctx.stroke();

      // Corner glows
      const tl = ctx.createRadialGradient(0, 0, 0, 0, 0, 120);
      tl.addColorStop(0, 'rgba(59,130,246,0.15)');
      tl.addColorStop(1, 'transparent');
      ctx.fillStyle = tl;
      ctx.fillRect(0, 0, 120, 120);

      const br = ctx.createRadialGradient(W, H, 0, W, H, 120);
      br.addColorStop(0, 'rgba(59,130,246,0.12)');
      br.addColorStop(1, 'transparent');
      ctx.fillStyle = br;
      ctx.fillRect(W - 120, H - 120, 120, 120);

      const pad = 56;

      // Logo image (preloaded as data URL — no CORS)
      if (logoDataUrl) {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pad, 36, 44, 44, 8);
        ctx.clip();
        ctx.drawImage(img, pad, 36, 44, 44);
        ctx.restore();
      }

      // ONLYCRYPTO label
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('ONLYCRYPTO', pad + 52, 63);
      ctx.letterSpacing = '0px';

      // Score badge
      const badgeText = `${pct}% · PASS`;
      ctx.font = '11px Arial, sans-serif';
      const bw = ctx.measureText(badgeText).width + 28;
      const bx = W - pad - bw, by = 36;
      ctx.fillStyle = 'rgba(59,130,246,0.15)';
      ctx.strokeStyle = 'rgba(59,130,246,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 24, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#60a5fa';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, bx + bw / 2, by + 16);
      ctx.textAlign = 'left';

      // Award circle
      const cx = W / 2, cy = 145;
      const grad = ctx.createLinearGradient(cx - 32, cy - 32, cx + 32, cy + 32);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      // Award icon (simplified ribbon)
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy + 4);
      ctx.lineTo(cx - 11, cy + 18);
      ctx.lineTo(cx, cy + 13);
      ctx.lineTo(cx + 11, cy + 18);
      ctx.lineTo(cx + 7, cy + 4);
      ctx.stroke();

      // "Certificate of Completion"
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('CERTIFICATE OF COMPLETION', W / 2, 200);
      ctx.letterSpacing = '0px';

      ctx.font = '13px Arial, sans-serif';
      ctx.fillText('This certifies that', W / 2, 222);

      // Student name
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic bold 32px Georgia, serif';
      ctx.fillText(displayName || 'OnlyCrypto Member', W / 2, 268);

      // "has successfully completed"
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText('has successfully completed', W / 2, 295);

      // Course name
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(courseName, W / 2, 330);

      // Divider
      const divGrad = ctx.createLinearGradient(pad, 0, W - pad, 0);
      divGrad.addColorStop(0, 'transparent');
      divGrad.addColorStop(0.5, 'rgba(59,130,246,0.4)');
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(pad, 350, W - pad * 2, 1);

      // Footer — Date
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Arial, sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('DATE ISSUED', pad, 385);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText(completedDate, pad, 403);

      // Footer — Score (center)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Arial, sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('FINAL SCORE', W / 2, 385);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(`${score}/${totalPoints}`, W / 2, 405);

      // Footer — Authorized By (right)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Arial, sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('AUTHORIZED BY', W - pad, 385);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillText('OnlyCrypto Academy', W - pad, 403);
      ctx.fillStyle = '#3b82f6';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('learn.onlycrypto.io', W - pad, 418);

      ctx.textAlign = 'left';

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
  }, [courseName, downloading, displayName, pct, score, totalPoints, completedDate, logoDataUrl]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-2xl"
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
                disabled={downloading || editingName}
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

          {/* The certificate itself */}
          <div
            ref={certRef}
            style={{
              background: 'linear-gradient(135deg, #0f1729 0%, #1a2744 50%, #0f1729 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '48px 56px',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: 'Georgia, serif',
            }}
          >
            {/* Corner decoration — top left */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 120, height: 120,
              background: 'radial-gradient(circle at 0 0, rgba(59,130,246,0.15) 0%, transparent 70%)',
            }} />
            {/* Corner decoration — bottom right */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 120, height: 120,
              background: 'radial-gradient(circle at 100% 100%, rgba(59,130,246,0.12) 0%, transparent 70%)',
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              {/* OC Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoDataUrl ?? '/onlycrypto-logo.jpg'}
                  alt="OnlyCrypto"
                  width={44}
                  height={44}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                />
                <span style={{ color: '#60a5fa', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif' }}>
                  ONLYCRYPTO
                </span>
              </div>
              <div style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 20,
                padding: '4px 14px',
                color: '#60a5fa',
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.06em',
              }}>
                {pct}% · PASS
              </div>
            </div>

            {/* Award icon row */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                color: '#94a3b8',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif',
                marginBottom: 8,
              }}>
                Certificate of Completion
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
                This certifies that
              </div>
            </div>

            {/* Student name */}
            <div style={{
              textAlign: 'center',
              color: '#f1f5f9',
              fontSize: 32,
              fontWeight: 700,
              fontStyle: 'italic',
              marginBottom: 16,
              letterSpacing: '0.01em',
            }}>
              {displayName || 'OnlyCrypto Member'}
            </div>

            {/* Has completed */}
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontFamily: 'Arial, sans-serif', marginBottom: 16 }}>
              has successfully completed
            </div>

            {/* Course name */}
            <div style={{
              textAlign: 'center',
              color: '#60a5fa',
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'Arial, sans-serif',
              marginBottom: 24,
              letterSpacing: '0.01em',
            }}>
              {courseName}
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)',
              marginBottom: 24,
            }} />

            {/* Footer row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Date */}
              <div>
                <div style={{ color: '#64748b', fontSize: 10, letterSpacing: '0.12em', fontFamily: 'Arial, sans-serif', marginBottom: 4 }}>
                  DATE ISSUED
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
                  {completedDate}
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: 10, letterSpacing: '0.12em', fontFamily: 'Arial, sans-serif', marginBottom: 4 }}>
                  FINAL SCORE
                </div>
                <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                  {score}/{totalPoints}
                </div>
              </div>

              {/* Signature */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#64748b', fontSize: 10, letterSpacing: '0.12em', fontFamily: 'Arial, sans-serif', marginBottom: 4 }}>
                  AUTHORIZED BY
                </div>
                <div style={{
                  color: '#60a5fa',
                  fontSize: 16,
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                }}>
                  OnlyCrypto Academy
                </div>
                <div style={{ color: '#3b82f6', fontSize: 10, fontFamily: 'Arial, sans-serif', letterSpacing: '0.05em', marginTop: 2 }}>
                  learn.onlycrypto.io
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
