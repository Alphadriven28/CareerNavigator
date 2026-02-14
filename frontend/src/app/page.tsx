"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🔍", title: "Analyze", desc: "AI-powered skill extraction from your resume & GitHub profile" },
  { icon: "🗺️", title: "Build", desc: "Get a personalized 30-day roadmap tailored to your dream role" },
  { icon: "🚀", title: "Execute", desc: "Complete daily micro-tasks, earn XP, and level up your career" },
];

function FloatingNode({ x, y, size, delay, label }: { x: number; y: number; size: number; delay: number; label: string }) {
  return (
    <motion.div
      className="absolute rounded-full flex items-center justify-center text-[10px] font-medium"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: "rgba(200, 182, 255, 0.12)",
        border: "1px solid rgba(200, 182, 255, 0.25)",
        color: "#9b8ec4",
      }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {label}
    </motion.div>
  );
}

const NODES = [
  { x: 10, y: 20, size: 56, delay: 0, label: "React" },
  { x: 75, y: 15, size: 50, delay: 0.5, label: "Python" },
  { x: 85, y: 60, size: 44, delay: 1, label: "AWS" },
  { x: 15, y: 70, size: 48, delay: 1.5, label: "SQL" },
  { x: 55, y: 75, size: 42, delay: 2, label: "Docker" },
  { x: 35, y: 30, size: 38, delay: 0.8, label: "Git" },
  { x: 65, y: 40, size: 46, delay: 1.3, label: "ML" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Skill Nodes */}
      {NODES.map((n) => (
        <FloatingNode key={n.label} {...n} />
      ))}

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            Career<span className="gradient-text">OS</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Navigate your career. Build your roadmap.<br />
            Become your best version.
          </p>
          <Link href="/signin">
            <button className="btn-primary text-base px-10 py-4 !rounded-3xl">
              Start Your Journey ✨
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24 -mt-20">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass-card p-8 text-center"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-gray-700">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
