'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface LabelEditorProps {
  labels: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
  availableLabels?: string[];
}

const DEFAULT_LABELS = ['work', 'personal', 'urgent', 'follow-up', 'meeting', 'research', 'shopping'];

export function LabelEditor({
  labels,
  onChange,
  disabled,
  availableLabels = DEFAULT_LABELS,
}: LabelEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLabel = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !labels.includes(trimmed)) {
      onChange([...labels, trimmed]);
      setInputValue('');
      setIsAdding(false);
    }
  };

  const handleRemoveLabel = (label: string) => {
    onChange(labels.filter((l) => l !== label));
  };

  const handleSelectLabel = (label: string) => {
    if (!labels.includes(label)) {
      onChange([...labels, label]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected labels */}
      {labels.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {labels.map((label) => (
            <div
              key={label}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border-2 border-blue-300"
            >
              <span>{label}</span>
              <button
                onClick={() => handleRemoveLabel(label)}
                disabled={disabled}
                className="hover:text-blue-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new label input */}
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLabel();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setInputValue('');
              }
            }}
            placeholder="Enter label name..."
            className="flex-1 px-3 py-1 border-2 border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled}
            autoFocus
          />
          <button
            onClick={handleAddLabel}
            disabled={disabled || !inputValue.trim()}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
        >
          + Add Label
        </button>
      )}

      {/* Quick label suggestions */}
      {isAdding && availableLabels.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {availableLabels
            .filter((label) => !labels.includes(label.toLowerCase()))
            .slice(0, 5)
            .map((label) => (
              <button
                key={label}
                onClick={() => handleSelectLabel(label.toLowerCase())}
                disabled={disabled}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border-2 border-gray-300 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function LabelBadges({ labels }: { labels?: string[] }) {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {labels.map((label) => (
        <span
          key={label}
          className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-300"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
