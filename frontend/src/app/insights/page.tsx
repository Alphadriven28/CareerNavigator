"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAIInsights } from "@/lib/api";
import { loadProfile, loadRole } from "@/lib/storage";
import LoadingScreen from "@/components/LoadingScreen";
import type { AIInsightsResponse, ProfileAnalysisResponse, AnalyzeRoleResponse } from "@/lib/types";

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    Critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    High: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    Medium: { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    Low: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
};

function RiskGauge({ score, level }: { score: number; level: string }) {
    const config = RISK_CONFIG[level] ?? RISK_CONFIG.Medium;
    const rotation = (score / 100) * 180 - 90; // -90 to 90

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-20 overflow-hidden">
                {/* Gauge background */}
                <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
                    <motion.path
                        d="M 10 100 A 90 90 0 0 1 190 100"
                        fill="none"
                        stroke={score >= 75 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 25 ? "#eab308" : "#22c55e"}
                        strokeWidth="12"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: score / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                {/* Needle */}
                <motion.div
                    className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-gray-800"
                    style={{ originX: 0.5, originY: 1 }}
                    initial={{ rotate: -90 }}
                    animate={{ rotate: rotation }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full" />
            </div>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-3 text-center"
            >
                <span className="text-3xl font-black">{score}</span>
                <span className="text-sm text-gray-400 ml-1">/100</span>
            </motion.div>
            <span className={`mt-1 px-3 py-1 rounded-full text-xs font-bold border ${config.color} ${config.bg} ${config.border}`}>
                {level} Risk
            </span>
        </div>
    );
}

