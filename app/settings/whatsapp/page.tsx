'use client';

import { Suspense } from 'react';
import { WhatsAppSettings } from '@/app/components/WhatsAppSettings';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WhatsAppSettingsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] selection:bg-purple-500/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link
                    href="/settings/calendar"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Settings</span>
                </Link>

                <Suspense fallback={
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                }>
                    <WhatsAppSettings />
                </Suspense>

                <div className="mt-8 p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                    <p className="text-xs text-yellow-500/80 leading-relaxed">
                        <span className="font-bold">Note:</span> WhatsApp integration is currently available via the Twilio Sandbox. Instructions on how to join the sandbox are provided after you link your number.
                    </p>
                </div>
            </div>
        </div>
    );
}
