'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MicOff, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();

    return (
        <main className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* Animated Icon Container */}
                <div className="relative mb-8 flex justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-brand-gradient flex items-center justify-center shadow-glow animate-pulse">
                        <MicOff className="w-12 h-12 text-white" />
                    </div>
                    {/* Decorative "Lost Signal" Rings */}
                    <div className="absolute inset-0 animate-ping opacity-20">
                        <div className="w-full h-full rounded-3xl border-2 border-brand-400" />
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">
                    404
                </h1>
                <h2 className="text-xl font-bold text-vox-text mb-3">
                    Memory Not Found
                </h2>
                <p className="text-vox-text-secondary text-sm leading-relaxed mb-10">
                    It seems this part of your vault hasn't been recorded yet, or the signal was lost in the mesh. Let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-gradient text-white rounded-2xl font-bold shadow-glow hover:shadow-glow-lg active:scale-95 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center gap-2 py-3 bg-vox-surface/50 border border-white/10 text-vox-text-secondary rounded-xl text-sm font-medium hover:bg-vox-surface transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                        <Link
                            href="/search"
                            className="flex items-center justify-center gap-2 py-3 bg-vox-surface/50 border border-white/10 text-vox-text-secondary rounded-xl text-sm font-medium hover:bg-vox-surface transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </Link>
                    </div>
                </div>

                {/* Footer Branding */}
                <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-vox-text-muted font-bold">
                    VoxValt Protocol • Internal Error
                </p>
            </div>
        </main>
    );
}