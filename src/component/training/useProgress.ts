// ================= src/components/training/useProgress.ts =================
export type ModuleProgress = {
  completedLessons: string[]; // lesson ids
  quizScore?: number;
  passed?: boolean;
  certificateId?: string;
};
export type ProgressState = Record<string, ModuleProgress>; // key: moduleId

const KEY = "train-progress-v1";
export function getProgress(): ProgressState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
export function setProgress(next: ProgressState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}
export function updateModuleProgress(
  moduleId: string,
  patch: Partial<ModuleProgress>
) {
  const cur = getProgress();
  const prev = cur[moduleId] || { completedLessons: [] };
  cur[moduleId] = {
    ...prev,
    ...patch,
    completedLessons: patch.completedLessons ?? prev.completedLessons,
  };
  setProgress(cur);
}
