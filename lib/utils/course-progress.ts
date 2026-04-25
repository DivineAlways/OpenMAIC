const PROGRESS_KEY = 'oc_progress';
const QUIZ_RESULTS_KEY = 'oc_quiz_results';

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
