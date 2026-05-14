const PROGRESS_KEY = 'oc_progress';
const QUIZ_RESULTS_KEY = 'oc_quiz_results';
const QUIZ_COOLDOWN_KEY = 'oc_quiz_cooldown';

/** Cooldown period in milliseconds before a failed quiz can be retried (24 hours). */
export const QUIZ_RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface CourseProgress {
  completedIds: string[]; // course IDs fully completed
}

export interface QuizResult {
  score: number;
  total: number;
  completedDate: string; // ISO date string
}

export function getProgress(): CourseProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { completedIds: [] };
  } catch {
    return { completedIds: [] };
  }
}

export function markCourseComplete(courseId: string): void {
  try {
    const p = getProgress();
    if (!p.completedIds.includes(courseId)) {
      p.completedIds.push(courseId);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    }
  } catch {}
}

export function isCourseComplete(courseId: string): boolean {
  return getProgress().completedIds.includes(courseId);
}

function getQuizResults(): Record<string, QuizResult> {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveQuizResult(courseId: string, sceneId: string, score: number, total: number): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const results = getQuizResults();
    results[key] = {
      score,
      total,
      completedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
  } catch {}
}

export function getQuizResult(courseId: string, sceneId: string): QuizResult | null {
  try {
    const key = `${courseId}::${sceneId}`;
    return getQuizResults()[key] ?? null;
  } catch {
    return null;
  }
}

function getCooldowns(): Record<string, number> {
  try {
    const raw = localStorage.getItem(QUIZ_COOLDOWN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Record a failed attempt timestamp so retries are locked for QUIZ_RETRY_COOLDOWN_MS. */
export function recordQuizFailure(courseId: string, sceneId: string): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const cooldowns = getCooldowns();
    cooldowns[key] = Date.now();
    localStorage.setItem(QUIZ_COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {}
}

/**
 * Returns milliseconds remaining before retry is allowed, or 0 if retry is allowed now.
 * A score >= 80% clears the cooldown (pass always allowed to proceed).
 */
export function getRetryUnlockMs(courseId: string, sceneId: string): number {
  try {
    const key = `${courseId}::${sceneId}`;
    const ts = getCooldowns()[key];
    if (!ts) return 0;
    const remaining = ts + QUIZ_RETRY_COOLDOWN_MS - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

/** Clear the cooldown (called when a passing score is recorded). */
export function clearQuizCooldown(courseId: string, sceneId: string): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const cooldowns = getCooldowns();
    delete cooldowns[key];
    localStorage.setItem(QUIZ_COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {}
}
