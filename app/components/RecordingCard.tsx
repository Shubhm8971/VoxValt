'use client';

import { Recording } from '@/types';
import { Mic, Trash2, Copy } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';

interface RecordingCardProps {
  recording: Recording;
  onDelete?: (recordingId: string) => void;
}

export function RecordingCard({ recording, onDelete }: RecordingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recording.transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationMinutes = Math.floor(recording.duration / 60);
  const durationSeconds = Math.floor(recording.duration % 60);

  return (
    <div className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 transition-all">
      <div className="flex items-start gap-3">
        {/* Mic icon */}
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
          <Mic className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">
            Recording
          </h3>

          {/* Transcription preview */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {recording.transcription}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span>
              {durationMinutes}m {durationSeconds}s
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}</span>
          </div>

          <div className="text-xs text-gray-400">
            {format(new Date(recording.created_at), 'MMM d, yyyy h:mm a')}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-1">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-blue-100 rounded text-blue-500 hover:text-blue-700 transition-colors"
            title="Copy transcription"
          >
            <Copy className="w-4 h-4" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(recording.id)}
              className="p-2 hover:bg-red-100 rounded text-red-500 hover:text-red-700 transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {copied && (
        <div className="text-xs text-green-600 mt-2 font-medium">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
