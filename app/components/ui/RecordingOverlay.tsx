import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have the cn helper

export const RecordingOverlay = ({ isActive }: { isActive: boolean }) => {
    return (
        <div
            className={cn(
                "fixed inset-0 z-0 transition-all duration-slower pointer-events-none overflow-hidden",
                isActive
                    ? "opacity-100 bg-vox-bg/80 backdrop-blur-3xl"
                    : "opacity-0 backdrop-blur-none"
            )}
        >
            {/* Mesh Gradient Background */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-slower",
                isActive ? "opacity-100 animate-pulse" : "opacity-0",
                "bg-mesh-gradient"
            )} />

            {/* Screen-wide Waveform Container */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center gap-2 px-4 transition-transform duration-700",
                isActive ? "scale-100 opacity-100" : "scale-110 opacity-0"
            )}>
                {/* We generate a sequence of bars with varying heights and animation delays */}
                {[...Array(24)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-1.5 rounded-full bg-brand-gradient opacity-30",
                            // Randomizing animation selection for a natural look
                            i % 3 === 0 ? "animate-sound-wave-1" :
                                i % 3 === 1 ? "animate-sound-wave-3" : "animate-sound-wave-5"
                        )}
                        style={{
                            height: `${Math.floor(Math.random() * 40) + 20}%`,
                            animationDelay: `${i * 0.05}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};