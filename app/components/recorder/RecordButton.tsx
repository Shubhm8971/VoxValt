// app/components/recorder/RecordButton.tsx
'use client';

import { Mic, Square, Pause, Play } from 'lucide-react';
import type { RecorderStatus } from '../VoiceRecorder';

interface RecordButtonProps {
    status: RecorderStatus;
    audioLevel: number;
    onStart: () => void;
    onStop: () => void;
    disabled: boolean;
}

export default function RecordButton({
    status,
    audioLevel,
    onStart,
    onStop,
    disabled,
}: RecordButtonProps) {
    const isRecording = status === 'recording';
    const isPaused = status === 'paused';
    const isActive = isRecording || isPaused;

    const handleClick = () => {
        if (disabled) return;
        if (isActive) onStop();
        else onStart();
    };

    // Calculate dynamic styles based on audio level
    const scale = isRecording ? 1 + Math.pow(audioLevel, 1.5) * 0.15 : 1;
    const shadowOpacity = isRecording ? 0.2 + audioLevel * 0.4 : 0;
    const shadowSize = isRecording ? 15 + audioLevel * 40 : 0;

    return (
        <div className="relative flex flex-col items-center">
            {/* Outer Ripple Rings */}
            {isRecording && (
                <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping opacity-20 bg-red-500 w-full h-full" style={{ width: '140%', height: '140%' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/30 transition-all duration-75"
                        style={{
                            width: `${120 + audioLevel * 60}%`,
                            height: `${120 + audioLevel * 60}%`,
                        }}
                    />
                </>
            )}

            <button
                onClick={handleClick}
                disabled={disabled}
                className={`
                    relative z-10
                    w-20 h-20 rounded-full
                    flex items-center justify-center
                    transition-all duration-200 fill-mode-forwards
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-4 focus:ring-brand-500/20
                    ${isRecording
                        ? 'bg-rose-500 text-white'
                        : isPaused
                            ? 'bg-amber-400 text-white'
                            : status === 'requesting'
                                ? 'bg-brand-100 text-brand-500'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
                    }
                `}
                style={{
                    transform: `scale(${scale})`,
                    boxShadow: isRecording
                        ? `0 0 ${shadowSize}px rgba(244, 63, 94, ${shadowOpacity})`
                        : undefined,
                }}
                aria-label={isActive ? 'Stop recording' : 'Start recording'}
            >
                {status === 'requesting' ? (
                    <div className="w-8 h-8 rounded-full border-3 border-current border-t-transparent animate-spin" />
                ) : isRecording ? (
                    <Square className="w-8 h-8 fill-current animate-in zoom-in duration-200" />
                ) : isPaused ? (
                    <div className="flex gap-1">
                        <span className="w-3 h-8 bg-white rounded-sm" />
                        <span className="w-3 h-8 bg-white rounded-sm" />
                    </div>
                ) : (
                    <Mic className="w-9 h-9 animate-in zoom-in duration-300" />
                )}
            </button>

            {/* Status Text Label */}
            <div className="mt-4 font-medium text-sm transition-all duration-300 min-h-[1.5em] text-center">
                {status === 'requesting' && <span className="text-gray-500 animate-pulse">Connecting...</span>}
                {status === 'recording' && <span className="text-rose-500 font-semibold animate-pulse">Listening...</span>}
                {status === 'paused' && <span className="text-amber-500">Paused</span>}
                {status === 'idle' && <span className="text-gray-400">Tap to speak</span>}
            </div>
        </div>
    );
}