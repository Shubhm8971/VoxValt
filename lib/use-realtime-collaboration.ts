import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

interface UseRealtimeCollaborationProps {
  teamId?: string;
  onTaskUpdate?: (task: any) => void;
  onTaskCreate?: (task: any) => void;
  onTaskDelete?: (taskId: string) => void;
  onMemberJoin?: (member: any) => void;
  onMemberLeave?: (memberId: string) => void;
}

export function useRealtimeCollaboration({
  teamId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onMemberJoin,
  onMemberLeave
}: UseRealtimeCollaborationProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const supabase = createClient();
    const channelName = `team-${teamId}`;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `team_id=eq.${teamId}`
        }, 
        (payload) => {
          console.log('Task change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              onTaskCreate?.(payload.new);
              break;
            case 'UPDATE':
              onTaskUpdate?.(payload.new);
              break;
            case 'DELETE':
              onTaskDelete?.(payload.old.id);
              break;
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          console.log('Team member change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              onMemberJoin?.(payload.new);
              break;
            case 'DELETE':
              onMemberLeave?.(payload.old.user_id);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [teamId, onTaskUpdate, onTaskCreate, onTaskDelete, onMemberJoin, onMemberLeave]);

  const broadcastPresence = (presence: any) => {
    if (channelRef.current && teamId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'presence',
        payload: {
          userId: presence.userId,
          status: presence.status,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const broadcastTaskActivity = (activity: {
    type: 'viewing' | 'editing' | 'completing';
    taskId: string;
    userId: string;
  }) => {
    if (channelRef.current && teamId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'task_activity',
        payload: {
          ...activity,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return {
    broadcastPresence,
    broadcastTaskActivity
  };
}
