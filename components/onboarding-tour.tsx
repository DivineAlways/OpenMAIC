'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';

const TOUR_KEY = 'oc-classroom-tour-done';

interface TourStep {
  title: string;
  description: string;
  target: string; // data-tour attribute value
  side: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    title: 'Lesson List',
    target: 'sidebar',
    side: 'right',
    description: 'Click any lesson thumbnail on the left to jump to that scene.',
  },
  {
    title: 'Play / Pause',
    target: 'play-pause',
    side: 'top',
    description: 'Press Play to start the AI Teacher narrating the lesson. Press again to pause.',
  },
  {
    title: 'Progress Bar',
    target: 'progress-bar',
    side: 'bottom',
    description: 'Click anywhere on the bar to jump forward or backward to any scene instantly.',
  },
  {
    title: 'Skip Scenes',
    target: 'prev-next',
    side: 'top',
    description: 'Use the arrow buttons to go to the previous or next scene one at a time.',
  },
  {
    title: 'Playback Speed',
    target: 'speed',
    side: 'top',
    description: 'Change how fast the AI Teacher speaks — 0.75×, 1×, 1.5×, or 2×.',
  },
  {
    title: 'Auto-Play',
    target: 'autoplay',
    side: 'top',
    description:
      'When on, the lesson advances to the next scene automatically when narration ends.',
  },
  {
    title: 'Whiteboard / Notes',
    target: 'whiteboard',
    side: 'top',
    description: 'Open the whiteboard to draw and take notes while the lesson plays.',
  },
  {
    title: 'AI Teacher Chat',
    target: 'chat-toggle',
    side: 'top',
    description: 'Open the chat panel to ask the AI Teacher any question about the lesson.',
  },
  {
    title: 'Voice Input',
    target: 'mic',
    side: 'top',
    description: 'Tap the mic to speak your question instead of typing it.',
  },
  {
    title: 'Fullscreen',
    target: 'fullscreen',
    side: 'top',
    description: 'Expand to fullscreen for a distraction-free learning experience.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 12;
const TOOLTIP_W = 280;
const TOOLTIP_H = 130; // approximate

function tooltipPosition(rect: Rect, side: TourStep['side']) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0,
    left = 0;

  switch (side) {
    case 'bottom':
      top = rect.top + rect.height + PAD;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case 'top':
      top = rect.top - TOOLTIP_H - PAD;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left + rect.width + PAD;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left - TOOLTIP_W - PAD;
      break;
  }

  // Clamp within viewport
  left = Math.max(PAD, Math.min(left, vw - TOOLTIP_W - PAD));
  top = Math.max(PAD, Math.min(top, vh - TOOLTIP_H - PAD));

  return { top, left };
}

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rafRef = useRef<number>(0);

  // Only show on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        // Small delay so the classroom UI fully renders first
        const timer = setTimeout(() => setActive(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — skip tour
    }
  }, []);

  const currentStep = STEPS[step];

  // Update target rect on each step change and on resize/scroll
  const updateRect = useCallback(() => {
    if (!active || !currentStep) return;
    const r = getTargetRect(currentStep.target);
    setRect(r);
    if (r) setPos(tooltipPosition(r, currentStep.side));
  }, [active, currentStep]);

  useEffect(() => {
    if (!active) return;
    updateRect();

    // Keep re-checking in case element appears after render
    let tries = 0;
    const poll = () => {
      tries++;
      updateRect();
      if (tries < 8) rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, step, updateRect]);

  const dismiss = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {}
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!active) return null;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            {/* Spotlight: cut out around the target using box-shadow */}
            {rect && (
              <div
                style={{
                  position: 'absolute',
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                  borderRadius: 8,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  border: '2px solid rgba(139,92,246,0.7)',
                  background: 'transparent',
                }}
              />
            )}
          </motion.div>

          {/* Click-capture layer (only outside spotlight) */}
          <div className="fixed inset-0 z-[301]" onClick={next} style={{ pointerEvents: 'auto' }} />

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            {pos && (
              <motion.div
                key={`tooltip-${step}`}
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed z-[302] pointer-events-auto"
                style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-900 border border-violet-500/40 rounded-2xl shadow-2xl shadow-black/50 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      {step + 1} / {STEPS.length}
                    </span>
                    <button
                      onClick={dismiss}
                      className="text-gray-500 hover:text-gray-300 transition-colors -mt-0.5"
                      aria-label="Skip tour"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{currentStep.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {currentStep.description}
                  </p>

                  {/* Progress dots + Next button */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={
                            i === step
                              ? 'w-3 h-1.5 rounded-full bg-violet-500'
                              : 'w-1.5 h-1.5 rounded-full bg-gray-600'
                          }
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-colors"
                    >
                      {step < STEPS.length - 1 ? (
                        <>
                          Next <ChevronRight className="w-3 h-3" />
                        </>
                      ) : (
                        'Got it!'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
