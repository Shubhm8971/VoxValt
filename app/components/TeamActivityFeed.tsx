'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, Edit, Trash2, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TeamActivity {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_updated' | 'member_joined' | 'member_left';
  userId: string;
  userName: string;
  userAvatar?: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
  details?: string;
}

interface TeamActivityFeedProps {
  teamId?: string;
  className?: string;
}

export function TeamActivityFeed({ teamId, className = '' }: TeamActivityFeedProps) {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    
    loadRecentActivity();
  }, [teamId]);

  const loadRecentActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/activity?limit=20`);
      const data = await response.json();
      
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Failed to load team activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'task_updated':
        return <Edit className="w-4 h-4 text-orange-500" />;
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'member_left':
        return <Users className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: TeamActivity) => {
    switch (activity.type) {
      case 'task_created':
        return `${activity.userName} created task "${activity.taskTitle}"`;
      case 'task_completed':
        return `${activity.userName} completed "${activity.taskTitle}"`;
      case 'task_updated':
        return `${activity.userName} updated "${activity.taskTitle}"`;
      case 'member_joined':
        return `${activity.userName} joined the team`;
      case 'member_left':
        return `${activity.userName} left the team`;
      default:
        return `${activity.userName} performed an action`;
    }
  };

  if (!teamId) {
    return (
      <div className={`bg-vox-surface border border-vox-border rounded-xl p-6 text-center ${className}`}>
        <Activity className="w-8 h-8 text-vox-text-muted mx-auto mb-2" />
        <p className="text-sm text-vox-text-muted">Select a team to view activity</p>
      </div>
    );
  }

  return (
    <div className={`bg-vox-surface border border-vox-border rounded-xl ${className}`}>
      <div className="p-4 border-b border-vox-border">
        <h3 className="font-semibold text-vox-text flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-500" />
          Team Activity
        </h3>
        <p className="text-xs text-vox-text-muted mt-1">Real-time updates from your team</p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-vox-text-muted">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-8 h-8 text-vox-text-muted mx-auto mb-2" />
            <p className="text-sm text-vox-text-muted">No recent activity</p>
            <p className="text-xs text-vox-text-muted mt-1">Team activity will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-vox-border">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-vox-surface/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-vox-text">
                      {getActivityMessage(activity)}
                    </p>
                    
                    {activity.details && (
                      <p className="text-xs text-vox-text-muted mt-1">
                        {activity.details}
                      </p>
                    )}
                    
                    <p className="text-xs text-vox-text-muted mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
