const PROGRESS_KEY = 'oc_progress';
const QUIZ_RESULTS_KEY = 'oc_quiz_results';
const QUIZ_COOLDOWN_KEY = 'oc_quiz_cooldown';

interface QuizCooldownEntry {
  ts: number; // timestamp of last failure
  failCount: number; // total failures so far (1-indexed)
}

/** Escalating cooldown: fail 1 = 1hr, fail 2 = 6hr, fail 3+ = 12hr. */
function getCooldownMs(failCount: number): number {
  if (failCount <= 1) return 1 * 60 * 60 * 1000;
  if (failCount === 2) return 6 * 60 * 60 * 1000;
  return 12 * 60 * 60 * 1000;
}

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

export function saveQuizResult(
  courseId: string,
  sceneId: string,
  score: number,
  total: number,
): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const results = getQuizResults();
    results[key] = {
      score,
      total,
      completedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
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

function getCooldowns(): Record<string, QuizCooldownEntry> {
  try {
    const raw = localStorage.getItem(QUIZ_COOLDOWN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // migrate legacy format (plain number timestamps → entry object)
    const migrated: Record<string, QuizCooldownEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number') {
        migrated[k] = { ts: v, failCount: 1 };
      } else {
        migrated[k] = v as QuizCooldownEntry;
      }
    }
    return migrated;
  } catch {
    return {};
  }
}

/** Record a failed attempt; increments fail count and starts escalating cooldown. */
export function recordQuizFailure(courseId: string, sceneId: string): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const cooldowns = getCooldowns();
    const prev = cooldowns[key];
    cooldowns[key] = {
      ts: Date.now(),
      failCount: prev ? prev.failCount + 1 : 1,
    };
    localStorage.setItem(QUIZ_COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {}
}

/**
 * Returns milliseconds remaining before retry is allowed, or 0 if retry is allowed now.
 * Cooldown escalates: fail 1 = 1hr, fail 2 = 6hr, fail 3+ = 12hr.
 */
export function getRetryUnlockMs(courseId: string, sceneId: string): number {
  try {
    const key = `${courseId}::${sceneId}`;
    const entry = getCooldowns()[key];
    if (!entry) return 0;
    const cooldownMs = getCooldownMs(entry.failCount);
    const remaining = entry.ts + cooldownMs - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

/** Returns the current fail count for a quiz (0 if never failed). */
export function getQuizFailCount(courseId: string, sceneId: string): number {
  try {
    const key = `${courseId}::${sceneId}`;
    return getCooldowns()[key]?.failCount ?? 0;
  } catch {
    return 0;
  }
}

/** Clear cooldown and fail count (called when a passing score is recorded). */
export function clearQuizCooldown(courseId: string, sceneId: string): void {
  try {
    const key = `${courseId}::${sceneId}`;
    const cooldowns = getCooldowns();
    delete cooldowns[key];
    localStorage.setItem(QUIZ_COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {}
}
