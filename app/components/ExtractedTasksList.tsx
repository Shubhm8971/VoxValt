'use client';

import { Task } from '@/types';
import { CheckCircle, Clock, User, Repeat2, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ExtractedTasksListProps {
  tasks: Task[];
  onClear?: () => void;
  onSave?: () => Promise<void>;
  userId?: string;
}

const typeIcons = {
  task: <CheckCircle className="w-4 h-4 text-blue-400" />,
  reminder: <Clock className="w-4 h-4 text-amber-400" />,
  promise: <User className="w-4 h-4 text-purple-400" />,
  recurring: <Repeat2 className="w-4 h-4 text-green-400" />,
};

const typeColors = {
  task: 'bg-blue-500/10 border-blue-500/30',
  reminder: 'bg-amber-500/10 border-amber-500/30',
  promise: 'bg-purple-500/10 border-purple-500/30',
  recurring: 'bg-green-500/10 border-green-500/30',
};

const typeBadgeColors = {
  task: 'bg-blue-500/20 text-blue-400',
  reminder: 'bg-amber-500/20 text-amber-400',
  promise: 'bg-purple-500/20 text-purple-400',
  recurring: 'bg-green-500/20 text-green-400',
};

export function ExtractedTasksList({ tasks, onClear, onSave, userId }: ExtractedTasksListProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-xl bg-vox-surface border border-vox-border animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-vox-text flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Extracted Items ({tasks.length})
        </h3>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-400 font-medium animate-pulse">
              ✓ Saved
            </span>
          )}
          {onSave && !saved && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3 h-3" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs p-1 rounded hover:bg-vox-surface active:scale-95 transition-colors text-vox-text-muted hover:text-vox-text"
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task, idx) => {
          const taskType = (task.type as keyof typeof typeColors) || 'task';
          return (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${typeColors[taskType]} transition-all hover:border-opacity-100`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {typeIcons[taskType] || <CheckCircle className="w-4 h-4 text-gray-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-vox-text truncate">
                    {task.title}
                  </p>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${typeBadgeColors[taskType]}`}>
                    {taskType}
                  </span>
                </div>

                {task.description && (
                  <p className="text-xs text-vox-text-muted mt-1">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2 text-2xs text-vox-text-muted">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {userId === 'demo' && (
        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-2xs text-amber-600 text-center">
          💡 Sign in to save tasks permanently
        </div>
      )}
    </div>
  );
}

