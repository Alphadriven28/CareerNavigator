"use client";

import { motion } from "framer-motion";
import type { UserProgress } from "@/lib/types";

const rankColors: Record<string, string> = {
    Bronze: "bg-amber-100 text-amber-700 border-amber-300",
    Silver: "bg-gray-100 text-gray-600 border-gray-300",
    Gold: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Platinum: "bg-purple-100 text-purple-700 border-purple-300",
    unranked: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function XPBar({ progress }: { progress: UserProgress }) {
    const xpInLevel = progress.xp % 100;
    const xpNeeded = 100;

    return (
        <div className="w-full glass-card px-6 py-3 flex items-center gap-5 !rounded-2xl mb-6">
            {/* Level */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lvl</span>
                <motion.span
                    key={progress.level}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl font-black gradient-text"
                >
                    {progress.level}
                </motion.span>
            </div>

            {/* XP Progress */}
            <div className="flex-1">
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">
                        {xpInLevel} / {xpNeeded} XP
                    </span>
                    <motion.span
                        key={progress.xp}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-xs font-bold text-lavender"
                    >
                        {progress.xp} total
                    </motion.span>
                </div>
                <div className="progress-track">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(xpInLevel / xpNeeded) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Rank Badge */}
            <span className={`chip border ${rankColors[progress.rank] ?? rankColors.unranked}`}>
                {progress.rank}
            </span>

            {/* Streak */}
            <div className="flex items-center gap-1.5">
                <span className="text-base">🔥</span>
                <motion.span
                    key={progress.streak}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-bold text-coral"
                >
                    {progress.streak}
                </motion.span>
            </div>
        </div>
    );
}
