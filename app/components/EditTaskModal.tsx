'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { useWindowSize, breakpoints } from '@/lib/use-responsive';
import { PrioritySelector } from './PrioritySelector';
import { LabelEditor } from './LabelEditor';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => Promise<void>;
  isSaving?: boolean;
}

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    task_type: task.task_type,
    due_date: task.due_date || '',
    recurrence: task.recurrence || '',
    priority: task.priority || 'medium',
    labels: task.labels || [],
  });
  const [error, setError] = useState<string | null>(null);

  const windowSize = useWindowSize();
  const isMobile = windowSize.width < breakpoints.tablet;

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const updatedTask: Task = {
        ...task,
        ...formData,
      };
      await onSave(updatedTask);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save task');
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: isMobile ? '1.5rem' : '2rem',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    heading: {
      fontSize: isMobile ? '1.3rem' : '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#333',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#555',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      minHeight: '100px',
      fontFamily: 'inherit',
      resize: 'vertical' as const,
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem',
    },
    button: {
      flex: 1,
      padding: '0.75rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '44px',
    },
    cancelButton: {
      backgroundColor: '#e0e0e0',
      color: '#333',
    },
    saveButton: {
      backgroundColor: '#667eea',
      color: 'white',
    },
    saveButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
      opacity: 0.7,
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={styles.heading}>✏️ Edit Task</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              style={styles.input}
              placeholder="Task title"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              style={styles.textarea}
              placeholder="Add details about this task..."
              disabled={isSaving}
            />
          </div>

          {/* Task Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Type</label>
            <select
              value={formData.task_type}
              onChange={(e) => handleChange('task_type', e.target.value)}
              style={styles.select}
              disabled={isSaving}
            >
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="promise">Promise</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {/* Recurrence Pattern (only if Recurring) */}
          {formData.task_type === 'recurring' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Recurrence Pattern</label>
              <input
                type="text"
                value={formData.recurrence}
                onChange={(e) => handleChange('recurrence', e.target.value)}
                style={styles.input}
                placeholder="e.g., 'Weekly on Mondays', 'Every 5th'"
                disabled={isSaving}
              />
            </div>
          )}

          {/* Due Date */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Due Date</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              style={styles.select}
              disabled={isSaving}
            />
          </div>

          {/* Priority */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Priority</label>
            <PrioritySelector
              value={formData.priority as 'low' | 'medium' | 'high'}
              onChange={(priority) => setFormData((prev) => ({ ...prev, priority }))}
              disabled={isSaving}
            />
          </div>

          {/* Labels */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Labels</label>
            <LabelEditor
              labels={formData.labels}
              onChange={(labels) => setFormData((prev) => ({ ...prev, labels }))}
              disabled={isSaving}
            />
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...styles.button, ...styles.cancelButton }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.button,
                ...styles.saveButton,
                ...(isSaving ? styles.saveButtonDisabled : {}),
              }}
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
