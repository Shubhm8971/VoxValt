'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Calendar, FileText, CheckSquare, Loader2 } from 'lucide-react';

interface IntegrationData {
  provider: string;
  connected: boolean;
  settings?: any;
}

function IntegrationsSettingsContent() {
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const providers = [
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync reminders and events directly to your calendar.',
      icon: <Calendar className="w-5 h-5" />,
      colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      authUrl: '/api/integrations/google/auth'
    },
    {
      id: 'todoist',
      name: 'Todoist',
      description: 'Send actionable tasks to your Todoist Inbox.',
      icon: <CheckSquare className="w-5 h-5" />,
      colorClass: 'text-red-500 bg-red-500/10 border-red-500/20',
      authUrl: '/api/integrations/todoist/auth'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Save memos and extracted tasks to a Notion database.',
      icon: <FileText className="w-5 h-5" />,
      colorClass: 'text-slate-200 bg-slate-500/10 border-slate-500/20',
      authUrl: '/api/integrations/notion/auth'
    }
  ];

  useEffect(() => {
    fetchIntegrations();

    // Check for success/error from OAuth redirect
    const success = searchParams.get('integration_success');
    const error = searchParams.get('error');

    if (success || error) {
      // Clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('integration_success');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
      
      if (success) fetchIntegrations();
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_integrations')
        .select('provider, settings')
        .eq('user_id', userId);

      if (!error && data) {
        setIntegrations(data.map(d => ({
            provider: d.provider,
            connected: true,
            settings: d.settings
        })));
      }
    } catch (err) {
      console.error('Failed to fetch integrations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (providerUrl: string) => {
    // Save current URL to return exactly here
    const returnUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `${providerUrl}?returnUrl=${returnUrl}`;
  };

  const handleDisconnect = async (providerId: string) => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', userId)
        .eq('provider', providerId);

      if (!error) {
        setIntegrations(prev => prev.filter(i => i.provider !== providerId));
      }
    } catch (err) {
      console.error('Failed to disconnect integration', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {providers.map(provider => {
        const isConnected = integrations.some(i => i.provider === provider.id);
        
        return (
          <div key={provider.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:border-white/20">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${provider.colorClass}`}>
                {provider.icon}
              </div>
              <div>
                <h3 className="text-white font-medium">{provider.name}</h3>
                <p className="text-sm text-white/50 mt-0.5">{provider.description}</p>
                {isConnected && provider.id === 'notion' && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Requires default database setup in Notion
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => isConnected ? handleDisconnect(provider.id) : handleConnect(provider.authUrl)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isConnected 
                  ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' 
                  : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function IntegrationsSettings() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse bg-slate-900/50 rounded-xl border border-white/5"></div>}>
       <IntegrationsSettingsContent />
    </Suspense>
  );
}
