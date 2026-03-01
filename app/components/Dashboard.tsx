// app/components/Dashboard.tsx
'use client';
import Script from 'next/script';

import { useState, useEffect, useMemo } from 'react';
import { Task, Recording } from '@/types';
import { fetchTasks, fetchRecordings, fetchSubscriptionStatus, fetchTeams } from '@/lib/api-client';
import { MemoryCard } from './MemoryCard';
import { TaskStats } from './TaskStats';
import { NotificationSettings } from './NotificationSettings';
import { SearchAndFilter } from './SearchAndFilter';
import { MemorySearch } from './MemorySearch';
import { TeamManager } from './TeamManager';
import { useNotifications } from '@/lib/use-notifications';
import { useWindowSize, breakpoints } from '@/lib/use-responsive';
import { searchTasks, searchRecordings, getTaskStats, SearchFilters, calculateSmartScore } from '@/lib/search-utils';
import { Loader, AlertCircle, Zap, Users, User } from 'lucide-react';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TeamPromisesDashboard } from './TeamPromisesDashboard';
import { PromiseAssignmentModal } from './PromiseAssignmentModal';
import CommitmentDashboard from './CommitmentDashboard';
import { MemoryBoards } from './MemoryBoards';
import { FamilyAnalytics } from './FamilyAnalytics';
import { deleteRecording, deleteTask, updateTask, updateTaskStatus } from '@/lib/api-client';

interface DashboardProps {
  userId: string;
}

type CombinedMemory =
  | { type: 'task'; data: Task; date: Date; isLocked?: boolean }
  | { type: 'recording'; data: Recording; date: Date; isLocked?: boolean };

