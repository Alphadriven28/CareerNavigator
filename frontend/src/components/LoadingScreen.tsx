"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
    "Small daily improvements lead to stunning results.",
    "Growth is intentional.",
    "You build your path.",
    "Consistency compounds.",
    "The expert was once a beginner.",
    "Your only limit is your mind.",
];

function Particle({ delay }: { delay: number }) {
    const size = 4 + Math.random() * 8;
    const x = Math.random() * 100;
    const duration = 6 + Math.random() * 6;

    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                bottom: -10,
                background: `rgba(200, 182, 255, ${0.15 + Math.random() * 0.2})`,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -800, opacity: [0, 0.6, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
        />
    );
}

export default function LoadingScreen({ message }: { message?: string }) {
    const [quoteIdx, setQuoteIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIdx((i) => (i + 1) % QUOTES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "linear-gradient(170deg, #f0eaff 0%, #e6f2ff 50%, #fff8ee 100%)" }}>
            {/* Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <Particle key={i} delay={i * 0.4} />
            ))}

            {/* Spinner */}
            <motion.div
                className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-purple-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />

            {/* Message */}
            <p className="mt-6 text-sm font-semibold text-gray-500 tracking-wide">
                {message ?? "Analyzing with AI…"}
            </p>

            {/* Rotating Quote */}
            <div className="mt-4 h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={quoteIdx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35 }}
                        className="text-sm italic text-gray-400 text-center max-w-sm"
                    >
                        &ldquo;{QUOTES[quoteIdx]}&rdquo;
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
}
