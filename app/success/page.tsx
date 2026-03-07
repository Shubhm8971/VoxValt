'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Disable static pre-rendering

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('No session found');
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth');
          return;
        }

        // Give webhook time to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if subscription was created
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_id, status, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (subscription) {
          setLoading(false);
        } else {
          setError('Subscription not found. Please contact support.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setError('Error verifying subscription');
        setLoading(false);
      }
    };

    verifySubscription();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Premium!
        </h1>
        <p className="text-gray-600 mb-6">
          Your subscription is now active. You have access to all premium features.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
