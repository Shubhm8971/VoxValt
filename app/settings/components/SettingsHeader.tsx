// app/settings/components/SettingsHeader.tsx
'use client';

interface SettingsHeaderProps {
    onBack: () => void;
}

export default function SettingsHeader({ onBack }: SettingsHeaderProps) {
    return (
        <header className="sticky top-0 z-sticky bg-vox-bg/80 backdrop-blur-xl border-b border-vox-border pt-safe">
            <div className="px-4 sm:px-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 h-14">
                    <button
                        onClick={onBack}
                        className="
              w-10 h-10 rounded-xl
              flex items-center justify-center
              hover:bg-vox-surface active:scale-95
              transition-all duration-200
            "
                        aria-label="Go back"
                    >
                        <svg
                            className="w-5 h-5 text-vox-text-secondary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <h1 className="text-lg font-semibold text-vox-text">Settings</h1>
                </div>
            </div>
        </header>
    );
}