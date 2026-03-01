import React from 'react';
import { Mic, Square } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface RecordingButtonProps {
    isRecording: boolean;
    onClick: () => void;
    className?: string;
}

export const RecordingButton = ({ isRecording, onClick, className }: RecordingButtonProps) => {
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            {/* Outer Pulse Rings - Only visible when recording */}
            {isRecording && (
                <>
                    <div className="absolute inset-0 animate-recording-ring rounded-full bg-status-error/30" />
                    <div className="absolute inset-0 animate-recording-pulse rounded-full bg-status-error/20" />
                </>
            )}

            {/* Main Button Body */}
            <button
                onClick={onClick}
                className={cn(
                    "relative z-10 flex h-22 w-22 items-center justify-center rounded-full transition-all duration-slow",
                    "shadow-record hover:shadow-record-hover active:scale-90 active:shadow-record-active",
                    isRecording
                        ? "bg-status-error shadow-error/40"
                        : "bg-brand-gradient"
                )}
            >
                {isRecording ? (
                    <div className="flex items-end gap-1 px-2">
                        {/* Animated Sound Waves using config keyframes */}
                        <span className="w-1 rounded-full bg-white animate-sound-wave-1" />
                        <span className="w-1 rounded-full bg-white animate-sound-wave-2" />
                        <span className="w-1 rounded-full bg-white animate-sound-wave-3" />
                        <span className="w-1 rounded-full bg-white animate-sound-wave-4" />
                        <span className="w-1 rounded-full bg-white animate-sound-wave-5" />
                    </div>
                ) : (
                    <Mic className="h-8 w-8 text-white animate-float" />
                )}
            </button>

            {/* Status Label */}
            <div className="absolute -bottom-10 flex flex-col items-center">
                <span className={cn(
                    "text-2xs font-bold uppercase tracking-widest transition-colors",
                    isRecording ? "text-status-error animate-pulse" : "text-vox-text-muted"
                )}>
                    {isRecording ? "Live Recording" : "Tap to Record"}
                </span>
            </div>
        </div>
    );
};