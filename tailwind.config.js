/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            /* ========================================
                FONTS
               ======================================== */
            fontFamily: {
                sans: [
                    "var(--font-inter)",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
                mono: [
                    "var(--font-mono)",
                    "ui-monospace",
                    "SFMono-Regular",
                    "Menlo",
                    "Monaco",
                    "Consolas",
                    "monospace",
                ],
            },

            /* ========================================
                COLORS - VoxValt Brand System
               ======================================== */
            colors: {
                brand: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    200: "#c7d2fe",
                    300: "#a5b4fc",
                    400: "rgb(var(--color-brand-accent) / <alpha-value>)",
                    500: "rgb(var(--color-brand-primary) / <alpha-value>)",
                    600: "rgb(var(--color-brand-secondary) / <alpha-value>)",
                    700: "#4f46e5",
                    800: "#4338ca",
                    900: "#3730a3",
                    950: "#1e1b4b",
                },
                vox: {
                    bg: {
                        DEFAULT: "var(--background)",
                        secondary: "var(--background-secondary)",
                        tertiary: "#141428",
                    },
                    surface: {
                        DEFAULT: "var(--surface)",
                        hover: "var(--surface-hover)",
                        active: "#2f2f50",
                    },
                    border: {
                        DEFAULT: "var(--border)",
                        hover: "var(--border-hover)",
                        focus: "var(--input-focus)",
                    },
                    text: {
                        DEFAULT: "var(--foreground)",
                        secondary: "var(--foreground-secondary)",
                        muted: "rgba(var(--foreground-secondary), 0.6)",
                    },
                    card: {
                        DEFAULT: "var(--card-bg)",
                        hover: "#1a1a36",
                        border: "var(--card-border)",
                    },
                },
                memory: {
                    task: "rgb(var(--color-task) / <alpha-value>)",
                    promise: "rgb(var(--color-promise) / <alpha-value>)",
                    reminder: "rgb(var(--color-reminder) / <alpha-value>)",
                    idea: "rgb(var(--color-idea) / <alpha-value>)",
                    memo: "rgb(var(--color-memo) / <alpha-value>)",
                },
                status: {
                    success: "rgb(var(--color-success) / <alpha-value>)",
                    warning: "rgb(var(--color-warning) / <alpha-value>)",
                    error: "rgb(var(--color-error) / <alpha-value>)",
                    info: "rgb(var(--color-info) / <alpha-value>)",
                },
            },

            /* ========================================
                ANIMATIONS & KEYFRAMES
               ======================================== */
            animation: {
                // Brand & Mesh
                "mesh-slow": "mesh 15s ease-in-out infinite",
                "spin-slow": "spin 8s linear infinite",
                "float": "float 3s ease-in-out infinite",

                // Entrances
                "fade-in": "fadeIn 0.3s ease-out forwards",
                "fade-in-up": "fadeInUp 0.4s ease-out forwards",
                "scale-in": "scaleIn 0.2s ease-out forwards",

                // Recording State
                "recording-pulse": "recordingPulse 1.5s ease-in-out infinite",
                "recording-ring": "recordingRing 2s ease-in-out infinite",
                "sound-wave-1": "soundWave 0.8s ease-in-out infinite",
                "sound-wave-2": "soundWave 0.8s ease-in-out 0.1s infinite",
                "sound-wave-3": "soundWave 0.8s ease-in-out 0.2s infinite",
                "sound-wave-4": "soundWave 0.8s ease-in-out 0.3s infinite",
                "sound-wave-5": "soundWave 0.8s ease-in-out 0.4s infinite",

                // Micro-interactions
                "press": "press 0.15s ease-out",
                "wiggle": "wiggle 0.5s ease-in-out",
            },

            keyframes: {
                mesh: {
                    "0%, 100%": { backgroundPosition: "0% 0%" },
                    "50%": { backgroundPosition: "100% 100%" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(12px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.9)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                recordingPulse: {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.7)" },
                    "50%": { boxShadow: "0 0 0 24px rgba(239, 68, 68, 0)" },
                },
                recordingRing: {
                    "0%": { transform: "scale(1)", opacity: "1" },
                    "100%": { transform: "scale(1.8)", opacity: "0" },
                },
                soundWave: {
                    "0%, 100%": { height: "4px" },
                    "50%": { height: "24px" },
                },
                press: {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(0.95)" },
                },
            },

            /* ========================================
                SPACING & BOX SHADOWS
               ======================================== */
            spacing: {
                "safe-t": "env(safe-area-inset-top, 0px)",
                "safe-b": "env(safe-area-inset-bottom, 0px)",
                header: "64px",
                "record-btn": "72px",
                "record-btn-lg": "96px",
                4.5: "1.125rem",
                22: "5.5rem",
            },
            boxShadow: {
                glow: "0 0 20px rgba(var(--color-brand-primary), 0.3)",
                "glow-lg": "0 0 40px rgba(var(--color-brand-primary), 0.4)",
                record: "0 4px 24px rgba(var(--color-brand-primary), 0.4)",
                sheet: "0 -4px 32px rgba(0, 0, 0, 0.4)",
            },
            backgroundImage: {
                "brand-gradient": "linear-gradient(135deg, rgb(var(--color-brand-primary)) 0%, rgb(var(--color-brand-secondary)) 100%)",
                "mesh-gradient": `
          radial-gradient(at 20% 30%, rgba(var(--color-brand-primary), 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 10%, rgba(var(--color-brand-secondary), 0.1) 0px, transparent 50%),
          radial-gradient(at 50% 80%, rgba(var(--color-brand-primary), 0.08) 0px, transparent 50%),
          radial-gradient(at 10% 80%, rgba(var(--color-brand-secondary), 0.1) 0px, transparent 50%)
        `,
            },
            zIndex: {
                sticky: "1020",
                fixed: "1030",
                modal: "1050",
                toast: "1080",
            },
        },
    },
    plugins: [],
};