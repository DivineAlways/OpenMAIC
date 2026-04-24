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
}

export function CertificateModal({ courseName, score, totalPoints, onClose }: CertificateModalProps) {
  const { nickname, setNickname } = useUserProfileStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [editingName, setEditingName] = useState(!nickname);
  const [nameInput, setNameInput] = useState(nickname || '');
  const [displayName, setDisplayName] = useState(nickname || '');
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const completedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // If nickname is empty on mount, focus the name input
  useEffect(() => {
    if (!nickname) setEditingName(true);
  }, [nickname]);

  const confirmName = useCallback(() => {
    const trimmed = nameInput.trim() || 'OnlyCrypto Member';
    setDisplayName(trimmed);
    setNickname(trimmed);
    setEditingName(false);
  }, [nameInput, setNickname]);

  const handleDownload = useCallback(async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-certificate.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [courseName, downloading]);

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
                  src="/onlycrypto-logo.jpg"
                  alt="OnlyCrypto"
                  width={44}
                  height={44}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                  crossOrigin="anonymous"
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
