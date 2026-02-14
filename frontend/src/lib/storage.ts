import type {
    ProfileAnalysisResponse,
    AnalyzeRoleResponse,
    GenerateRoadmapResponse,
    UserProgress,
} from "./types";

const KEY = {
    profile: "cos_profile",
    role: "cos_role",
    roadmap: "cos_roadmap",
    progress: "cos_progress",
} as const;

function get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

function set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
}

/* ── Profile ── */
export const saveProfile = (p: ProfileAnalysisResponse) => set(KEY.profile, p);
export const loadProfile = (): ProfileAnalysisResponse | null => get(KEY.profile);

/* ── Role ── */
export const saveRole = (r: AnalyzeRoleResponse) => set(KEY.role, r);
export const loadRole = (): AnalyzeRoleResponse | null => get(KEY.role);

/* ── Roadmap ── */
export const saveRoadmap = (r: GenerateRoadmapResponse) => set(KEY.roadmap, r);
export const loadRoadmap = (): GenerateRoadmapResponse | null => get(KEY.roadmap);

/* ── User Progress ── */
export function defaultProgress(): UserProgress {
    return {
        user_id: `user_${Math.random().toString(36).slice(2, 8)}`,
        xp: 0,
        level: 1,
        rank: "Bronze",
        streak: 0,
        execution_score: 0,
        completedTasks: [],
        xpHistory: [],
        alignmentHistory: [],
    };
}

export const saveProgress = (p: UserProgress) => set(KEY.progress, p);
export function loadProgress(): UserProgress {
    return get<UserProgress>(KEY.progress) ?? defaultProgress();
}

/* ── Clear All ── */
export function clearAll() {
    Object.values(KEY).forEach((k) => localStorage.removeItem(k));
}
