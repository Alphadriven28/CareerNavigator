"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { analyzeProfile, analyzeRole, generateRoadmap } from "@/lib/api";
import { saveProfile, saveRole, saveRoadmap, loadProgress, saveProgress } from "@/lib/storage";
import LoadingScreen from "@/components/LoadingScreen";
import { AVAILABLE_ROLES } from "@/lib/types";
import type { AvailableRole } from "@/lib/types";

export default function ProfilePage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [github, setGithub] = useState("");
    const [manualSkills, setManualSkills] = useState("");
    const [role, setRole] = useState<AvailableRole | string>(AVAILABLE_ROLES[0]);
    const [customRole, setCustomRole] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadMsg, setLoadMsg] = useState("");

    const extractUsername = (input: string) => {
        const m = input.trim().match(/github\.com\/([a-zA-Z0-9_-]+)/i);
        return m ? m[1] : input.trim();
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === "application/pdf") setResumeFile(f);
    }, []);

    const handleSubmit = async () => {
        const selectedRole = role === "Custom" ? customRole : role;
        if (!selectedRole) return;
        setLoading(true);

        try {
            /* Step 1: Profile */
            setLoadMsg("Analyzing your profile…");
            const profile = await analyzeProfile(
                resumeFile,
                github ? extractUsername(github) : null
            );
            saveProfile(profile);

            /* Combine resume skills + manual skills + GitHub languages */
            const allSkills = [
                ...profile.technical_skills,
                ...profile.github_analysis.primary_languages.map((l) => l.toLowerCase()),
                ...manualSkills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
            ];
            const unique = [...new Set(allSkills)];

            /* Step 2: Role Analysis */
            setLoadMsg("Mapping your dream role…");
            const roleResult = await analyzeRole(unique, selectedRole);
            saveRole(roleResult);

            /* Save alignment history */
            const progress = loadProgress();
            progress.alignmentHistory.push({
                date: new Date().toISOString().slice(0, 10),
                score: roleResult.alignment_score,
            });
            saveProgress(progress);

            /* Step 3: Roadmap Generation (Ollama) */
            setLoadMsg("Generating your 30-day roadmap…");
            const roadmap = await generateRoadmap(roleResult.missing_skills);
            saveRoadmap(roadmap);

            router.push("/analysis");
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Make sure the backend & Ollama are running.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = (resumeFile || github.trim()) && (role !== "Custom" || customRole.trim());

    if (loading) return <LoadingScreen message={loadMsg} />;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black mb-2 text-gray-800">
                        Let&apos;s understand <span className="gradient-text">you</span>.
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Upload your resume, connect GitHub, and pick your dream career.
                    </p>
                </div>

                <div className="glass-card p-8 space-y-6">
                    {/* Resume Upload */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">📄 Resume</label>
                        <div
                            className={`upload-zone ${dragOver ? "drag-over" : ""} ${resumeFile ? "has-file" : ""}`}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => { if (e.target.files?.[0]) setResumeFile(e.target.files[0]); }}
                            />
                            <span className="text-3xl">{resumeFile ? "✅" : "📁"}</span>
                            <span className="text-sm font-medium text-gray-500">
                                {resumeFile ? resumeFile.name : "Drop your resume here or click to browse"}
                            </span>
                        </div>
                    </div>

                    {/* GitHub */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">🐙 GitHub</label>
                        <input
                            className="input-field"
                            placeholder="username or github.com/username"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                        />
                    </div>

                    {/* Manual Skills */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">
                            🧩 Additional Skills <span className="text-gray-400 font-normal">(comma separated)</span>
                        </label>
                        <input
                            className="input-field"
                            placeholder="react, docker, sql, tensorflow…"
                            value={manualSkills}
                            onChange={(e) => setManualSkills(e.target.value)}
                        />
                    </div>

                    {/* Dream Career */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">🎯 Dream Career</label>
                        <div className="flex flex-wrap gap-2">
                            {[...AVAILABLE_ROLES, "Custom" as const].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all cursor-pointer border ${role === r
                                            ? "bg-lavender/20 border-lavender text-purple-700"
                                            : "bg-white/50 border-gray-200 text-gray-500 hover:bg-white"
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        {role === "Custom" && (
                            <input
                                className="input-field mt-3"
                                placeholder="Enter your dream role…"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        className="btn-primary w-full !py-4 text-base"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        🚀 Analyze & Build My Roadmap
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
