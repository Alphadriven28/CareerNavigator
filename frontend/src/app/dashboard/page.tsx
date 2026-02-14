"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import XPBar from "@/components/XPBar";
import { loadRole, loadRoadmap, loadProgress, saveProgress } from "@/lib/storage";
import { submitTask } from "@/lib/api";
import type { AnalyzeRoleResponse, GenerateRoadmapResponse, UserProgress, WeekPlan } from "@/lib/types";

/* ── Roadmap Week Modal ── */
function WeekModal({ week, onClose }: { week: WeekPlan; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Week {week.week}: {week.focus_skill}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
                </div>
                <div className="space-y-3">
                    {week.days.map((d) => (
                        <div key={d.day} className="p-3 rounded-2xl bg-white/50 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-lavender bg-lavender/10 px-2 py-0.5 rounded-full">
                                    Day {d.day}
                                </span>
                                <span className="text-sm font-semibold text-gray-700">{d.task}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{d.description}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

/* ── Calendar Heatmap ── */
function CalendarHeatmap({ completedTasks, xpHistory }: { completedTasks: string[]; xpHistory: { date: string; xp: number }[] }) {
    const days = useMemo(() => {
        const arr = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const count = completedTasks.filter((t) => t.startsWith(key)).length;
            const xpEntry = xpHistory.find((h) => h.date === key);
            arr.push({ date: key, count, xp: xpEntry?.xp ?? 0 });
        }
        return arr;
    }, [completedTasks, xpHistory]);

    return (
        <div className="glass-card p-6">
            <h3 className="font-bold text-sm mb-4 text-gray-600">📅 Activity Calendar</h3>
            <div className="grid grid-cols-10 gap-1.5">
                {days.map((d) => (
                    <div
                        key={d.date}
                        title={`${d.date} — ${d.count} task(s), ${d.xp} XP`}
                        className="aspect-square rounded-md cursor-default transition-colors"
                        style={{
                            background: d.count === 0
                                ? "rgba(200,182,255,0.08)"
                                : d.count === 1
                                    ? "rgba(181,242,195,0.4)"
                                    : "rgba(181,242,195,0.7)",
                            border: `1px solid ${d.count > 0 ? "rgba(181,242,195,0.6)" : "rgba(200,182,255,0.15)"}`,
                        }}
                    />
                ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Last 30 days — hover for detail</p>
        </div>
    );
}

/* ── Dashboard ── */
export default function DashboardPage() {
    const router = useRouter();
    const [role, setRole] = useState<AnalyzeRoleResponse | null>(null);
    const [roadmap, setRoadmap] = useState<GenerateRoadmapResponse | null>(null);
    const [progress, setProgress] = useState<UserProgress>(loadProgress());
    const [modalWeek, setModalWeek] = useState<WeekPlan | null>(null);
    const [taskText, setTaskText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [xpGain, setXpGain] = useState<number | null>(null);

    useEffect(() => {
        setRole(loadRole());
        setRoadmap(loadRoadmap());
    }, []);

    if (!roadmap || !role) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Complete your profile first.</p>
                    <button className="btn-primary" onClick={() => router.push("/profile")}>← Set Up Profile</button>
                </div>
            </div>
        );
    }

    /* Derive today's task from roadmap */
    const todayTask = (() => {
        for (const week of roadmap.roadmap) {
            for (const day of week.days) {
                const key = `${week.week}-${day.day}`;
                if (!progress.completedTasks.includes(key)) {
                    return { week, day, key };
                }
            }
        }
        return null;
    })();

    const handleSubmitTask = async () => {
        if (!taskText.trim() || !todayTask) return;
        setSubmitting(true);
        try {
            const res = await submitTask(progress.user_id, taskText);
            const oldXp = progress.xp;
            const updated: UserProgress = {
                ...progress,
                xp: res.xp,
                level: res.level,
                rank: res.rank,
                streak: res.streak,
                execution_score: res.execution_score,
                completedTasks: [...progress.completedTasks, todayTask.key],
                xpHistory: [
                    ...progress.xpHistory,
                    { date: new Date().toISOString().slice(0, 10), xp: res.xp },
                ],
            };
            saveProgress(updated);
            setProgress(updated);
            setXpGain(res.xp - oldXp);
            setTaskText("");
            setTimeout(() => setXpGain(null), 3000);
        } catch (err) {
            console.error(err);
            alert("Submission failed — check backend.");
        } finally {
            setSubmitting(false);
        }
    };

    const completedCount = progress.completedTasks.length;
    const totalTasks = roadmap.roadmap.reduce((s, w) => s + w.days.length, 0);

    return (
        <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
            {/* XP Bar */}
            <XPBar progress={progress} />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-gray-800">
                    Your <span className="gradient-text">Dashboard</span>
                </h1>
                <div className="flex gap-2">
                    <button className="btn-secondary text-xs" onClick={() => router.push("/insights")}>
                        🤖 AI Insights
                    </button>
                    <button className="btn-secondary text-xs" onClick={() => router.push("/trajectory")}>
                        📈 View Trajectory
                    </button>
                </div>
            </div>

            {/* XP Gain Animation */}
            <AnimatePresence>
                {xpGain !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-50 bg-mint/90 text-green-800 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg"
                    >
                        +{xpGain} XP 🎉
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Skill Gap Visualization */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">🎯 Skill Gap Progress</h3>
                        <div className="space-y-3">
                            {role.missing_skills.slice(0, 6).map((ms) => {
                                const completedForSkill = progress.completedTasks.filter((t) => {
                                    const wIdx = parseInt(t.split("-")[0]);
                                    return roadmap.roadmap.find((w) => w.week === wIdx)?.focus_skill.toLowerCase() === ms.skill.toLowerCase();
                                }).length;
                                const totalForSkill = roadmap.roadmap.find((w) => w.focus_skill.toLowerCase() === ms.skill.toLowerCase())?.days.length ?? 7;
                                const pct = Math.min((completedForSkill / totalForSkill) * 100, 100);

                                return (
                                    <div key={ms.skill}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-600">{ms.skill}</span>
                                            <span className="text-gray-400">{Math.round(pct)}%</span>
                                        </div>
                                        <div className="progress-track">
                                            <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Roadmap Preview */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">📋 4-Week Roadmap</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {roadmap.roadmap.map((week) => {
                                const completedInWeek = progress.completedTasks.filter((t) => t.startsWith(`${week.week}-`)).length;
                                return (
                                    <button
                                        key={week.week}
                                        onClick={() => setModalWeek(week)}
                                        className="text-left p-4 rounded-2xl bg-white/50 border border-gray-100 hover:border-lavender/40 hover:bg-white/80 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-lavender bg-lavender/10 px-2 py-0.5 rounded-full">
                                                Week {week.week}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {completedInWeek}/{week.days.length} done
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">{week.focus_skill}</p>
                                        <p className="text-xs text-gray-400 mt-1">Importance: {week.importance}/10</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resource Bar */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-4 text-gray-600">📚 Suggested Resources & Projects</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                            {role.missing_skills.filter((ms) => ms.recommended_project).map((ms) => (
                                <div
                                    key={ms.skill}
                                    className="flex-shrink-0 w-56 p-4 rounded-2xl bg-white/60 border border-gray-100"
                                >
                                    <div className="text-xs font-bold text-lavender mb-1">{ms.skill}</div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">{ms.recommended_project?.title}</p>
                                    <p className="text-xs text-gray-500 mb-2">{ms.recommended_project?.description}</p>
                                    {ms.learning_resources?.slice(0, 2).map((r, i) => (
                                        <div key={i} className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <span className="text-lavender">●</span> {r}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* Eat The Frog */}
                    <div className="glass-card p-6 border-lavender/20">
                        <h3 className="font-bold text-sm mb-1 text-gray-600">🐸 Eat The Frog</h3>
                        <p className="text-[11px] text-gray-400 mb-4">Today&apos;s micro-task</p>

                        {todayTask ? (
                            <>
                                <div className="p-3 rounded-2xl bg-lavender/5 border border-lavender/15 mb-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="chip chip-lavender text-[10px]">Day {todayTask.day.day}</span>
                                        <span className="text-xs text-gray-400">{todayTask.week.focus_skill}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">{todayTask.day.task}</p>
                                    <p className="text-xs text-gray-500 mt-1">{todayTask.day.description}</p>
                                </div>

                                <textarea
                                    className="input-field !rounded-2xl text-xs min-h-[80px] resize-none"
                                    placeholder="Write your submission here…"
                                    value={taskText}
                                    onChange={(e) => setTaskText(e.target.value)}
                                />
                                <button
                                    className="btn-primary w-full mt-3 text-xs"
                                    onClick={handleSubmitTask}
                                    disabled={submitting || !taskText.trim()}
                                >
                                    {submitting ? <span className="spinner" /> : "Submit & Earn XP ✨"}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <span className="text-3xl">🎉</span>
                                <p className="text-sm text-gray-500 mt-2">All tasks completed!</p>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-sm mb-3 text-gray-600">📊 Progress</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-2xl bg-lavender/5">
                                <p className="text-2xl font-black gradient-text">{completedCount}</p>
                                <p className="text-[10px] text-gray-400">Tasks Done</p>
                            </div>
                            <div className="text-center p-3 rounded-2xl bg-mint/10">
                                <p className="text-2xl font-black text-green-600">{totalTasks}</p>
                                <p className="text-[10px] text-gray-400">Total Tasks</p>
                            </div>
                            <div className="text-center p-3 rounded-2xl bg-babyblue/10">
                                <p className="text-2xl font-black text-blue-500">{Math.round(progress.execution_score)}%</p>
                                <p className="text-[10px] text-gray-400">Execution</p>
                            </div>
                            <div className="text-center p-3 rounded-2xl bg-coral/10">
                                <p className="text-2xl font-black text-coral">{progress.streak}</p>
                                <p className="text-[10px] text-gray-400">Streak 🔥</p>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <CalendarHeatmap completedTasks={progress.completedTasks} xpHistory={progress.xpHistory} />
                </div>
            </div>

            {/* Week Modal */}
            <AnimatePresence>
                {modalWeek && <WeekModal week={modalWeek} onClose={() => setModalWeek(null)} />}
            </AnimatePresence>
        </div>
    );
}
