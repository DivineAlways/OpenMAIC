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
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [editingName, setEditingName] = useState(!nickname);
  const [nameInput, setNameInput] = useState(nickname || '');
  const [displayName, setDisplayName] = useState(nickname || '');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 100;
  const completedDate = completedDateProp ?? new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (!nickname) setEditingName(true);
  }, [nickname]);

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
      // Canvas at 2× for sharp download
      const W = 1006, H = 712;
      const S = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * S;
      canvas.height = H * S;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(S, S);

      // ── Background ──
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#050d1f');
      bg.addColorStop(0.45, '#0b1a3a');
      bg.addColorStop(1, '#050d1f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle radial glow top-right
      const glowTR = ctx.createRadialGradient(W, 0, 0, W, 0, 300);
      glowTR.addColorStop(0, 'rgba(120,60,200,0.18)');
      glowTR.addColorStop(1, 'transparent');
      ctx.fillStyle = glowTR;
      ctx.fillRect(0, 0, W, H);

      // Subtle radial glow bottom-left
      const glowBL = ctx.createRadialGradient(0, H, 0, 0, H, 280);
      glowBL.addColorStop(0, 'rgba(60,100,220,0.14)');
      glowBL.addColorStop(1, 'transparent');
      ctx.fillStyle = glowBL;
      ctx.fillRect(0, 0, W, H);

      // ── Gold border ──
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      // Inner thin border
      ctx.strokeStyle = 'rgba(201,168,76,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, W - 32, H - 32);

      // ── Network lines top-right ──
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#6080c0';
      ctx.lineWidth = 0.8;
      const trNodes = [
        [W - 30, 30], [W - 120, 60], [W - 60, 110], [W - 180, 40],
        [W - 200, 120], [W - 90, 160], [W - 260, 70], [W - 300, 140],
      ];
      const trEdges = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[4,5],[2,5],[3,6],[6,7],[4,7]];
      for (const [a, b] of trEdges) {
        ctx.beginPath();
        ctx.moveTo(trNodes[a][0], trNodes[a][1]);
        ctx.lineTo(trNodes[b][0], trNodes[b][1]);
        ctx.stroke();
      }
      for (const [nx, ny] of trNodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#7090d0';
        ctx.fill();
      }
      ctx.restore();

      // ── Network lines bottom-left ──
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#6080c0';
      ctx.lineWidth = 0.8;
      const blNodes = [
        [30, H - 30], [120, H - 60], [60, H - 110], [180, H - 40],
        [200, H - 120], [90, H - 160], [260, H - 70], [300, H - 140],
      ];
      for (const [a, b] of trEdges) {
        ctx.beginPath();
        ctx.moveTo(blNodes[a][0], blNodes[a][1]);
        ctx.lineTo(blNodes[b][0], blNodes[b][1]);
        ctx.stroke();
      }
      for (const [nx, ny] of blNodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#7090d0';
        ctx.fill();
      }
      ctx.restore();

      // ── Stars / particles ──
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      const starPositions = [
        [50, 80], [150, 30], [800, 50], [920, 80], [970, 200],
        [40, 300], [30, 450], [960, 400], [980, 550], [880, 680],
        [400, 20], [600, 15], [700, 680], [200, 690],
      ];
      for (const [sx, sy] of starPositions) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── Logo (top-left) ──
      const logoX = 48, logoY = 40, logoSize = 64;
      if (logoDataUrl) {
        const img = new Image();
        img.src = logoDataUrl;
        await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
        ctx.save();
        ctx.beginPath();
        // Hexagon clip
        const hex = (cx: number, cy: number, r: number) => {
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          }
          ctx.closePath();
        };
        hex(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      }
      // "ONLY CRYPTO" below logo
      ctx.fillStyle = '#c9d8f0';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText('ONLY CRYPTO', logoX + logoSize / 2, logoY + logoSize + 16);
      ctx.letterSpacing = '0px';

      // ── "CERTIFICATE" title (gold, large) ──
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 62px Georgia, serif';
      ctx.fillText('CERTIFICATE', W / 2, 100);

      // ── "OF COMPLETION" subtitle ──
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('OF COMPLETION', W / 2, 138);
      ctx.letterSpacing = '0px';

      // ── Thin gold divider below title ──
      ctx.strokeStyle = 'rgba(201,168,76,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, 152);
      ctx.lineTo(W / 2 + 200, 152);
      ctx.stroke();

      // ── "THIS CERTIFIES THAT" ──
      ctx.fillStyle = '#a0b0cc';
      ctx.font = '13px Arial, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('THIS CERTIFIES THAT', W / 2, 195);
      ctx.letterSpacing = '0px';

      // ── Student name (italic script) ──
      ctx.fillStyle = '#dce8f5';
      ctx.font = 'italic 52px Georgia, serif';
      ctx.fillText(displayName || 'OnlyCrypto Member', W / 2, 275);

      // Underline below name
      const nameW = ctx.measureText(displayName || 'OnlyCrypto Member').width;
      const nameLineY = 285;
      const lineGrad = ctx.createLinearGradient(W / 2 - nameW / 2 - 20, 0, W / 2 + nameW / 2 + 20, 0);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.2, '#c9a84c');
      lineGrad.addColorStop(0.8, '#c9a84c');
      lineGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nameW / 2 - 20, nameLineY);
      ctx.lineTo(W / 2 + nameW / 2 + 20, nameLineY);
      ctx.stroke();

      // ── Course completion text ──
      ctx.fillStyle = '#c0cce0';
      ctx.font = '15px Arial, sans-serif';
      const line1 = `has successfully completed the course "${courseName}"`;
      const line2 = 'demonstrating proficiency in fundamental blockchain technology concepts.';
      ctx.fillText(line1, W / 2, 330);
      ctx.fillText(line2, W / 2, 353);

      // ── Gold ornate flourish — bottom left ──
      // Simplified decorative corner bracket
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#c9a84c';
      ctx.fillStyle = '#c9a84c';
      ctx.lineWidth = 1.5;
      // Vertical bar
      ctx.beginPath();
      ctx.moveTo(52, H - 160);
      ctx.lineTo(52, H - 60);
      ctx.stroke();
      // Horizontal base
      ctx.beginPath();
      ctx.moveTo(52, H - 60);
      ctx.lineTo(90, H - 60);
      ctx.stroke();
      // Top curl
      ctx.beginPath();
      ctx.arc(52, H - 160, 8, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();
      // Fleur-de-lis style dots
      for (const [fx, fy] of [[52, H - 110], [44, H - 95], [60, H - 95]]) {
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Leaf shapes
      ctx.beginPath();
      ctx.ellipse(44, H - 130, 5, 12, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(60, H - 130, 5, 12, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── DATE ISSUED (bottom-left) ──
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8090a8';
      ctx.font = '10px Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('DATE ISSUED', 120, H - 100);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#5b9bd5';
      ctx.font = 'italic 14px Georgia, serif';
      ctx.fillText(completedDate, 120, H - 78);

      // ── PASS badge (bottom-center) ──
      const badgeCX = W / 2, badgeCY = H - 88;
      const badgeR = 52;
      // Outer circle (blue gradient)
      const badgeGrad = ctx.createRadialGradient(badgeCX - 10, badgeCY - 10, 5, badgeCX, badgeCY, badgeR);
      badgeGrad.addColorStop(0, '#4aa8e8');
      badgeGrad.addColorStop(1, '#1a6ab5');
      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = badgeGrad;
      ctx.fill();
      // Inner ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR - 6, 0, Math.PI * 2);
      ctx.stroke();
      // Dashed outer ring
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Badge text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(`${pct}%`, badgeCX, badgeCY - 8);
      ctx.letterSpacing = '0px';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('PASS', badgeCX, badgeCY + 14);

      // ── AUTHORIZED BY (bottom-right) ──
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8090a8';
      ctx.font = '10px Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('AUTHORIZED BY', W - 80, H - 100);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#5b9bd5';
      ctx.font = 'italic 14px Georgia, serif';
      ctx.fillText('OnlyCrypto Academy', W - 80, H - 78);

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
  }, [courseName, downloading, displayName, pct, completedDate, logoDataUrl]);

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

          {/* Certificate preview */}
          <div
            ref={certRef}
            style={{
              background: 'linear-gradient(135deg, #050d1f 0%, #0b1a3a 45%, #050d1f 100%)',
              border: '3px solid #c9a84c',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '1006 / 712',
              fontFamily: 'Georgia, serif',
            }}
          >
            {/* Inner thin border */}
            <div style={{
              position: 'absolute', inset: 6,
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 2,
              pointerEvents: 'none',
            }} />

            {/* Top-right glow */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 340, height: 260,
              background: 'radial-gradient(circle at 100% 0%, rgba(120,60,200,0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            {/* Bottom-left glow */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              width: 300, height: 250,
              background: 'radial-gradient(circle at 0% 100%, rgba(60,100,220,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Network lines SVG — top right */}
            <svg style={{ position: 'absolute', top: 0, right: 0, width: 320, height: 200, opacity: 0.28 }} viewBox="0 0 320 200">
              <g stroke="#7090d0" strokeWidth="0.8" fill="none">
                <line x1="290" y1="20" x2="200" y2="50" /><line x1="290" y1="20" x2="260" y2="90" />
                <line x1="200" y1="50" x2="260" y2="90" /><line x1="200" y1="50" x2="140" y2="30" />
                <line x1="260" y1="90" x2="120" y2="110" /><line x1="140" y1="30" x2="120" y2="110" />
                <line x1="140" y1="30" x2="60" y2="60" /><line x1="60" y1="60" x2="40" y2="130" />
                <line x1="120" y1="110" x2="40" y2="130" /><line x1="260" y1="90" x2="310" y2="170" />
              </g>
              <g fill="#8090d0">
                <circle cx="290" cy="20" r="2" /><circle cx="200" cy="50" r="2" />
                <circle cx="260" cy="90" r="2" /><circle cx="140" cy="30" r="2" />
                <circle cx="120" cy="110" r="2" /><circle cx="60" cy="60" r="2" />
                <circle cx="40" cy="130" r="2" /><circle cx="310" cy="170" r="2" />
              </g>
            </svg>

            {/* Network lines SVG — bottom left */}
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: 320, height: 200, opacity: 0.28 }} viewBox="0 0 320 200">
              <g stroke="#7090d0" strokeWidth="0.8" fill="none">
                <line x1="30" y1="180" x2="120" y2="150" /><line x1="30" y1="180" x2="60" y2="110" />
                <line x1="120" y1="150" x2="60" y2="110" /><line x1="120" y1="150" x2="180" y2="170" />
                <line x1="60" y1="110" x2="200" y2="90" /><line x1="180" y1="170" x2="200" y2="90" />
                <line x1="180" y1="170" x2="260" y2="140" /><line x1="260" y1="140" x2="280" y2="70" />
                <line x1="200" y1="90" x2="280" y2="70" /><line x1="60" y1="110" x2="10" y2="30" />
              </g>
              <g fill="#8090d0">
                <circle cx="30" cy="180" r="2" /><circle cx="120" cy="150" r="2" />
                <circle cx="60" cy="110" r="2" /><circle cx="180" cy="170" r="2" />
                <circle cx="200" cy="90" r="2" /><circle cx="260" cy="140" r="2" />
                <circle cx="280" cy="70" r="2" /><circle cx="10" cy="30" r="2" />
              </g>
            </svg>

            {/* Logo + ONLY CRYPTO — top left */}
            <div style={{
              position: 'absolute', top: 28, left: 38,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoDataUrl ?? '/onlycrypto-logo.jpg'}
                alt="Only Crypto"
                style={{
                  width: 64, height: 64,
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  objectFit: 'cover',
                }}
              />
              <span style={{
                color: '#c9d8f0', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', fontFamily: 'Arial, sans-serif',
                textTransform: 'uppercase',
              }}>
                ONLY CRYPTO
              </span>
            </div>

            {/* Main content — centered */}
            <div style={{ textAlign: 'center', paddingTop: '6%' }}>
              {/* CERTIFICATE */}
              <div style={{
                color: '#c9a84c',
                fontSize: 'clamp(36px, 7vw, 62px)',
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                lineHeight: 1,
                letterSpacing: '0.04em',
              }}>
                CERTIFICATE
              </div>
              {/* OF COMPLETION */}
              <div style={{
                color: '#c9a84c',
                fontSize: 'clamp(14px, 2.8vw, 24px)',
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.2em',
                marginTop: 4,
              }}>
                OF COMPLETION
              </div>

              {/* Thin gold divider */}
              <div style={{
                margin: '10px auto 0',
                width: '40%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
              }} />

              {/* THIS CERTIFIES THAT */}
              <div style={{
                color: '#8098b8', fontSize: 'clamp(9px, 1.4vw, 12px)',
                letterSpacing: '0.22em', fontFamily: 'Arial, sans-serif',
                marginTop: '4%',
              }}>
                THIS CERTIFIES THAT
              </div>

              {/* Student name */}
              <div style={{
                color: '#dce8f5',
                fontSize: 'clamp(26px, 5.5vw, 48px)',
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                marginTop: '2%',
                position: 'relative',
                display: 'inline-block',
              }}>
                {displayName || 'OnlyCrypto Member'}
                <div style={{
                  position: 'absolute', bottom: -6, left: '-10%', right: '-10%',
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, #c9a84c 20%, #c9a84c 80%, transparent)',
                }} />
              </div>

              {/* Completion text */}
              <div style={{
                color: '#b0bfd8',
                fontSize: 'clamp(9px, 1.5vw, 13px)',
                fontFamily: 'Arial, sans-serif',
                marginTop: '4%',
                lineHeight: 1.6,
                padding: '0 10%',
              }}>
                has successfully completed the course &ldquo;{courseName}&rdquo;<br />
                demonstrating proficiency in fundamental blockchain technology concepts.
              </div>
            </div>

            {/* Footer row — absolute at bottom */}
            <div style={{
              position: 'absolute', bottom: '7%', left: '7%', right: '7%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {/* Left: ornate flourish + DATE ISSUED */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                {/* Gold ornate corner bracket */}
                <svg width="52" height="90" viewBox="0 0 52 90" style={{ opacity: 0.85 }}>
                  <g stroke="#c9a84c" strokeWidth="1.5" fill="none">
                    <line x1="16" y1="5" x2="16" y2="72" />
                    <line x1="16" y1="72" x2="48" y2="72" />
                    <path d="M16 5 Q8 5 8 13 Q8 5 0 5" strokeWidth="1.2" />
                  </g>
                  <g fill="#c9a84c">
                    <circle cx="16" cy="35" r="3" />
                    <circle cx="7" cy="22" r="2.5" />
                    <circle cx="25" cy="22" r="2.5" />
                    <ellipse cx="7" cy="12" rx="4" ry="9" transform="rotate(-20 7 12)" />
                    <ellipse cx="25" cy="12" rx="4" ry="9" transform="rotate(20 25 12)" />
                  </g>
                </svg>
                <div>
                  <div style={{
                    color: '#6070a0', fontSize: 9, letterSpacing: '0.18em',
                    fontFamily: 'Arial, sans-serif', marginBottom: 4,
                  }}>DATE ISSUED</div>
                  <div style={{ color: '#5b9bd5', fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {completedDate}
                  </div>
                </div>
              </div>

              {/* Center: PASS badge */}
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #4aa8e8, #1a6ab5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #ffffff',
                outline: '1px dashed rgba(255,255,255,0.4)',
                outlineOffset: 4,
                boxShadow: '0 4px 20px rgba(26,106,181,0.5)',
                flexShrink: 0,
              }}>
                <div style={{
                  color: '#ffffff', fontSize: 12, fontWeight: 700,
                  fontFamily: 'Arial, sans-serif', letterSpacing: '0.05em', lineHeight: 1,
                }}>
                  {pct}%
                </div>
                <div style={{
                  color: '#ffffff', fontSize: 22, fontWeight: 900,
                  fontFamily: 'Arial, sans-serif', lineHeight: 1.1,
                }}>
                  PASS
                </div>
              </div>

              {/* Right: AUTHORIZED BY */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  color: '#6070a0', fontSize: 9, letterSpacing: '0.18em',
                  fontFamily: 'Arial, sans-serif', marginBottom: 4,
                }}>AUTHORIZED BY</div>
                <div style={{ color: '#5b9bd5', fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  OnlyCrypto Academy
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