export default function InsightsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileAnalysisResponse | null>(null);
    const [role, setRole] = useState<AnalyzeRoleResponse | null>(null);

    useEffect(() => {
        const p = loadProfile();
        const r = loadRole();
        setProfile(p);
        setRole(r);

        if (!p || !r) {
            setLoading(false);
            return;
        }

        const allSkills = [
            ...p.technical_skills,
            ...p.github_analysis.primary_languages.map((l) => l.toLowerCase()),
        ];

        getAIInsights(
            [...new Set(allSkills)],
            "Backend Developer", // from role context
            r.alignment_score,
            r.missing_skills
        )
            .then((data) => {
                setInsights(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("AI Insights error:", err);
                setError("Failed to generate AI insights. Make sure the backend & Ollama are running.");
                setLoading(false);
            });
    }, []);

    if (loading) return <LoadingScreen message="Generating AI-powered insights…" />;

    if (!profile || !role) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Complete your profile first to generate AI insights.</p>
                    <button className="btn-primary" onClick={() => router.push("/profile")}>← Set Up Profile</button>
                </div>
            </div>
        );
    }

    if (error || !insights) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error ?? "Failed to load insights."}</p>
                    <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    const narrative = insights.career_narrative;
    // Split narrative into phases by looking for "Phase" headings
    const phases = narrative.split(/(?=Phase\s*\d)/i).filter(Boolean);

    return (
        <div className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black">
                            AI <span className="gradient-text">Insights</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Powered by Ollama LLM inference
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn-secondary text-xs" onClick={() => router.push("/dashboard")}>← Dashboard</button>
                        <button className="btn-secondary text-xs" onClick={() => router.push("/trajectory")}>📈 Trajectory</button>
                    </div>
                </div>

                {/* AI Badge */}
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-3 rounded-2xl flex items-center gap-3 text-sm ${insights.ai_generated
                            ? "bg-lavender/10 border border-lavender/20 text-purple-700"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                            }`}
                    >
                        <span className="text-lg">{insights.ai_generated ? "🤖" : "⚠️"}</span>
                        <div>
                            <span className="font-bold">
                                {insights.ai_generated ? "AI-Generated Analysis" : "Fallback Analysis (Static)"}
                            </span>
                            <span className="text-xs ml-2 opacity-70">
                                {insights.ai_generated
                                    ? "This analysis was generated by the Ollama LLM (qwen2.5:0.5b model)"
                                    : "Ollama was unavailable — showing deterministic fallback data"}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Top Row: Summary + Risk */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    {/* Executive Summary */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-bold text-sm text-gray-600">📋 Executive Summary</h3>
                            {insights.ai_generated && (
                                <span className="chip chip-lavender text-[10px]">AI</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
                    </div>

                    {/* Risk Score */}
                    <div className="glass-card p-6 flex flex-col items-center justify-center">
                        <h3 className="font-bold text-sm text-gray-600 mb-4">🎯 Risk Assessment</h3>
                        <RiskGauge score={insights.risk_score} level={insights.risk_level} />
                    </div>
                </div>

                {/* Middle Row: Strengths + Risk Factors + Recommendations */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {/* Strengths */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">
                            💪 Strengths
                            {insights.ai_generated && <span className="chip chip-lavender text-[10px] ml-2">AI</span>}
                        </h3>
                        <ul className="space-y-2.5">
                            {insights.strengths.map((s, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                    <span className="text-mint mt-0.5">●</span>
                                    {s}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Risk Factors */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">
                            ⚠️ Risk Factors
                            {insights.ai_generated && <span className="chip chip-lavender text-[10px] ml-2">AI</span>}
                        </h3>
                        <ul className="space-y-2.5">
                            {insights.risk_factors.map((r, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                    <span className="text-coral mt-0.5">●</span>
                                    {r}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">
                            🚀 Recommendations
                            {insights.ai_generated && <span className="chip chip-lavender text-[10px] ml-2">AI</span>}
                        </h3>
                        <ul className="space-y-2.5">
                            {insights.recommendations.map((r, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.6 }}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                    <span className="text-lavender mt-0.5">{i + 1}.</span>
                                    {r}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Career Narrative Roadmap */}
                <div className="glass-card p-8 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="font-bold text-lg text-gray-700">🗺️ Career Roadmap — Narrative</h3>
                        {insights.ai_generated && (
                            <span className="chip chip-lavender text-[10px]">AI-Generated</span>
                        )}
                    </div>

                    {phases.length > 1 ? (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-lavender via-babyblue to-mint" />

                            <div className="space-y-8">
                                {phases.map((phase, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.15 }}
                                        className="relative pl-12"
                                    >
                                        {/* Timeline dot */}
                                        <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-white border-2 border-lavender" />

                                        <div className="p-5 rounded-2xl bg-white/50 border border-gray-100">
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{phase.trim()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 rounded-2xl bg-white/50 border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {narrative}
                            </p>
                        </div>
                    )}
                </div>

                {/* Raw Data vs AI Interpretation */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-3 text-gray-600">📊 Raw Data (Static)</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Technical Skills</span>
                                <span className="font-semibold">{profile.technical_skills.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GitHub Languages</span>
                                <span className="font-semibold">{profile.github_analysis.primary_languages.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GitHub Repos</span>
                                <span className="font-semibold">{profile.github_analysis.repo_count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Missing Skills</span>
                                <span className="font-semibold text-coral">{role.missing_skills.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Alignment Score</span>
                                <span className="font-semibold">{Math.round(role.alignment_score)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-3 text-gray-600">
                            🤖 AI Interpretation
                            {insights.ai_generated && <span className="chip chip-lavender text-[10px] ml-2">Live LLM</span>}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Risk Assessment</span>
                                <span className={`font-semibold ${RISK_CONFIG[insights.risk_level]?.color ?? ""}`}>
                                    {insights.risk_level} ({insights.risk_score}%)
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Strengths Identified</span>
                                <span className="font-semibold text-green-600">{insights.strengths.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Risk Factors</span>
                                <span className="font-semibold text-orange-500">{insights.risk_factors.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Action Items</span>
                                <span className="font-semibold text-lavender">{insights.recommendations.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Inference Source</span>
                                <span className="font-semibold">
                                    {insights.ai_generated ? "Ollama (qwen2.5:0.5b)" : "Deterministic"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
