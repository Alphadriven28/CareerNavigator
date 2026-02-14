"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { loadProgress } from "@/lib/storage";
import type { UserProgress } from "@/lib/types";

export default function TrajectoryPage() {
    const router = useRouter();
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(loadProgress());
    }, []);

    if (!progress) return null;

    const xpData = progress.xpHistory.length > 0
        ? progress.xpHistory
        : [{ date: new Date().toISOString().slice(0, 10), xp: progress.xp }];

    const alignData = progress.alignmentHistory.length > 0
        ? progress.alignmentHistory
        : [{ date: new Date().toISOString().slice(0, 10), score: 0 }];

    const execData = xpData.map((d) => ({
        date: d.date,
        score: progress.execution_score,
    }));

    const chartStyle = {
        borderRadius: 12,
        border: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        fontSize: 11,
    };

    return (
        <div className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black">
                        Your <span className="gradient-text">Trajectory</span>
                    </h1>
                    <button className="btn-secondary text-xs" onClick={() => router.push("/dashboard")}>
                        ← Dashboard
                    </button>
                </div>

                {/* XP Growth */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="font-bold text-sm mb-4 text-gray-600">✨ XP Growth Over Time</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={xpData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,182,255,0.15)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#999" }} />
                            <Tooltip contentStyle={chartStyle} />
                            <Line
                                type="monotone"
                                dataKey="xp"
                                stroke="#C8B6FF"
                                strokeWidth={3}
                                dot={{ fill: "#C8B6FF", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Execution Score */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="font-bold text-sm mb-4 text-gray-600">🎯 Execution Score Trend</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={execData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,242,195,0.15)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#999" }} domain={[0, 100]} />
                            <Tooltip contentStyle={chartStyle} />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#B5F2C3"
                                strokeWidth={3}
                                dot={{ fill: "#B5F2C3", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Alignment Progress */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="font-bold text-sm mb-4 text-gray-600">📊 Role Alignment Progress</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={alignData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,224,255,0.15)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#999" }} domain={[0, 100]} />
                            <Tooltip contentStyle={chartStyle} />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#B8E0FF"
                                strokeWidth={3}
                                dot={{ fill: "#B8E0FF", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total XP", value: progress.xp, color: "text-purple-600" },
                        { label: "Level", value: progress.level, color: "gradient-text" },
                        { label: "Rank", value: progress.rank, color: "text-amber-600" },
                        { label: "Streak", value: `${progress.streak} 🔥`, color: "text-coral" },
                    ].map((s) => (
                        <div key={s.label} className="glass-card p-5 text-center">
                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
