'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import VoiceRecorder from './components/VoiceRecorder';
import { useTheme } from 'next-themes';
import { Dashboard } from './components/Dashboard';
// import { TeamManager } from './components/TeamManager'; // Temporarily disabled for build
// import { TeamActivityFeed } from './components/TeamActivityFeed'; // Temporarily disabled for build
import { MemoryArchive } from './components/MemoryArchive';
import { ExtractedTasksList } from './components/ExtractedTasksList';
import { saveTasksToDatabase } from '@/lib/client-save';
import { extractDateFromText } from '@/lib/date-extractor';
import { extractTasksFromTranscription } from '@/lib/ai-extract';
import { useWindowSize, breakpoints } from '@/lib/use-responsive';
import { useSWEvent } from '@/lib/use-sw-events';
import { SW_EVENTS } from './components/ServiceWorkerInitializer';
import { Task } from '@/types';
import { VoiceReport } from './components/VoiceReport';

// New Integrated Components
import MorningBriefing from './components/MorningBriefing';
import BriefingStreak from './components/BriefingStreak';

// ============================================
// Types
// ============================================
type ActiveTab = 'record' | 'dashboard' | 'teams' | 'archive';

// ============================================
// Main Page Component
// ============================================
export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < breakpoints.tablet;

  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const [showRecorder, setShowRecorder] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);


  // ============================================
  // Bypass authentication for demo mode
  // ============================================
  useEffect(() => {
    if (!loading) {
      // Skip authentication check for demo
      console.log('VoxValt running in demo mode - no auth required');
    }
  }, [loading]);

  // ============================================
  // Handle URL actions (from PWA shortcuts / Notifications)
  // ============================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'record') {
      setActiveTab('record');
      setShowRecorder(true);
      window.history.replaceState({}, '', '/');
    }

    // Note: The MorningBriefing component handles the 'showBriefing' param internally
  }, []);

  // ============================================
  // Listen for SW events
  // ============================================
  useSWEvent(SW_EVENTS.MEMORY_COMPLETED, () => {
    setDashboardKey(prev => prev + 1);
  });

  useSWEvent('voxvalt:url-action', (detail: any) => {
    if (detail.action === 'record') {
      setActiveTab('record');
      setShowRecorder(true);
    }
  });

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <main className="min-h-screen-dvh bg-vox-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow animate-pulse">
              <span className="text-3xl">🎙️</span>
            </div>
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-400" />
            </div>
          </div>
          <p className="text-sm text-vox-text-secondary">Loading VoxValt...</p>
        </div>
      </main>
    );
  }

  // If there's no authenticated user, fall back to demo mode instead of rendering nothing.
  // We still allow the page to render; various components will use a dummy userId.
  // (The console log earlier already notes demo mode.)
  // if (!user) return null;

  const userId = user?.id || 'demo';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const userEmail = user?.email || user?.phone || '';
  const userAvatar = user?.user_metadata?.avatar_url || null;
  const userInitials = userName.substring(0, 2).toUpperCase();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Good morning';
    if (hour < 17) return '🌤️ Good afternoon';
    if (hour < 21) return '🌙 Good evening';
    return '🌙 Good night';
  };

  const handleTasksExtracted = (tasks: Task[]) => {
    if (tasks.length > 0) {
      setExtractedTasks(tasks);
      setDashboardKey(prev => prev + 1);
      // Keep on record tab to show extracted tasks
      // setTimeout(() => setActiveTab('dashboard'), 500);
    }
  };

  const handleSaveTasks = async () => {
    if (extractedTasks.length === 0) return;
    
    const result = await saveTasksToDatabase({
      userId,
      tasks: extractedTasks,
      sessionToken: user?.id
    });

    if (result.success) {
      console.log('[Home] Tasks saved:', result.message);
      // Clear tasks after saving
      setTimeout(() => setExtractedTasks([]), 2000);
    } else {
      console.error('[Home] Failed to save tasks:', result.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/landing');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const { theme, setTheme } = useTheme();

  const handleSettingsAction = (action: string, value: string) => {
    console.log('[Home] Settings Action:', action, value);

    if (action === 'theme_toggle') {
      if (value === 'dark' || value === 'light') {
        setTheme(value);
      } else {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    } else if (action === 'navigate') {
      if (value === 'dashboard') setActiveTab('dashboard');
      if (value === 'settings') router.push('/settings');
      if (value === 'team') setActiveTab('teams');
      if (value === 'search') router.push('/search');
    } else if (action === 'notification_toggle') {
      // This would require a global notification state or ref to NotificationSettings
      // For now, let's just show a toast or log
      console.log('Voice notification toggle:', value);
    }
  };

  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'record', label: 'Record', icon: '🎙️' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'teams', label: 'Teams', icon: '👥' },
    { key: 'archive', label: 'Archive', icon: '🗄️' },
  ];

  return (
    <main className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient">

      {/* 1. Global Morning Briefing Logic (Fixed Position) */}

      {/* Header */}
      <header className="sticky top-0 z-sticky bg-vox-bg/80 backdrop-blur-xl border-b border-vox-border pt-safe">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <span className="text-lg">🎙️</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-vox-text truncate">
                  {getGreeting()}, {userName}
                  {!user && (
                    <span className="ml-2 text-2xs text-vox-text-muted">(demo)</span>
                  )}
                </h1>
                <p className="text-2xs text-vox-text-muted truncate">VoxValt • Memory Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push('/search')}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-vox-surface active:scale-95 transition-all"
                aria-label="Search memories"
              >
                <svg className="w-[18px] h-[18px] text-vox-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-brand-500/30 active:scale-95 transition-all"
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{userInitials}</span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 py-2 glass-card rounded-2xl shadow-elevated animate-scale-in origin-top-right">
                      <div className="px-4 py-3 border-b border-vox-border">
                        <p className="text-sm font-semibold text-vox-text truncate">{user?.user_metadata?.full_name || userName}</p>
                        <p className="text-xs text-vox-text-muted truncate">{userEmail}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-vox-text-secondary hover:bg-vox-surface">
                          <span className="text-base">⚙️</span> Settings
                        </button>
                        <div className="my-1 mx-4 h-px bg-vox-border" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                          <span className="text-base">🚪</span> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">

        {/* 2. Streak Analytics (Always visible at the top of the content) */}
        <div className="mb-6">
          <BriefingStreak />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${activeTab === tab.key
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-glow-sm'
                : 'bg-vox-surface/50 text-vox-text-secondary hover:bg-vox-surface border border-transparent'
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="pb-8 pb-safe page-transition">
          {activeTab === 'record' ? (
            <div className="animate-fade-in-up">
              <VoiceRecorder 
                userId={userId}
                onTasksExtracted={handleTasksExtracted}
                compact={isMobile}
              />
              
              {/* Quick Test Button */}
              <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
                <div className="bg-vox-surface/50 rounded-xl p-4 border border-vox-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-vox-text">Quick Task Test</h3>
                    <span className="text-xs text-vox-text-secondary">Bypass microphone issues</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="quickTestInput"
                      type="text"
                      placeholder="Call Mom tomorrow at 5pm"
                      className="flex-1 px-3 py-2 bg-vox-surface border border-vox-border rounded-lg text-vox-text placeholder-vox-text-secondary focus:outline-none focus:border-brand-500"
                      defaultValue="Call Mom tomorrow at 5pm"
                    />
                    <button
                      onClick={async () => {
                        console.log('[QUICK TEST] Button clicked');
                        const input = document.getElementById('quickTestInput') as HTMLInputElement;
                        const testText = input.value.trim();
                        if (testText) {
                          console.log('[QUICK TEST] Processing:', testText);
                          
                          // Use real extraction logic
                          const extractedResult = await extractTasksFromTranscription(testText);
                          console.log('[QUICK TEST] Extraction result:', extractedResult);
                          
                          if (extractedResult.tasks.length > 0) {
                            // Apply date extraction to each item
                            const tasksWithDates = extractedResult.tasks.map((item: any) => {
                              const dateExtraction = extractDateFromText(item.title);
                              return {
                                id: 'test-' + Date.now() + '-' + Math.random(),
                                title: item.title,
                                description: item.description,
                                type: item.type as 'task' | 'reminder' | 'promise' | 'recurring',
                                due_date: dateExtraction.date,
                                people_involved: item.people_involved || [],
                                context: item.context || testText,
                                user_id: userId,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                status: 'pending' as const,
                                priority: 'medium' as const,
                                tags: [],
                                metadata: {}
                              };
                            });
                            
                            setExtractedTasks(tasksWithDates);
                            console.log('[QUICK TEST] Tasks created:', tasksWithDates);
                            alert(`Successfully extracted ${tasksWithDates.length} task(s)!`);
                            console.log('[QUICK TEST] Tasks created:', tasksWithDates);
                            console.log('[QUICK TEST] extractedTasks state will be updated');
                            setExtractedTasks(tasksWithDates);
                            console.log('[QUICK TEST] extractedTasks state updated');
                          } else {
                            console.log('[QUICK TEST] No tasks extracted');
                            alert('No tasks could be extracted from the text. Try something like "Call Mom tomorrow at 5pm"');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
                    >
                      Test Extraction
                    </button>
                  </div>
                </div>
              </div>

              {/* Simple Debug Display */}
              {extractedTasks.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-green-400 mb-2">Extracted Tasks ({extractedTasks.length})</h3>
                    {extractedTasks.map((task, index) => (
                      <div key={task.id} className="text-xs text-vox-text mb-1">
                        {index + 1}. {task.title} {task.due_date && `(Due: ${task.due_date})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'archive' ? (
            <div className="animate-fade-in-up">
              <MemoryArchive className="max-w-4xl mx-auto" />
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <Dashboard key={dashboardKey} userId={userId} />
            </div>
          )}
        </div>

        {activeReport && (
          <VoiceReport
            reportText={activeReport}
            onClose={() => setActiveReport(null)}
          />
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === 'dashboard' && (
        <div className="fixed bottom-6 right-6 z-fixed pb-safe no-print">
          <button
            onClick={() => {
              setActiveTab('record');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-14 h-14 rounded-full bg-brand-gradient shadow-glow hover:shadow-glow-lg flex items-center justify-center active:scale-90 transition-all animate-scale-in"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom Sheet for Mobile Recording */}
      {showRecorder && activeTab === 'dashboard' && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setShowRecorder(false)} />
          <div className="bottom-sheet animate-slide-up">
            <div className="bottom-sheet-handle" />
            <div className="px-6 pb-6">
              <div className="text-center py-4 text-gray-500">
                Voice Recorder disabled in mobile sheet
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 pb-safe">
        <div className="pt-6 border-t border-vox-border flex items-center justify-between">
          <p className="text-2xs text-vox-text-muted">VoxValt • Your voice, secured and remembered</p>
          <div className="flex items-center gap-3">
            <a href="/settings" className="text-2xs text-vox-text-muted hover:text-brand-500 transition-colors">Settings</a>
            <a href="mailto:support@voxvalt.com" className="text-2xs text-vox-text-muted hover:text-brand-500 transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </main>
  );
}