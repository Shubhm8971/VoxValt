// app/components/TeamManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Copy, Check, Shield, User } from 'lucide-react';
import { fetchTeams, createTeam, joinTeam } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { TeamCalendar } from './TeamCalendar';

export function TeamManager({ onTeamsUpdate }: { onTeamsUpdate?: () => void }) {
    const [teams, setTeams] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const { session } = useAuth();
    const currentUserId = session?.user?.id;

    const loadTeams = async () => {
        setLoading(true);
        try {
            const data = await fetchTeams();
            setTeams(data);
            if (data.length > 0 && !selectedTeamId) {
                setSelectedTeamId(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load teams', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async (teamId: string) => {
        try {
            const res = await fetch(`/api/teams/${teamId}`);
            const data = await res.json();
            if (data.success) {
                setMembers(data.members);
            }
        } catch (err) {
            console.error('Failed to load members', err);
        }
    };

    useEffect(() => {
        loadTeams();
    }, []);

    useEffect(() => {
        if (selectedTeamId) {
            loadMembers(selectedTeamId);
        }
    }, [selectedTeamId]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        setLoading(true);
        try {
            await createTeam(newTeamName);
            setNewTeamName('');
            await loadTeams();
            onTeamsUpdate?.();
        } catch (err) {
            alert('Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        setLoading(true);
        try {
            await joinTeam(inviteCode);
            setInviteCode('');
            await loadTeams();
            onTeamsUpdate?.();
            alert('Successfully joined team!');
        } catch (err: any) {
            alert(err.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!selectedTeamId || !confirm('Are you sure you want to leave this team?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${selectedTeamId}/leave`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to leave team');
            await loadTeams();
            setSelectedTeamId(null);
            onTeamsUpdate?.();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedTeamId || !confirm('Remove this member?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${selectedTeamId}/members/${userId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove member');
            await loadMembers(selectedTeamId);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisbandTeam = async () => {
        if (!selectedTeamId || !confirm('STRICT WARNING: This will permanently dissolve the team and all shared memories. Continue?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${selectedTeamId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to disband team');
            await loadTeams();
            setSelectedTeamId(null);
            onTeamsUpdate?.();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="bg-vox-surface border border-vox-border rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            <div className="flex border-b border-vox-border">
                <div className="p-6 flex-1">
                    <h3 className="text-lg font-bold text-vox-text flex items-center gap-2">
                        <Users className="text-purple-500" size={20} />
                        Team & Family Management
                    </h3>
                    <p className="text-sm text-vox-text-secondary mt-1">Collaborate on memories and shared tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
                {/* Team Sidebar */}
                <div className="lg:border-r border-vox-border p-4 bg-slate-950/20">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-vox-text-muted uppercase tracking-widest mb-3">Your Teams</h4>
                            <div className="space-y-1">
                                {teams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeamId(team.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${selectedTeamId === team.id
                                            ? 'bg-brand-600 text-white shadow-glow-indigo'
                                            : 'text-vox-text-secondary hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="font-semibold truncate">{team.name}</span>
                                        {selectedTeamId === team.id && <Shield size={12} className="opacity-60" />}
                                    </button>
                                ))}
                                {teams.length === 0 && (
                                    <p className="text-xs text-vox-text-muted py-2 italic text-center">No teams yet</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-vox-border/50">
                            <h4 className="text-[10px] font-bold text-vox-text-muted uppercase tracking-widest mb-3">Actions</h4>
                            <div className="space-y-3">
                                <form onSubmit={handleCreateTeam} className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="New Team Name"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-vox-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-vox-text-muted focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !newTeamName.trim()}
                                        className="w-full bg-white text-slate-950 text-[10px] font-bold py-2 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 uppercase tracking-wider"
                                    >
                                        Create Team
                                    </button>
                                </form>

                                <form onSubmit={handleJoinTeam} className="space-y-2 pt-2">
                                    <input
                                        type="text"
                                        placeholder="Invite Code"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-vox-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-vox-text-muted focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !inviteCode.trim()}
                                        className="w-full bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50 uppercase tracking-wider border border-white/5 flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={12} />
                                        Join Team
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Details / Members / Calendar */}
                <div className="p-6 space-y-6">
                    {selectedTeamId ? (
                        <>
                            {/* Team Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-xl font-bold text-vox-text">{teams.find(t => t.id === selectedTeamId)?.name}</h4>
                                    <p className="text-xs text-vox-text-secondary mt-1">Manage members, calendars, and team settings.</p>
                                </div>
                                <div className="bg-slate-950/40 p-3 rounded-2xl border border-vox-border">
                                    <span className="text-[10px] font-bold text-vox-text-muted uppercase tracking-widest block mb-1">Invite Code</span>
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-mono font-black text-purple-400">
                                            {teams.find(t => t.id === selectedTeamId)?.invite_code || '------'}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(teams.find(t => t.id === selectedTeamId)?.invite_code)}
                                            className="p-1.5 text-vox-text-secondary hover:text-white transition-colors"
                                            title="Copy Code"
                                        >
                                            {copied === teams.find(t => t.id === selectedTeamId)?.invite_code ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Team Calendar */}
                            <TeamCalendar teamId={selectedTeamId} />

                            {/* Member List */}
                            <div>
                                <h5 className="text-[10px] font-bold text-vox-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                    Members ({members.length})
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {members.map((member, i) => {
                                        const isMe = member.user.id === currentUserId;
                                        const currentTeam = teams.find(t => t.id === selectedTeamId);
                                        const iAmOwner = currentTeam?.owner_id === currentUserId;
                                        const iAmAdmin = members.find(m => m.user.id === currentUserId)?.role === 'admin';
                                        const canRemove = (iAmOwner || iAmAdmin) && !isMe && member.role !== 'owner';

                                        return (
                                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3 group hover:border-purple-500/30 transition-all">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                                                    {member.user.avatar_url ? (
                                                        <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={18} className="text-purple-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">
                                                        {member.user.full_name || member.user.email.split('@')[0]}
                                                        {isMe && <span className="ml-2 text-[10px] bg-white/10 px-1 py-0.5 rounded text-white/40">YOU</span>}
                                                    </p>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">{member.role}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {member.role === 'admin' || member.user.id === currentTeam?.owner_id ? (
                                                        <Shield size={14} className="text-amber-500/50" />
                                                    ) : null}
                                                    {canRemove && (
                                                        <button
                                                            onClick={() => handleRemoveMember(member.user.id)}
                                                            className="p-1.5 text-vox-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                            title="Remove Member"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-vox-border/50 flex flex-wrap gap-4">
                                {teams.find(t => t.id === selectedTeamId)?.owner_id !== currentUserId ? (
                                    <button
                                        onClick={handleLeaveTeam}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        Leave Team
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleDisbandTeam}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        Disband Team (Permanent)
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Users size={32} className="text-vox-text-muted" />
                            </div>
                            <div>
                                <h4 className="text-vox-text font-bold">No Team Selected</h4>
                                <p className="text-sm text-vox-text-muted max-w-[200px]">Select or create a team to start collaborating.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
