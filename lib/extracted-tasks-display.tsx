'use client'

import { Task } from '@/types'
import { format } from 'date-fns'

interface ExtractedTaskDisplayProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function ExtractedTasksDisplay({ tasks, onTaskClick }: ExtractedTaskDisplayProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-400 p-4">
        No tasks extracted yet. Start recording to extract tasks!
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-4">
      <h3 className="font-semibold text-gray-700 mb-3">✨ Extracted Tasks:</h3>

      {tasks.map((task, idx) => (
        <div
          key={idx}
          onClick={() => onTaskClick?.(task)}
          className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <p className="font-semibold text-gray-900 text-sm">
            {task.title}
          </p>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskTypeColor(task.type || task.task_type)}`}>
              {task.type || task.task_type || 'task'}
            </span>

            {task.due_date && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 flex items-center gap-1">
                📅 {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}

            {!task.due_date && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                No due date
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 mt-2">{task.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function getTaskTypeColor(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'task':
      return 'bg-blue-100 text-blue-800'
    case 'reminder':
      return 'bg-yellow-100 text-yellow-800'
    case 'promise':
      return 'bg-purple-100 text-purple-800'
    case 'recurring':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
