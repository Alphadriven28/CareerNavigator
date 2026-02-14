import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                lavender: { DEFAULT: "#C8B6FF", light: "#E0D6FF" },
                babyblue: { DEFAULT: "#B8E0FF", light: "#D6EDFF" },
                mint: { DEFAULT: "#B5F2C3", light: "#D4F8DE" },
                coral: { DEFAULT: "#FFB3B3", light: "#FFD6D6" },
                cream: { DEFAULT: "#FFF8EE", dark: "#F5ECD9" },
                slate: { 950: "#0f0f1a" },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            boxShadow: {
                glass: "0 4px 30px rgba(0, 0, 0, 0.05)",
                glow: "0 0 20px rgba(200, 182, 255, 0.3)",
            },
            backgroundImage: {
                "hero-gradient": "linear-gradient(135deg, #C8B6FF 0%, #B8E0FF 100%)",
                "card-gradient": "linear-gradient(135deg, rgba(200,182,255,0.08) 0%, rgba(184,224,255,0.08) 100%)",
            },
            keyframes: {
                "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
                "count-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
                "pulse-soft": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
                "float": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
            },
            animation: {
                "fade-in": "fade-in 0.5s ease-out forwards",
                "count-up": "count-up 0.4s ease-out forwards",
                "pulse-soft": "pulse-soft 2s ease-in-out infinite",
                "float": "float 4s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};

export default config;
