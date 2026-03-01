'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase'; // Client-side supabase

export function CalendarSettings({ userId }: { userId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    checkConnection();

    // Handle URL params for success/error
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'calendar_connected') {
      // Clear params
      router.replace('/settings');
    }
  }, [userId, searchParams]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('google_calendar_token')
        .eq('id', userId)
        .single();

      if (data?.google_calendar_token) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Failed to check calendar connection', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ google_calendar_token: null })
        .eq('id', userId);

      if (error) throw error;
      setIsConnected(false);
    } catch (err) {
      console.error('Failed to disconnect', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-20 animate-pulse bg-gray-100 rounded-xl"></div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Google Calendar</h3>
            <p className="text-sm text-gray-500">
              {isConnected
                ? 'Your calendar is connected. Tasks can be synced.'
                : 'Connect to sync tasks and reminders automatically.'}
            </p>
          </div>
        </div>

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isConnected
              ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
