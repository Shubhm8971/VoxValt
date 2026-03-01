import { Task, Recording } from '@/types';

export type TaskStatus = 'all' | 'active' | 'completed';
export type TaskTypeFilter = 'all' | 'task' | 'reminder' | 'promise' | 'recurring';
export type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

export interface SearchFilters {
  searchText: string;
  taskStatus: TaskStatus;
  taskType: TaskTypeFilter;
  sortBy: 'recent' | 'dueDate' | 'priority' | 'smart';
  priority?: PriorityFilter;
  labels?: string[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

// Search tasks by text in title and description
export function searchTasks(tasks: Task[], filters: SearchFilters): Task[] {
  return tasks.filter((task) => {
    // Text search
    const searchLower = filters.searchText.toLowerCase();
    const matchesSearch =
      !filters.searchText ||
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Status filter
    if (filters.taskStatus === 'active' && task.completed) return false;
    if (filters.taskStatus === 'completed' && !task.completed) return false;

    // Type filter
    if (filters.taskType !== 'all' && task.task_type !== filters.taskType) {
      return false;
    }

    // Date range filter
    if (task.due_date) {
      const taskDate = new Date(task.due_date);
      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate);
        if (taskDate < startDate) return false;
      }
      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include entire end day
        if (taskDate > endDate) return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Labels filter
    if (filters.labels && filters.labels.length > 0 && task.labels) {
      const hasMatchingLabel = filters.labels.some((label) => task.labels?.includes(label));
      if (!hasMatchingLabel) return false;
    }

    return true;
  });
}

// Search recordings by text in transcription and date
export function searchRecordings(recordings: Recording[], filters: SearchFilters): Recording[] {
  return recordings.filter((recording) => {
    // Text search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      if (!recording.transcription.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Date range filter
    if (recording.created_at) {
      const recordingDate = new Date(recording.created_at);
      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate);
        if (recordingDate < startDate) return false;
      }
      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include entire end day
        if (recordingDate > endDate) return false;
      }
    }

    return true;
  });
}

// Get task statistics for display
export function getTaskStats(tasks: Task[]) {
  return {
    total: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    byType: {
      task: tasks.filter((t) => t.task_type === 'task').length,
      reminder: tasks.filter((t) => t.task_type === 'reminder').length,
      promise: tasks.filter((t) => t.task_type === 'promise').length,
      recurring: tasks.filter((t) => t.task_type === 'recurring').length,
    },
  };
}

// Calculate a priority score for a task
export function calculateSmartScore(task: Task): number {
  let score = 0;
  const now = new Date();

  // 1. Urgency (Due Date)
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      score += 100; // Overdue
    } else if (daysDiff === 0) {
      score += 80; // Due today
    } else if (daysDiff === 1) {
      score += 50; // Due tomorrow
    } else if (daysDiff <= 7) {
      score += 20; // Due within a week
    }
  }

  // 2. Commitment Weight
  if (task.task_type === 'promise' || task.type === 'promise') {
    score += 40;
  }

  // 3. Manual Priority
  if (task.priority === 'high') {
    score += 30;
  } else if (task.priority === 'medium') {
    score += 10;
  }

  // 4. Recency
  if (task.created_at) {
    const createdAt = new Date(task.created_at);
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
    score += Math.max(0, 10 - ageInDays); // Fresh items get a small boost
  }

  // 5. Completion Penalty
  if (task.completed) {
    score -= 1000; // Completed items go to the bottom
  }

  return score;
}

// Sort tasks by various criteria
export function sortTasks(tasks: Task[], sortBy: 'recent' | 'dueDate' | 'priority' | 'smart'): Task[] {
  const sorted = [...tasks];

  if (sortBy === 'dueDate') {
    sorted.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  } else if (sortBy === 'recent') {
    sorted.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  } else if (sortBy === 'smart') {
    sorted.sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a));
  } else if (sortBy === 'priority') {
    const priorityMap = { high: 3, medium: 2, low: 1, undefined: 0 };
    sorted.sort((a, b) => {
      const pA = priorityMap[a.priority || 'undefined'] || 0;
      const pB = priorityMap[b.priority || 'undefined'] || 0;
      return pB - pA;
    });
  }

  return sorted;
}
