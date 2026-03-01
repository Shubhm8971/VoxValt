// app/components/recorder/RecordingTimer.tsx
'use client';

interface RecordingTimerProps {
    duration: number;
    maxDuration: number;
    isPaused: boolean;
}

export default function RecordingTimer({ duration, maxDuration, isPaused }: RecordingTimerProps) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const progress = (duration / maxDuration) * 100;
    const isWarning = duration > maxDuration * 0.8;
    const isCritical = duration > maxDuration * 0.95;

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className={`font-mono text-3xl font-bold tracking-wider transition-colors duration-300
          ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : isPaused ? 'text-amber-400' : 'text-vox-text'}`}
            >
                <span>{minutes.toString().padStart(2, '0')}</span>
                <span className="animate-pulse">:</span>
                <span>{seconds.toString().padStart(2, '0')}</span>
            </div>
            <div className="w-48 h-1 bg-vox-surface rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear
            ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
            {isWarning && (
                <p className={`text-2xs font-medium animate-fade-in ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                    {Math.max(0, maxDuration - duration)}s remaining
                </p>
            )}
        </div>
    );
}