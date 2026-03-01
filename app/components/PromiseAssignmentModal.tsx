// app/components/PromiseAssignmentModal.tsx
'use client';

import { useState } from 'react';
import { X, User, Users, Calendar, Flag, MessageSquare, CheckCircle } from 'lucide-react';
import { updateTask } from '@/lib/api-client';

interface PromiseAssignmentModalProps {
  promise: any;
  isOpen: boolean;
  onClose: () => void;
  teamMembers: any[];
  currentUserId: string;
  onUpdate: (updatedPromise: any) => void;
}

export function PromiseAssignmentModal({
  promise,
  isOpen,
  onClose,
  teamMembers,
  currentUserId,
  onUpdate
}: PromiseAssignmentModalProps) {
  const [assigneeId, setAssigneeId] = useState(promise.assignee_id || '');
  const [priority, setPriority] = useState(promise.priority || 'medium');
  const [dueDate, setDueDate] = useState(promise.due_date ? new Date(promise.due_date).toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(promise.description || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedPromise = {
        ...promise,
        assignee_id: assigneeId || null,
        priority,
        due_date: dueDate || null,
        description: notes,
      };

      await updateTask(promise.id, updatedPromise);
      onUpdate(updatedPromise);
      onClose();
    } catch (error) {
      console.error('Failed to update promise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    setLoading(true);
    try {
      const updatedPromise = {
        ...promise,
        completed: !promise.completed,
        completed_at: !promise.completed ? new Date().toISOString() : null,
      };

      await updateTask(promise.id, updatedPromise);
      onUpdate(updatedPromise);
      onClose();
    } catch (error) {
      console.error('Failed to update promise status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-vox-surface border border-vox-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-vox-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-vox-text flex items-center gap-2">
                <Users className="text-purple-500" size={24} />
                Promise Details
              </h2>
              <p className="text-sm text-vox-text-secondary mt-1">
                Manage assignment and tracking for this commitment
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-vox-text-secondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Promise Info */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4">
            <h3 className="font-semibold text-vox-text mb-2">{promise.title}</h3>
            <div className="flex items-center gap-4 text-xs text-vox-text-muted">
              <span>Created by {promise.user?.full_name || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(promise.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-vox-border/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <CheckCircle className={`size-5 ${promise.completed ? 'text-green-500' : 'text-vox-text-muted'}`} />
              <div>
                <p className="font-semibold text-vox-text">Status</p>
                <p className="text-xs text-vox-text-secondary">
                  {promise.completed ? 'Completed' : 'Active'}
                </p>
              </div>
            </div>
            <button
              onClick={handleStatusToggle}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                promise.completed
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                  : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
              }`}
            >
              {promise.completed ? 'Mark Active' : 'Mark Complete'}
            </button>
          </div>

          {/* Assignment */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-vox-text mb-3">
              <User size={16} />
              Assigned To
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-vox-bg border border-vox-border rounded-xl px-4 py-3 text-vox-text focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.full_name || member.user.email} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-vox-text mb-3">
              <Flag size={16} />
              Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                        : p === 'medium'
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : 'bg-green-500/20 text-green-500 border border-green-500/30'
                      : 'bg-vox-bg text-vox-text-secondary border border-vox-border hover:bg-vox-border/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-vox-text mb-3">
              <Calendar size={16} />
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-vox-bg border border-vox-border rounded-xl px-4 py-3 text-vox-text focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-vox-text mb-3">
              <MessageSquare size={16} />
              Notes & Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or notes about this promise..."
              className="w-full bg-vox-bg border border-vox-border rounded-xl px-4 py-3 text-vox-text placeholder:text-vox-text-muted focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-vox-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-vox-text-secondary hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
