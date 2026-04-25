const PROGRESS_KEY = 'oc_progress';

export interface CourseProgress {
  completedIds: string[]; // course IDs fully completed
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
