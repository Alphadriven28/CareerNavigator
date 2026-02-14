import axios from "axios";
import type {
    ProfileAnalysisResponse,
    AnalyzeRoleResponse,
    GenerateRoadmapResponse,
    GenerateCareerPlanResponse,
    SubmitTaskResponse,
    MissingSkill,
    HealthResponse,
    AIInsightsResponse,
} from "./types";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
    timeout: 300_000, // 5 min — Ollama on gemma3:1b can be slow
});

/* ── Health ── */
export const checkHealth = () =>
    api.get<HealthResponse>("/health").then((r) => r.data);

/* ── Profile Analysis (multipart/form-data) ── */
export async function analyzeProfile(
    resumeFile?: File | null,
    githubUsername?: string | null
): Promise<ProfileAnalysisResponse> {
    const form = new FormData();
    if (resumeFile) form.append("resume", resumeFile);
    if (githubUsername) form.append("github_username", githubUsername);
    const { data } = await api.post<ProfileAnalysisResponse>(
        "/analyze-profile",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
}

/* ── Role Analysis ── */
export async function analyzeRole(
    userSkills: string[],
    selectedRole: string
): Promise<AnalyzeRoleResponse> {
    const { data } = await api.post<AnalyzeRoleResponse>("/analyze-role", {
        user_skills: userSkills,
        selected_role: selectedRole,
    });
    return data;
}

/* ── Roadmap Generation (uses Ollama) ── */
export async function generateRoadmap(
    missingSkills: MissingSkill[]
): Promise<GenerateRoadmapResponse> {
    const { data } = await api.post<GenerateRoadmapResponse>(
        "/generate-roadmap",
        { missing_skills: missingSkills }
    );
    return data;
}

/* ── Career Plan (combined role + roadmap in one call) ── */
export async function generateCareerPlan(
    userSkills: string[],
    selectedRole: string
): Promise<GenerateCareerPlanResponse> {
    const { data } = await api.post<GenerateCareerPlanResponse>(
        "/generate-career-plan",
        { user_skills: userSkills, selected_role: selectedRole }
    );
    return data;
}

/* ── Task Submission ── */
export async function submitTask(
    userId: string,
    submissionText: string,
    qualityScore?: number
): Promise<SubmitTaskResponse> {
    const { data } = await api.post<SubmitTaskResponse>("/submit-task", {
        user_id: userId,
        submission_text: submissionText,
        quality_score: qualityScore ?? undefined,
    });
    return data;
}

/* ── AI Insights (Ollama-powered) ── */
export async function getAIInsights(
    userSkills: string[],
    selectedRole: string,
    alignmentScore: number,
    missingSkills: MissingSkill[]
): Promise<AIInsightsResponse> {
    const { data } = await api.post<AIInsightsResponse>("/ai-insights", {
        user_skills: userSkills,
        selected_role: selectedRole,
        alignment_score: alignmentScore,
        missing_skills: missingSkills,
    });
    return data;
}

