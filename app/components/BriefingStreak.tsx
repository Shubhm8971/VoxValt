'use client';

import { useEffect, useState } from 'react';
import { Flame, CheckCircle2, Circle } from 'lucide-react';

export default function BriefingStreak() {
    const [data, setData] = useState<{ streak: number; history: any[] } | null>(null);

    useEffect(() => {
        fetch('/api/user/streak')
            .then(res => res.json())
            .then(setData);
    }, []);

    if (!data) return null;

    return (
        <div className="bg-vox-card border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Flame className={`w-5 h-5 ${data.streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white leading-none">{data.streak} Day Streak</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Morning Briefings</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center gap-1">
                {[...Array(7)].map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const log = (data.history || []).find(l => l.date_ref === dateStr);

                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-medium">
                                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </span>
                            {log?.was_read ? (
                                <CheckCircle2 className={`w-6 h-6 ${log.was_listened ? 'text-brand-400' : 'text-brand-400/50'}`} />
                            ) : (
                                <Circle className="w-6 h-6 text-white/5" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}