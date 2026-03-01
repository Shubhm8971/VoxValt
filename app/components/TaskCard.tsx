'use client';

import { Task } from '@/types';
import { CheckCircle2, Circle, Trash2, Calendar, Edit2, Clock, Repeat } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { updateTaskStatus, updateTask, deleteTask } from '@/lib/api-client';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PriorityBadge } from './PrioritySelector';
import { LabelBadges } from './LabelEditor';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const taskTypeColors = {
  task: 'bg-blue-100 text-blue-800',
  reminder: 'bg-yellow-100 text-yellow-800',
  promise: 'bg-purple-100 text-purple-800',
  recurring: 'bg-green-100 text-green-800',
};

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (!task.id) throw new Error('Task ID is missing');
      await deleteTask(task.id);
      onDelete?.(task.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      if (!task.id) throw new Error('Task ID is missing');
      const updated = await updateTaskStatus(task.id, !task.completed);
      onStatusChange?.(updated);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    setIsSaving(true);
    try {
      if (!task.id) throw new Error('Task ID is missing');
      const result = await updateTask(task.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        task_type: updatedTask.task_type,
        due_date: updatedTask.due_date,
      });
      onStatusChange?.(result);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToCalendar = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setSyncMessage('Please log in to sync to calendar');
        return;
      }

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          task_type: task.task_type || task.type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSyncMessage('Synced to Google Calendar!');
        setIsSynced(true);
        setTimeout(() => setSyncMessage(null), 3000);
      } else {
        setSyncMessage(data.error || 'Failed to sync');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage('Failed to sync to calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className={`p-4 rounded-lg border-2 transition-all ${task.completed
        ? 'bg-gray-100 border-gray-300'
        : 'bg-white border-gray-200 hover:border-blue-400'
        }`}>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={isUpdating}
            className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-semibold text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                {task.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${taskTypeColors[(task.task_type || task.type || 'task') as keyof typeof taskTypeColors]
                }`}>
                {task.task_type || task.type || 'task'}
              </span>
              {task.priority && <PriorityBadge priority={task.priority} />}
            </div>

            {task.description && (
              <p className={`text-xs mb-2 ${task.completed ? 'text-gray-400' : 'text-gray-600'
                }`}>
                {task.description}
              </p>
            )}

            {task.labels && task.labels.length > 0 && (
              <div className="mb-2">
                <LabelBadges labels={task.labels} />
              </div>
            )}

            {task.due_date && (() => {
              const dueDate = new Date(task.due_date);
              const isOverdue = dueDate < new Date() && !task.completed;
              const isDueSoon = !isOverdue && !task.completed && (dueDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000); // 24 hours

              return (
                <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-600 font-bold' :
                  isDueSoon ? 'text-orange-600 font-medium' :
                    'text-gray-500'
                  }`}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(dueDate, 'MMM d, h:mm a')}
                    {isOverdue && ' (Overdue)'}
                    {isDueSoon && ' (Due Soon)'}
                  </span>
                </div>
              );
            })()}

            {task.recurrence && (
              <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                <Repeat className="w-3 h-3" />
                <span className="font-medium">{task.recurrence}</span>
              </div>
            )}

            {task.created_at && (
              <div className="text-xs text-gray-400 mt-1">
                Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex gap-1">
            {task.due_date && !isSynced && (
              <button
                onClick={handleSyncToCalendar}
                disabled={isSyncing}
                className="p-1 hover:bg-purple-100 rounded text-purple-500 hover:text-purple-700 transition-colors disabled:opacity-50"
                title="Sync to Google Calendar"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}
            {isSynced && (
              <div className="p-1 text-green-500" title="Synced to calendar">
                <Clock className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 hover:bg-blue-100 rounded text-blue-500 hover:text-blue-700 transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {syncMessage && (
          <div className={`mt-2 text-xs p-2 rounded ${syncMessage.includes('Failed') || syncMessage.includes('log in') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {syncMessage}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditTaskModal
        task={task}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />
      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
