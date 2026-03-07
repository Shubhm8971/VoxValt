// app/components/TeamPromisesDashboard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, HandHeart, Calendar, Filter, User, Clock, CheckCircle, AlertCircle, TrendingUp, Shield, Star } from 'lucide-react';
import { fetchTasks, fetchTeams } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface TeamPromise {
  id: string;
  title: string;
  description: string;
  task_type: 'promise';
  completed: boolean;
  due_date: string | null;
  created_at: string;
  user_id: string;
  team_id: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  assignee_id?: string;
  assignee?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
}

interface TeamMember {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  role: 'admin' | 'member' | 'owner';
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  members?: TeamMember[];
}

type PromiseFilter = 'all' | 'active' | 'completed' | 'overdue' | 'assigned-to-me' | 'created-by-me';
type PromiseSort = 'newest' | 'oldest' | 'due-date' | 'priority' | 'assignee';

export function TeamPromisesDashboard({
  currentTeamId,
  userId,
  onTeamChange
}: {
  currentTeamId: string | null;
  userId: string;
  onTeamChange?: (teamId: string | null) => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [promises, setPromises] = useState<TeamPromise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PromiseFilter>('all');
  const [sort, setSort] = useState<PromiseSort>('newest');
  const [selectedPromise, setSelectedPromise] = useState<TeamPromise | null>(null);

  // Load teams and promises
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [teamsData, tasksData] = await Promise.all([
          fetchTeams(),
          currentTeamId ? fetchTasks(userId, undefined, currentTeamId) : []
        ]);

        setTeams(teamsData);

        // Filter only promises and enrich with user data
        const teamPromises = tasksData
          .filter(task => task.task_type === 'promise')
          .map(task => ({
            ...task,
            priority: task.priority || 'medium',
            tags: (task as any).tags || []
          })) as TeamPromise[];

        setPromises(teamPromises);
      } catch (error) {
        console.error('Failed to load team promises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentTeamId, userId]);

  // Filter and sort promises
  const filteredPromises = useMemo(() => {
    let filtered = [...promises];

    // Apply filters
    switch (filter) {
      case 'active':
        filtered = filtered.filter(p => !p.completed);
        break;
      case 'completed':
        filtered = filtered.filter(p => p.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(p =>
          !p.completed &&
          p.due_date &&
          new Date(p.due_date) < new Date()
        );
        break;
      case 'assigned-to-me':
        filtered = filtered.filter(p => p.assignee_id === userId);
        break;
      case 'created-by-me':
        filtered = filtered.filter(p => p.user_id === userId);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'due-date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
        case 'assignee':
          const aName = a.assignee?.full_name || a.user?.full_name || '';
          const bName = b.assignee?.full_name || b.user?.full_name || '';
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [promises, filter, sort, userId]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = promises.length;
    const completed = promises.filter(p => p.completed).length;
    const active = promises.filter(p => !p.completed).length;
    const overdue = promises.filter(p =>
      !p.completed &&
      p.due_date &&
      new Date(p.due_date) < new Date()
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, overdue, completionRate };
  }, [promises]);

  const currentTeam = teams.find(t => t.id === currentTeamId);

  if (loading) {
    return (
      <div className="bg-vox-surface border border-vox-border rounded-3xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-vox-border/20 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-vox-border/10 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-vox-border/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Team Selector */}
      <div className="bg-vox-surface border border-vox-border rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-vox-text flex items-center gap-3">
              <HandHeart className="text-purple-500" size={28} />
              Team Promises
            </h2>
            <p className="text-vox-text-secondary mt-1">
              {currentTeam ? `Shared commitments for ${currentTeam.name}` : 'Select a team to view promises'}
            </p>
          </div>

          {teams.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                value={currentTeamId || ''}
                onChange={(e) => onTeamChange?.(e.target.value || null)}
                className="bg-vox-bg border border-vox-border rounded-xl px-4 py-2 text-sm text-vox-text focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {currentTeamId && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="text-blue-500" />}
              label="Total Promises"
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle className="text-green-500" />}
              label="Completed"
              value={stats.completed}
              color="green"
            />
            <StatCard
              icon={<Clock className="text-amber-500" />}
              label="Active"
              value={stats.active}
              color="amber"
            />
            <StatCard
              icon={<AlertCircle className="text-red-500" />}
              label="Overdue"
              value={stats.overdue}
              color="red"
            />
          </div>

          {/* Filters and Sort */}
          <div className="bg-vox-surface border border-vox-border rounded-3xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <FilterButtons filter={filter} setFilter={setFilter} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-vox-text-muted uppercase tracking-wider">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as PromiseSort)}
                  className="bg-vox-bg border border-vox-border rounded-lg px-3 py-1.5 text-xs text-vox-text focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="due-date">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="assignee">Assignee</option>
                </select>
              </div>
            </div>
          </div>

          {/* Promises List */}
          <div className="bg-vox-surface border border-vox-border rounded-3xl overflow-hidden">
            {filteredPromises.length > 0 ? (
              <div className="divide-y divide-vox-border/50">
                {filteredPromises.map((promise) => (
                  <PromiseCard
                    key={promise.id}
                    promise={promise}
                    userId={userId}
                    onSelect={setSelectedPromise}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <HandHeart className="w-16 h-16 text-vox-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-vox-text mb-2">No promises found</h3>
                <p className="text-vox-text-secondary">
                  {filter === 'all'
                    ? 'Start making and tracking commitments with your team.'
                    : `No ${filter} promises found.`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Team Insights */}
          <TeamInsights stats={stats} team={currentTeam} />
        </>
      )}

      {!currentTeamId && teams.length === 0 && (
        <div className="bg-vox-surface border border-vox-border rounded-3xl p-12 text-center">
          <Users className="w-16 h-16 text-vox-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-vox-text mb-2">No Teams Yet</h3>
          <p className="text-vox-text-secondary mb-4">
            Create or join a team to start sharing promises and commitments.
          </p>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold text-vox-text">{value}</span>
      </div>
      <p className="text-xs text-vox-text-secondary uppercase tracking-wider">{label}</p>
    </div>
  );
}

// Filter Buttons Component
function FilterButtons({ filter, setFilter }: {
  filter: PromiseFilter;
  setFilter: (filter: PromiseFilter) => void;
}) {
  const filters: { value: PromiseFilter; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'assigned-to-me', label: 'To Me' },
    { value: 'created-by-me', label: 'By Me' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setFilter(value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === value
            ? 'bg-purple-600 text-white shadow-md'
            : 'bg-vox-bg text-vox-text-secondary hover:bg-vox-border/20'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Promise Card Component
function PromiseCard({
  promise,
  userId,
  onSelect
}: {
  promise: TeamPromise;
  userId: string;
  onSelect: (promise: TeamPromise) => void;
}) {
  const isOverdue = promise.due_date && new Date(promise.due_date) < new Date() && !promise.completed;
  const isCreatedByMe = promise.user_id === userId;
  const isAssignedToMe = promise.assignee_id === userId;

  const priorityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-amber-500/30 bg-amber-500/5',
    low: 'border-green-500/30 bg-green-500/5',
  };

  return (
    <div
      className={`p-4 hover:bg-vox-border/5 transition-all cursor-pointer border-l-4 ${promise.completed ? 'opacity-60' : ''
        } ${priorityColors[promise.priority || 'medium']}`}
      onClick={() => onSelect(promise)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${promise.completed
              ? 'bg-green-500/20 text-green-500'
              : isOverdue
                ? 'bg-red-500/20 text-red-500'
                : 'bg-purple-500/20 text-purple-500'
              }`}>
              {promise.completed ? 'Completed' : isOverdue ? 'Overdue' : 'Active'}
            </span>

            {isCreatedByMe && (
              <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded">
                Created by you
              </span>
            )}

            {isAssignedToMe && !isCreatedByMe && (
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded">
                Assigned to you
              </span>
            )}
          </div>

          <h3 className={`font-semibold text-vox-text mb-1 ${promise.completed ? 'line-through' : ''
            }`}>
            {promise.title}
          </h3>

          {promise.description && (
            <p className="text-sm text-vox-text-secondary mb-2 line-clamp-2">
              {promise.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-vox-text-muted">
            {promise.due_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{new Date(promise.due_date).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{promise.user?.full_name || 'Unknown'}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatDistanceToNow(new Date(promise.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {promise.completed ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <div className="w-5 h-5 rounded-full border border-vox-border" />
          )}
        </div>
      </div>
    </div>
  );
}

// Team Insights Component
function TeamInsights({ stats, team }: {
  stats: { total: number; completed: number; active: number; overdue: number; completionRate: number };
  team: Team | undefined;
}) {
  if (!team) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="text-purple-500" size={20} />
        <h3 className="text-lg font-bold text-vox-text">Team Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-2xl font-bold text-purple-400 mb-1">{stats.completionRate}%</div>
          <p className="text-xs text-vox-text-secondary uppercase tracking-wider">Completion Rate</p>
          <div className="mt-2 h-2 bg-vox-border/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{stats.active}</div>
          <p className="text-xs text-vox-text-secondary uppercase tracking-wider">Active Commitments</p>
          <p className="text-xs text-vox-text-muted mt-1">
            {stats.overdue > 0 && (
              <span className="text-red-400">{stats.overdue} overdue</span>
            )}
          </p>
        </div>

        <div>
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.completed}</div>
          <p className="text-xs text-vox-text-secondary uppercase tracking-wider">Promises Kept</p>
          <p className="text-xs text-vox-text-muted mt-1">
            Building trust through accountability
          </p>
        </div>
      </div>
    </div>
  );
}
