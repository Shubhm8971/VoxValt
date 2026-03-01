// app/components/recorder/RecordingVisualizer.tsx
'use client';

import { useMemo } from 'react';

interface RecordingVisualizerProps {
    waveformData: number[];
    audioLevel: number;
    isRecording: boolean;
    isPaused: boolean;
    compact: boolean;
}

export default function RecordingVisualizer({
    waveformData,
    audioLevel,
    isRecording,
    isPaused,
    compact,
}: RecordingVisualizerProps) {
    const barCount = compact ? 24 : 40;
    const maxHeight = compact ? 48 : 96; // Taller for more impact
    const minHeight = 4;

    // Use a more organic distribution for idle state
    const bars = useMemo(() => {
        // Ensure we always have enough data points, pad with zeros if needed
        const data = [...waveformData, ...new Array(barCount).fill(0)].slice(0, barCount);

        return data.map((value, index) => {
            if (!isRecording && !isPaused) {
                // Gentle breathing animation when idle
                const time = Date.now() / 2000;
                const offset = index / barCount * Math.PI * 2;
                return (Math.sin(time + offset) * 0.15 + 0.2) * (0.5 + Math.random() * 0.1);
            }
            if (isPaused) {
                // Flat line with slight noise
                return 0.1 + Math.random() * 0.05;
            }
            // Smooth out the raw data slightly
            return Math.max(0.05, value);
        });
    }, [waveformData, isRecording, isPaused, barCount]);

    return (
        <div
            className="flex items-center justify-center gap-[3px] w-full h-full px-4"
            role="img"
            aria-label={isRecording ? 'Audio waveform - recording' : isPaused ? 'Paused' : 'Ready to record'}
        >
            {bars.map((value, index) => {
                // Calculate height with a non-linear curve for more dynamic feel
                const height = Math.max(minHeight, Math.pow(value, 0.8) * maxHeight);

                // Dynamic coloration based on intensity and position
                let bgClass = 'bg-gray-300';

                if (isRecording) {
                    if (value > 0.8) bgClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
                    else if (value > 0.5) bgClass = 'bg-rose-400';
                    else if (value > 0.2) bgClass = 'bg-indigo-400';
                    else bgClass = 'bg-indigo-300/80';
                } else if (isPaused) {
                    bgClass = 'bg-amber-400/50';
                } else {
                    // Idle state gradient
                    const centerDist = Math.abs(index - barCount / 2) / (barCount / 2);
                    bgClass = centerDist < 0.5 ? 'bg-indigo-400/40' : 'bg-indigo-300/30';
                }

                return (
                    <div
                        key={index}
                        className="flex flex-col items-center justify-center h-full transition-all duration-75"
                        style={{
                            width: compact ? '4px' : '6px',
                        }}
                    >
                        <div
                            className={`w-full rounded-full transition-all duration-100 ${bgClass}`}
                            style={{
                                height: `${height}px`,
                                opacity: isPaused ? 0.6 : 1,
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}