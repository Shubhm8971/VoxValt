// app/components/MemoryCard.tsx
'use client';

import { useState } from 'react';
import { Task, Recording } from '@/types';
import { format } from 'date-fns';
import {
    CheckCircle2,
    Circle,
    Mic,
    Play,
    Pause,
    Calendar,
    MoreVertical,
    Trash2,
    Edit2,
    Clock,
    Repeat,
    Lock,
    Zap,
    Users
} from 'lucide-react';
import { formatDuration } from '@/lib/time-utils';

interface MemoryCardProps {
    item: Task | Recording;
    type: 'task' | 'recording';
    onStatusChange?: (task: Task) => void;
    onDelete: (id: string, type: 'task' | 'recording') => void;
    onEdit?: (task: Task) => void;
    onPlayRecording?: (p: { id: string, url: string }) => void;
    isLocked?: boolean;
    isHot?: boolean;
}

export function MemoryCard({
    item,
    type,
    onStatusChange,
    onDelete,
    onEdit,
    onPlayRecording,
    isLocked = false,
    isHot = false
}: MemoryCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const isTask = type === 'task';

    // Cast based on type to access specific fields safely
    const task = isTask ? (item as Task) : null;
    const recording = !isTask ? (item as Recording) : null;

    // normalize date access
    const createdDate = isTask
        ? (task?.created_at ? new Date(task.created_at) : new Date())
        : (recording?.created_at ? new Date(recording.created_at) : new Date());

    const dateDisplay = format(createdDate, 'MMM d, h:mm a');

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isTask && onStatusChange && task) {
            onStatusChange({ ...task, completed: !task.completed });
        }
    };

    const [syncing, setSyncing] = useState(false);
    const handleAddToCalendar = async () => {
        if (!task || !task.due_date) return;
        setSyncing(true);
        try {
            const res = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: task.id }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('Added to Google Calendar!'); // user-friendly toast would be better but alert for now
                setShowMenu(false);
            } else {
                alert('Failed to sync: ' + data.error);
            }
        } catch (e) {
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = () => {
        if (item.id) {
            onDelete(item.id, type);
        }
        setShowMenu(false);
    };

    return (
        <div className={`group relative bg-white hover:bg-gray-50 rounded-xl border ${isHot ? 'border-amber-400 shadow-amber-100 shadow-glow animate-pulse-slow' : 'border-gray-100'} hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 mb-3 ${isLocked ? 'grayscale-[0.5] opacity-80 overflow-hidden' : ''}`}>
            {isHot && (
                <div className="absolute -top-2 -right-2 z-20">
                    <div className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                        🔥 URGENT
                    </div>
                </div>
            )}
            {isLocked && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2">
                        <Lock size={14} className="text-brand-500" />
                        <span className="text-xs font-bold text-gray-800 tracking-tight uppercase">Locked • Premium Only</span>
                    </div>
                </div>
            )}
            <div className="flex items-start gap-4">
                {/* Icon / Status Indicator */}
                <div className="mt-1 flex-shrink-0">
                    {isTask ? (
                        <button
                            onClick={handleStatusClick}
                            className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-colors
                ${task?.completed
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
              `}
                        >
                            {task?.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Mic size={16} />
                        </div>
                    )}

                    {isTask && task?.type === 'promise' && (
                        <div className="mt-2 w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center animate-pulse shadow-sm">
                            <Zap size={16} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <h3 className={`font-medium text-gray-900 pr-8 ${isTask && task?.completed ? 'line-through text-gray-500' : ''} ${isTask && task?.type === 'promise' ? 'text-amber-900 decoration-amber-500/30 font-semibold' : ''}`}>
                            {isTask ? task?.title : 'Voice Memo'}
                            {isTask && task?.type === 'promise' && (
                                <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">COMMITMENT</span>
                            )}
                        </h3>

                        {/* Menu Trigger */}
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* Context Menu */}
                        {showMenu && (
                            <div className="absolute top-10 right-4 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-100">
                                {isTask && onEdit && (
                                    <button
                                        onClick={() => { if (task) onEdit(task); setShowMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                )}
                                {isTask && task?.due_date && (
                                    <button
                                        onClick={handleAddToCalendar}
                                        disabled={syncing}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Calendar size={14} /> {syncing ? 'Syncing...' : 'Add to Calendar'}
                                    </button>
                                )}
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {isTask ? task?.description : recording?.transcription || 'No transcription available.'}
                    </p>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {dateDisplay}
                        </span>

                        {isTask && task?.due_date && (
                            <span className={`flex items-center gap-1 ${new Date(task.due_date).getTime() < Date.now() ? 'text-red-500' : ''
                                }`}>
                                <Calendar size={12} />
                                {format(new Date(task.due_date), 'MMM d')}
                            </span>
                        )}

                        {isTask && task?.recurrence && (
                            <span className="flex items-center gap-1 text-purple-600">
                                <Repeat size={12} />
                                {task.recurrence}
                            </span>
                        )}

                        {isTask && task?.type && (
                            <span className="capitalize">{task.type}</span>
                        )}

                        {item.team_id && (
                            <span className="flex items-center gap-1 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase tracking-tighter text-[9px]">
                                <Users size={10} />
                                Shared
                            </span>
                        )}

                        {!isTask && recording && (
                            <span className="flex items-center gap-1 font-mono">
                                {formatDuration(recording.duration || 0)}
                            </span>
                        )}
                    </div>

                    {/* Audio Player Control (Simplified) */}
                    {!isTask && recording && (
                        <div className="mt-3">
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors"
                                onClick={() => onPlayRecording?.({ id: recording.id, url: recording.audio_url })}
                            >
                                <Play size={12} className="fill-current" />
                                Play Recording
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
