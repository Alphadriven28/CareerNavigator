/* ── Domain types matching the FastAPI backend Pydantic models ── */

export interface GithubAnalysis {
    repo_count: number;
    primary_languages: string[];
}

export interface ProfileAnalysisResponse {
    technical_skills: string[];
    soft_skills: string[];
    experience_level: string;
    github_analysis: GithubAnalysis;
}

export interface RecommendedProject {
    title: string;
    description: string;
    steps: string[];
}

export interface MissingSkill {
    skill: string;
    importance: number;
    why_this_skill_matters?: string;
    market_signal?: string;
    learning_resources?: string[];
    recommended_project?: RecommendedProject;
    checkpoints?: string[];
}

export interface AnalyzeRoleResponse {
    alignment_score: number;
    missing_skills: MissingSkill[];
}

export interface DailyTask {
    day: number;
    task: string;
    description: string;
}

export interface WeekPlan {
    week: number;
    focus_skill: string;
    importance: number;
    days: DailyTask[];
}

export interface GenerateRoadmapResponse {
    roadmap: WeekPlan[];
    capstone: DailyTask;
    review: DailyTask;
    total_days: number;
    total_skills: number;
}

export interface GenerateCareerPlanResponse {
    alignment_score: number;
    missing_skills: MissingSkill[];
    roadmap: WeekPlan[];
    capstone: DailyTask;
    review: DailyTask;
}

export interface SubmitTaskResponse {
    xp: number;
    level: number;
    rank: string;
    streak: number;
    execution_score: number;
}

export interface HealthResponse {
    status: string;
}

export const AVAILABLE_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Data Analyst",
    "Machine Learning Engineer",
    "Product Manager",
] as const;

export type AvailableRole = (typeof AVAILABLE_ROLES)[number];

/* ── Local state types ── */
export interface UserProgress {
    user_id: string;
    xp: number;
    level: number;
    rank: string;
    streak: number;
    execution_score: number;
    completedTasks: string[]; // "week-day" keys
    xpHistory: { date: string; xp: number }[];
    alignmentHistory: { date: string; score: number }[];
}

export interface AIInsightsResponse {
    ai_generated: boolean;
    summary: string;
    risk_score: number;
    risk_level: string;
    risk_factors: string[];
    strengths: string[];
    recommendations: string[];
    career_narrative: string;
}
