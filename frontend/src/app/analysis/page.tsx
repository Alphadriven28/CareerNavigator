"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { loadProfile, loadRole, loadProgress, saveProgress, saveRole } from "@/lib/storage";
import { analyzeRole } from "@/lib/api";
import type { ProfileAnalysisResponse, AnalyzeRoleResponse } from "@/lib/types";

const BAR_COLORS = ["#C8B6FF", "#B8E0FF", "#B5F2C3", "#FFB3B3", "#FFD6A5", "#A0D2FF"];

export default function AnalysisPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileAnalysisResponse | null>(null);
    const [role, setRoleData] = useState<AnalyzeRoleResponse | null>(null);
    const [newSkill, setNewSkill] = useState("");
    const [addedSkills, setAddedSkills] = useState<string[]>([]);

    useEffect(() => {
        setProfile(loadProfile());
        setRoleData(loadRole());
    }, []);

    if (!profile || !role) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No analysis data yet.</p>
                    <button className="btn-primary" onClick={() => router.push("/profile")}>
                        ← Set Up Profile
                    </button>
                </div>
            </div>
        );
    }

    const barData = role.missing_skills.map((ms) => ({
        name: ms.skill,
        importance: ms.importance,
    }));

    const allCurrentSkills = [
        ...profile.technical_skills,
        ...profile.github_analysis.primary_languages.map((l) => l.toLowerCase()),
        ...addedSkills,
    ];
    const unique = [...new Set(allCurrentSkills)];

    const handleAddSkill = async () => {
        const trimmed = newSkill.trim().toLowerCase();
        if (!trimmed || unique.includes(trimmed)) { setNewSkill(""); return; }
        setAddedSkills((prev) => [...prev, trimmed]);
        setNewSkill("");

        // Re-analyze role with updated skills
        try {
            const updated = await analyzeRole([...unique, trimmed], role.missing_skills[0]?.skill ? "Backend Developer" : "Frontend Developer");
            setRoleData(updated);
            saveRole(updated);
            const progress = loadProgress();
            progress.alignmentHistory.push({
                date: new Date().toISOString().slice(0, 10),
                score: updated.alignment_score,
            });
            saveProgress(progress);
        } catch { /* ignore re-analysis failures */ }
    };

    const scoreColor = role.alignment_score >= 60 ? "#3a9157" : role.alignment_score >= 30 ? "#c68a00" : "#c45a5a";

    return (
        <div className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-black text-center mb-1">
                    Skill <span className="gradient-text">Analysis</span>
                </h1>
                <p className="text-center text-gray-400 text-sm mb-10">
                    Here&apos;s how your skills align with your dream role
                </p>

                {/* Alignment Score */}
                <div className="glass-card p-8 text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                        Alignment Score
                    </p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full mx-auto"
                        style={{
                            border: `4px solid ${scoreColor}`,
                            background: `${scoreColor}15`,
                        }}
                    >
                        <span className="text-4xl font-black" style={{ color: scoreColor }}>
                            {Math.round(role.alignment_score)}
                        </span>
                        <span className="text-sm font-bold ml-0.5" style={{ color: scoreColor }}>%</span>
                    </motion.div>
                    <div className="progress-track max-w-sm mx-auto mt-4">
                        <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(role.alignment_score, 100)}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                </div>

                {/* Skills Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Current Skills */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-3 text-gray-600">✅ Current Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {unique.map((s) => (
                                <span key={s} className="chip chip-green">{s}</span>
                            ))}
                        </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-3 text-gray-600">🔓 Skills to Improve</h3>
                        <div className="flex flex-wrap gap-2">
                            {role.missing_skills.map((ms) => (
                                <span key={ms.skill} className="chip chip-coral">{ms.skill}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="glass-card p-6 mb-8">
                    <h3 className="font-bold text-sm mb-4 text-gray-600">📊 Skill Importance</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData} layout="vertical" margin={{ left: 60 }}>
                            <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: "#999" }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#666" }} width={80} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                            />
                            <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                                {barData.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Add Skill */}
                <div className="glass-card p-6 mb-8">
                    <h3 className="font-bold text-sm mb-3 text-gray-600">➕ Add a Skill</h3>
                    <div className="flex gap-2 max-w-md">
                        <input
                            className="input-field flex-1"
                            placeholder="Type a skill…"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                        />
                        <button className="btn-primary !px-5" onClick={handleAddSkill} disabled={!newSkill.trim()}>
                            +
                        </button>
                    </div>
                </div>

                {/* Continue */}
                <div className="text-center">
                    <button className="btn-primary text-base px-10 py-4" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard →
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