export function Dashboard({ userId }: DashboardProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    taskStatus: 'all',
    taskType: 'all',
    sortBy: 'recent',
    dateRange: { startDate: null, endDate: null },
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showTeamPromises, setShowTeamPromises] = useState(false);
  const [selectedPromise, setSelectedPromise] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Modals
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'task' | 'recording' } | null>(null);

  const windowSize = useWindowSize();
  const isMobile = windowSize.width < breakpoints.tablet;

  // Fetch data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, recordingsData, subData, teamsData] = await Promise.all([
        fetchTasks(userId, undefined, currentTeamId || undefined, selectedBoardId || undefined),
        fetchRecordings(userId, currentTeamId || undefined, selectedBoardId || undefined),
        fetchSubscriptionStatus(),
        fetchTeams(),
      ]);
      setTasks(tasksData);
      setRecordings(recordingsData);
      setIsPremium(subData.isPremium);
      setTeams(teamsData);

      // Load team members if a team is selected
      if (currentTeamId) {
        await loadTeamMembers(currentTeamId);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeamId, selectedBoardId]);

  useEffect(() => {
    if (currentTeamId) {
      loadTeamMembers(currentTeamId);
    } else {
      setTeamMembers([]);
    }
  }, [currentTeamId]);

  // Use notifications hook
  useNotifications(userId);

  // Unified Filtering and Sorting
  const filteredMemories = useMemo(() => {
    // 1. Filter Tasks
    const filteredTasks = searchTasks(tasks, filters);
    // 2. Filter Recordings
    const filteredRecordings = searchRecordings(recordings, filters);

    // 3. Combine and Score
    const combined: (CombinedMemory & { score: number })[] = [
      ...filteredTasks.map(t => ({
        type: 'task' as const,
        data: t,
        date: t.created_at ? new Date(t.created_at) : new Date(),
        score: calculateSmartScore(t)
      })),
      ...filteredRecordings.map(r => {
        const date = r.created_at ? new Date(r.created_at) : new Date();
        const ageInDays = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
        return {
          type: 'recording' as const,
          data: r,
          date,
          score: Math.max(0, 5 - ageInDays) // Recordings get a small recency-only score
        };
      })
    ];

    // 4. Sort
    let sorted;
    if (filters.sortBy === 'smart') {
      sorted = combined.sort((a, b) => b.score - a.score);
    } else if (filters.sortBy === 'dueDate') {
      sorted = combined.sort((a, b) => {
        const dateA = a.type === 'task' && (a.data as Task).due_date ? new Date((a.data as Task).due_date!).getTime() : Infinity;
        const dateB = b.type === 'task' && (b.data as Task).due_date ? new Date((b.data as Task).due_date!).getTime() : Infinity;
        return dateA - dateB;
      });
    } else {
      // Default to recent
      sorted = combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    // 5. Apply Freemium Limits (7-day window for free users)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return sorted.map(item => {
      const isLocked = !isPremium && item.date < sevenDaysAgo;
      // Inject rank for "Hot" indicator
      return { ...item, isLocked };
    });
  }, [tasks, recordings, filters, isPremium, calculateSmartScore]);

  const stats = getTaskStats(tasks);

  const activePromises = useMemo(() => {
    return tasks
      .filter(t => t.task_type === 'promise' && !t.completed)
      .sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);
  }, [tasks]);

  // Handlers
  const handleTaskStatusChange = async (updatedTask: Task) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    try {
      if (updatedTask.id) {
        await updateTaskStatus(updatedTask.id, !!updatedTask.completed);
      }
    } catch (err) {
      // Revert on error
      console.error("Failed to update task", err);
      loadData();
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (updatedTask.id) {
      await updateTask(updatedTask.id, updatedTask);
    }
    setEditingTask(null);
  };

  const confirmDelete = (id: string, type: 'task' | 'recording') => {
    setDeletingItem({ id, type });
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      if (deletingItem.type === 'task') {
        await deleteTask(deletingItem.id);
        setTasks(prev => prev.filter(t => t.id !== deletingItem.id));
      } else {
        await deleteRecording(deletingItem.id);
        setRecordings(prev => prev.filter(r => r.id !== deletingItem.id));
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      setError("Failed to delete item.");
    } finally {
      setDeletingItem(null);
    }
  };

  const handlePlayRecording = ({ id, url }: { id: string; url: string }) => {
    const audio = new Audio(url);
    audio.play();
  };

  const handlePromiseUpdate = async (updatedPromise: any) => {
    setTasks(prev => prev.map(t => t.id === updatedPromise.id ? updatedPromise : t));
    setSelectedPromise(null);
  };

  const handleUpgrade = async () => {
    try {
      setIsProcessingPayment(true);
      setError(null);

      // 1. Create order on server
      const orderRes = await fetch('/api/payment/create-order', { method: 'POST' });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      const order = orderData.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: order.currency,
        name: "VoxValt Premium",
        description: "1 Month Voice Memory Upgrade",
        order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              // Reload data to reflect premium status and fetch all tasks
              await loadData();
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error("Verification error", err);
            setError('Something went wrong verifying your payment.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: "VoxValt User",
        },
        theme: {
          color: "#4F46E5" // indigo-600
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed", response.error);
        setError(`Payment failed: ${response.error.description}`);
        setIsProcessingPayment(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Checkout error", err);
      setError((err as Error).message);
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Load Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-vox-text">Your Memories</h2>
          <p className="text-vox-text-secondary">Timeline of your tasks, notes, and recordings.</p>
        </div>
        <div className="flex items-center gap-4">
          {teams.length > 0 && (
            <div className="flex bg-vox-surface border border-vox-border p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setCurrentTeamId(null)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!currentTeamId ? 'bg-brand-600 text-white shadow-md' : 'text-vox-text-secondary hover:bg-white/5'}`}
              >
                <User size={14} />
                Personal
              </button>
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setCurrentTeamId(team.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentTeamId === team.id ? 'bg-brand-600 text-white shadow-md' : 'text-vox-text-secondary hover:bg-white/5'}`}
                >
                  <Users size={14} />
                  {team.name}
                </button>
              ))}
              <button
                onClick={() => setShowTeamManager(!showTeamManager)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter ${showTeamManager ? 'bg-purple-600 text-white shadow-md' : 'text-vox-text-muted hover:text-purple-400 hover:bg-purple-500/5'}`}
              >
                {showTeamManager ? 'Close' : 'Manage'}
              </button>
              <button
                onClick={() => setShowTeamPromises(!showTeamPromises)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter ${showTeamPromises ? 'bg-amber-600 text-white shadow-md' : 'text-vox-text-muted hover:text-amber-400 hover:bg-amber-500/5'}`}
              >
                {showTeamPromises ? 'Memories' : 'Promises'}
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter ${showAnalytics ? 'bg-brand-600 text-white shadow-md' : 'text-vox-text-muted hover:text-brand-400 hover:bg-brand-500/5'}`}
              >
                {showAnalytics ? 'Timeline' : 'Analytics'}
              </button>
            </div>
          )}
          <NotificationSettings userId={userId} />
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {showTeamManager ? (
          <TeamManager onTeamsUpdate={loadData} />
        ) : showTeamPromises ? (
          <TeamPromisesDashboard
            currentTeamId={currentTeamId}
            userId={userId}
            onTeamChange={setCurrentTeamId}
          />
        ) : showAnalytics && currentTeamId ? (
          <FamilyAnalytics teamId={currentTeamId} />
        ) : (
          <>
            <TaskStats tasks={stats} />

            <div className="mb-8">
              <CommitmentDashboard
                tasks={tasks}
                onStatusChange={handleTaskStatusChange}
                onEdit={handleEditTask}
              />
            </div>

            {currentTeamId && (
              <div className="mb-8">
                <MemoryBoards
                  teamId={currentTeamId}
                  selectedBoardId={selectedBoardId}
                  onBoardSelect={setSelectedBoardId}
                />
              </div>
            )}

            <MemorySearch />
            <SearchAndFilter onFilterChange={setFilters} />
          </>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Freemium Banner */}
      {!loading && !isPremium && (
        <div className="mb-6 p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-brand-400">You are on the Free Tier</h3>
            <p className="text-sm text-brand-400/80 mt-1">
              Memories older than 7 days are archived.
              {recordings.length > 0 && (
                <span className="block mt-1 font-medium">Recordings this month: {recordings.filter(r => {
                  const d = new Date(r.created_at || '');
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length} / 5</span>
              )}
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isProcessingPayment}
            className="whitespace-nowrap px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            {isProcessingPayment ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>
      )}

      {/* Memory Feed */}
      <div className="space-y-4">
        {filteredMemories.length > 0 ? (
          filteredMemories.map((item, index) => (
            <MemoryCard
              key={`${item.type}-${item.data.id}`}
              item={item.data}
              type={item.type}
              onStatusChange={handleTaskStatusChange}
              onDelete={confirmDelete}
              onEdit={handleEditTask}
              onPlayRecording={handlePlayRecording}
              isLocked={'isLocked' in item ? (item as any).isLocked : false}
              isHot={filters.sortBy === 'smart' && index < 3 && item.score > 50}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-vox-surface rounded-2xl border border-dashed border-vox-border rounded-xl">
            <p className="text-vox-text-secondary font-medium">No memories found.</p>
            <p className="text-sm text-vox-text-muted mt-1">Try adjusting your filters or record a new memory.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={handleTaskUpdate}
        />
      )}

      {deletingItem && (
        <ConfirmDeleteModal
          isOpen={true}
          title={`Delete ${deletingItem.type === 'task' ? 'Task' : 'Recording'}?`}
          message="This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}

      {selectedPromise && (
        <PromiseAssignmentModal
          promise={selectedPromise}
          isOpen={true}
          onClose={() => setSelectedPromise(null)}
          teamMembers={teamMembers}
          currentUserId={userId}
          onUpdate={handlePromiseUpdate}
        />
      )}
    </div>
  );
}
