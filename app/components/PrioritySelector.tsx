'use client';

import { useState } from 'react';

interface PrioritySelectorProps {
  value?: 'low' | 'medium' | 'high';
  onChange: (priority: 'low' | 'medium' | 'high') => void;
  disabled?: boolean;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  high: { label: 'High', color: 'bg-red-100 text-red-800 border-red-300' },
};

export function PrioritySelector({ value = 'medium', onChange, disabled }: PrioritySelectorProps) {
  return (
    <div className="flex gap-2">
      {Object.entries(priorityConfig).map(([key, { label, color }]) => (
        <button
          key={key}
          onClick={() => onChange(key as 'low' | 'medium' | 'high')}
          disabled={disabled}
          className={`px-3 py-1 rounded-full text-sm font-semibold border-2 transition-all ${
            value === key
              ? `${color} border-current`
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PriorityBadge({ priority = 'medium' }: { priority?: 'low' | 'medium' | 'high' }) {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
