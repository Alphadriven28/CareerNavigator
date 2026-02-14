"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        // Store a user ID locally
        if (typeof window !== "undefined") {
            const uid = email.split("@")[0] || `user_${Date.now()}`;
            localStorage.setItem("cos_user_id", uid);
        }
        router.push("/profile");
    };

    const handleGoogle = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cos_user_id", `user_${Date.now()}`);
        }
        router.push("/profile");
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(170deg, #f0eaff 0%, #e6f2ff 50%, #fff8ee 100%)" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-10 w-full max-w-md text-center"
            >
                <h1 className="text-3xl font-black mb-1">
                    Career<span className="gradient-text">OS</span>
                </h1>
                <p className="text-sm text-gray-400 mb-8 italic">
                    &ldquo;Your future self is waiting.&rdquo;
                </p>

                <form onSubmit={handleSignIn} className="space-y-4">
                    <input
                        type="email"
                        className="input-field"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary w-full">
                        Sign In →
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 uppercase">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white/70 text-sm font-medium text-gray-600 hover:bg-white transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.24 1.05-3.72 1.05-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A10.96 10.96 0 0012 23z" fill="#34A853" />
                        <path d="M5.84 14.09a6.53 6.53 0 010-4.18V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
            </motion.div>
        </div>
    );
}
