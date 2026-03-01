// app/components/recorder/ProcessingState.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Brain, Database, CheckCircle2 } from 'lucide-react';

const STEPS = [
    { icon: <Sparkles className="w-6 h-6" />, label: 'Transcribing your voice...', color: 'text-blue-500' },
    { icon: <Brain className="w-6 h-6" />, label: 'Extracting memories & tasks...', color: 'text-purple-500' },
    { icon: <Database className="w-6 h-6" />, label: 'Saving to your vault...', color: 'text-indigo-500' },
];

export default function ProcessingState({ compact }: { compact: boolean }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const current = STEPS[step];

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 w-full max-w-xs mx-auto">
            {/* Animated Icon Ring */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center relative z-10">
                    <div className={`transition-all duration-500 transform ${current.color} scale-110`}>
                        {current.icon}
                    </div>
                </div>

                {/* Ping rings */}
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-100 animate-ping opacity-50 animation-delay-300" />

                {/* Spinning border */}
                <div className="absolute -inset-1 rounded-full border-r-2 border-b-2 border-transparent border-indigo-500/30 animate-spin-slow" />
            </div>

            {/* Text & Progress */}
            <div className="text-center space-y-3 w-full animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 transition-all duration-300">
                    {current.label}
                </h3>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                        style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                <p className="text-xs text-gray-400 font-medium">
                    Step {step + 1} of {STEPS.length}
                </p>
            </div>
        </div>
    );
}