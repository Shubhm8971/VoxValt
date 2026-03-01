// app/components/MemoryBoards.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Loader, Plus, Layout, Users, ChevronRight,
    ShoppingBag, Home, Briefcase, Heart,
    Calendar, Zap, Music, Pizza, Globe,
    Book, Coffee, Dumbbell, Car
} from 'lucide-react';

const AVAILABLE_ICONS = [
    { name: 'layout', Icon: Layout },
    { name: 'shopping-bag', Icon: ShoppingBag },
    { name: 'home', Icon: Home },
    { name: 'briefcase', Icon: Briefcase },
    { name: 'heart', Icon: Heart },
    { name: 'calendar', Icon: Calendar },
    { name: 'zap', Icon: Zap },
    { name: 'music', Icon: Music },
    { name: 'pizza', Icon: Pizza },
    { name: 'globe', Icon: Globe },
    { name: 'book', Icon: Book },
    { name: 'coffee', Icon: Coffee },
    { name: 'dumbbell', Icon: Dumbbell },
    { name: 'car', Icon: Car },
];

interface Board {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    team_id: string;
}

interface MemoryBoardsProps {
    teamId: string;
    onBoardSelect: (boardId: string | null) => void;
    selectedBoardId: string | null;
}

export function MemoryBoards({ teamId, onBoardSelect, selectedBoardId }: MemoryBoardsProps) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('layout');

    useEffect(() => {
        const fetchBoards = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/boards?teamId=${teamId}`);
                const data = await res.json();
                if (data.boards) {
                    setBoards(data.boards);
                }
            } catch (err) {
                console.error('Failed to load boards:', err);
            } finally {
                setLoading(false);
            }
        };

        if (teamId) {
            fetchBoards();
        }
    }, [teamId]);

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;

        try {
            const res = await fetch('/api/boards/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBoardName,
                    teamId,
                    icon: selectedIcon
                }),
            });
            const data = await res.json();
            if (data.success) {
                setBoards([...boards, data.board]);
                setNewBoardName('');
                setSelectedIcon('layout');
                setShowCreate(false);
            }
        } catch (err) {
            console.error('Failed to create board:', err);
        }
    };

    const getIcon = (name: string) => {
        const iconObj = AVAILABLE_ICONS.find(i => i.name === name) || AVAILABLE_ICONS[0];
        return iconObj.Icon;
    };

    if (loading) return <div className="flex justify-center p-4"><Loader className="animate-spin text-brand-500" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-vox-text flex items-center gap-2">
                    <Layout className="w-4 h-4 text-brand-500" />
                    Memory Boards
                </h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="p-1.5 hover:bg-vox-surface rounded-lg transition-colors text-vox-text-secondary"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {showCreate && (
                <div className="glass-card p-3 space-y-3 animate-fade-in border border-vox-border/50">
                    <input
                        type="text"
                        placeholder="Board name (e.g., Home, Work, Groceries)"
                        className="w-full bg-vox-bg border border-vox-border rounded-lg px-3 py-2 text-sm text-vox-text focus:border-brand-500 outline-none"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        autoFocus
                    />

                    <div className="flex flex-wrap gap-2 p-1">
                        {AVAILABLE_ICONS.map(({ name, Icon }) => (
                            <button
                                key={name}
                                onClick={() => setSelectedIcon(name)}
                                className={`p-2 rounded-lg transition-all ${selectedIcon === name
                                        ? 'bg-brand-500 text-white shadow-glow-sm shadow-brand-500/20'
                                        : 'bg-vox-surface text-vox-text-secondary hover:text-vox-text'
                                    }`}
                            >
                                <Icon size={16} />
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-3 py-1.5 text-xs text-vox-text-secondary hover:text-vox-text transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateBoard}
                            disabled={!newBoardName.trim()}
                            className="px-3 py-1.5 text-xs bg-brand-gradient rounded-lg font-medium disabled:opacity-50 text-white"
                        >
                            Create Board
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onBoardSelect(null)}
                    className={`
                        p-3 rounded-xl border flex flex-col gap-2 transition-all text-left
                        ${!selectedBoardId
                            ? 'bg-brand-gradient border-transparent shadow-glow shadow-brand-500/20 text-white'
                            : 'bg-vox-surface border-vox-border hover:border-vox-text-muted text-vox-text'}
                    `}
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedBoardId ? 'bg-white/10' : 'bg-vox-bg'}`}>
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold truncate">All Team</p>
                        <p className={`text-[10px] ${!selectedBoardId ? 'text-white/70' : 'text-vox-text-muted'}`}>Everything</p>
                    </div>
                </button>

                {boards.map((board) => {
                    const BoardIcon = getIcon(board.icon);
                    return (
                        <button
                            key={board.id}
                            onClick={() => onBoardSelect(board.id)}
                            className={`
                                p-3 rounded-xl border flex flex-col gap-2 transition-all text-left
                                ${selectedBoardId === board.id
                                    ? 'border-brand-500 bg-brand-500/10 shadow-glow-sm shadow-brand-500/10'
                                    : 'bg-vox-surface border-vox-border hover:border-vox-text-muted'}
                            `}
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${board.color}20` }}>
                                <BoardIcon className="w-4 h-4" style={{ color: board.color }} />
                            </div>
                            <div>
                                <p className="text-xs font-bold truncate text-vox-text">{board.name}</p>
                                <p className="text-[10px] text-vox-text-muted uppercase tracking-tighter font-semibold">Shared Board</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
