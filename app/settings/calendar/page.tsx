'use client';

import { Suspense } from 'react';
import { CalendarSettings } from '@/app/components/CalendarSettings';

export default function CalendarSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <CalendarSettings />
        </Suspense>
      </div>
    </div>
  );
}
