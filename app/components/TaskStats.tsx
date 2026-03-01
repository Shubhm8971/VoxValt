'use client';

import { Task } from '@/types';
import { CheckCircle2, Circle, AlertCircle, Repeat2 } from 'lucide-react';

interface TaskStatsProps {
  tasks: Task[] | { total: number; active: number; completed: number; byType: { task: number; reminder: number; promise: number; recurring: number } };
}

export function TaskStats({ tasks }: TaskStatsProps) {
  let total: number;
  let completed: number;
  let pending: number;
  let tasksByType: { task: number; reminder: number; promise: number; recurring: number };

  if (Array.isArray(tasks)) {
    total = tasks.length;
    completed = tasks.filter((t) => t.completed).length;
    pending = total - completed;
    tasksByType = {
      task: tasks.filter((t) => t.task_type === 'task').length,
      reminder: tasks.filter((t) => t.task_type === 'reminder').length,
      promise: tasks.filter((t) => t.task_type === 'promise').length,
      recurring: tasks.filter((t) => t.task_type === 'recurring').length,
    };
  } else {
    total = tasks.total;
    completed = tasks.completed;
    pending = tasks.active;
    tasksByType = tasks.byType;
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: total,
      icon: Circle,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Pending',
      value: pending,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-4 rounded-lg border-2 border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task breakdown */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Type</h3>
        <div className="space-y-3">
          {[
            { type: 'task', label: 'To-Do', color: 'bg-blue-100' },
            { type: 'reminder', label: 'Reminders', color: 'bg-yellow-100' },
            { type: 'promise', label: 'Promises', color: 'bg-purple-100' },
            { type: 'recurring', label: 'Recurring', color: 'bg-green-100' },
          ].map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {tasksByType[item.type as keyof typeof tasksByType]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
