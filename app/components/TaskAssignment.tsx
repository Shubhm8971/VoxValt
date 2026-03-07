'use client';

import { useState, useEffect } from 'react';
import { User, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface TaskAssignmentProps {
  teamId?: string;
  assignedTo?: string;
  onAssignmentChange: (userId: string | null) => void;
  className?: string;
}

export function TaskAssignment({ 
  teamId, 
  assignedTo, 
  onAssignmentChange, 
  className = '' 
}: TaskAssignmentProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (teamId) {
      loadTeamMembers();
    }
  }, [teamId]);

  const loadTeamMembers = async () => {
    if (!teamId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();
      
      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignedUser = () => {
    if (!assignedTo) return null;
    return members.find(m => m.user_id === assignedTo) || 
           { user_id: assignedTo, user: { full_name: 'You', email: session?.user?.email || '' } };
  };

  const assignedUser = getAssignedUser();

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-vox-text-secondary" />
        <div className="flex-1">
          {assignedUser ? (
            <div className="flex items-center gap-2 bg-vox-surface px-3 py-2 rounded-lg border border-vox-border">
              <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {assignedUser.user?.full_name?.[0] || 'Y'}
                </span>
              </div>
              <span className="text-sm text-vox-text">
                {assignedUser.user?.full_name || 'You'}
              </span>
              <button
                onClick={() => onAssignmentChange(null)}
                className="text-vox-text-muted hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3 py-2 bg-vox-surface border border-vox-border rounded-lg text-sm text-vox-text-secondary hover:border-brand-500/50 transition-colors text-left flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {teamId ? 'Assign to team member...' : 'Assign to...'}
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-card rounded-xl shadow-elevated border border-vox-border max-h-48 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onAssignmentChange(currentUserId || null);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-vox-surface transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Y</span>
                </div>
                <div>
                  <div className="text-sm text-vox-text">Assign to yourself</div>
                  <div className="text-xs text-vox-text-muted">Keep this task on your plate</div>
                </div>
              </button>

              {teamId && members.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => {
                    onAssignmentChange(member.user_id);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-vox-surface transition-colors flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                    <span className="text-xs font-bold text-purple-400">
                      {member.user?.full_name?.[0] || member.user?.email?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-vox-text">
                      {member.user?.full_name || member.user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-vox-text-muted capitalize">{member.role}</div>
                  </div>
                </button>
              ))}

              {!teamId && (
                <div className="px-3 py-2 text-xs text-vox-text-muted text-center">
                  Create or join a team to assign tasks to members
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
