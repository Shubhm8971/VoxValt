'use client';

import { useState, useEffect } from 'react';
import { Slack, Hash, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface IntegrationSettingsProps {
    teamId: string;
}

export function IntegrationSettings({ teamId }: IntegrationSettingsProps) {
    const [slackTeamId, setSlackTeamId] = useState('');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [existing, setExisting] = useState<any>(null);

    const loadSlackInfo = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/integrations/slack`);
            const data = await res.json();
            if (data.success && data.slackTeam) {
                setExisting(data.slackTeam);
                setSlackTeamId(data.slackTeam.slack_team_id);
            } else {
                setExisting(null);
                setSlackTeamId('');
            }
        } catch (err) {
            console.error('Failed to load Slack integration', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSlackInfo();
    }, [teamId]);

    const handleSave = async () => {
        if (!slackTeamId.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/integrations/slack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slackTeamId })
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setExisting(data.slackTeam);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            alert('Failed to save Slack integration');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Disconnect Slack for this team?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/integrations/slack`, { method: 'DELETE' });
            if (res.ok) {
                setExisting(null);
                setSlackTeamId('');
            }
        } catch (err) {
            alert('Failed to disconnect Slack');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 border border-vox-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center">
                        <Slack size={20} color="white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-vox-text">Slack Connector</h4>
                        <p className="text-[10px] text-vox-text-secondary">Sync AI Pulses and search from Slack.</p>
                    </div>
                </div>
                {existing ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[10px] font-black text-green-500 uppercase">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                        <AlertCircle size={12} className="text-vox-text-muted" />
                        <span className="text-[10px] font-black text-vox-text-muted uppercase">Not Linked</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-vox-text-muted group-focus-within:text-purple-400">
                        <Hash size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="Slack Team ID (e.g. T012A3BC45)"
                        value={slackTeamId}
                        onChange={(e) => setSlackTeamId(e.target.value.toUpperCase())}
                        className="w-full bg-black/40 border border-vox-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={loading || !slackTeamId.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${saved
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-slate-950 hover:bg-slate-200'
                            }`}
                    >
                        {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                        {saved ? 'Saved' : 'Save Connection'}
                    </button>
                    {existing && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="w-12 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 py-2.5 rounded-xl hover:bg-red-500/20 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="pt-2">
                <p className="text-[11px] text-vox-text-muted leading-relaxed">
                    To find your Team ID, open Slack in your browser. The ID is the last part of the URL: <code className="text-purple-400 bg-purple-500/10 px-1 rounded">.../client/T.../...</code>
                </p>
            </div>
        </div>
    );
}
