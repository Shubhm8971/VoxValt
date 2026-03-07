'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Phone, CheckCircle, Smartphone, AlertCircle, Loader2 } from 'lucide-react';

export function WhatsAppSettings() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLinked, setIsLinked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchWhatsAppMapping();
    }, []);

    async function fetchWhatsAppMapping() {
        try {
            const supabase = getSupabase();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('whatsapp_users')
                .select('phone_number')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setPhoneNumber(data.phone_number);
                setIsLinked(true);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp mapping:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLink() {
        if (!phoneNumber.trim()) {
            setMessage({ type: 'error', text: 'Please enter a valid phone number.' });
            return;
        }

        // Basic format check (must start with +)
        if (!phoneNumber.startsWith('+')) {
            setMessage({ type: 'error', text: 'Phone number must start with + and include country code (e.g., +919876543210).' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const supabase = getSupabase();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('whatsapp_users')
                .upsert({
                    user_id: user.id,
                    phone_number: phoneNumber.replace(/\s+/g, ''),
                    updated_at: new Date().toISOString()
                });

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This phone number is already linked to another account.');
                }
                throw error;
            }

            setIsLinked(true);
            setMessage({ type: 'success', text: 'WhatsApp number linked successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to link phone number.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleUnlink() {
        setSaving(true);
        try {
            const supabase = getSupabase();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('whatsapp_users')
                .delete()
                .eq('user_id', user.id);

            setPhoneNumber('');
            setIsLinked(false);
            setMessage({ type: 'success', text: 'WhatsApp number unlinked.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to unlink phone number.' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Smartphone className="w-32 h-32 text-purple-500" />
            </div>

            <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    <Phone className="text-green-500 w-8 h-8" />
                    WhatsApp Assistant
                </h2>
                <p className="text-slate-400 mb-8 max-w-xl">
                    Turn VoxValt into your personal WhatsApp memory assistant. Send text or voice notes to our bot, and we'll extract tasks for you.
                </p>

                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                            Your WhatsApp Number
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="+919876543210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isLinked}
                                className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                            />
                            {isLinked ? (
                                <button
                                    onClick={handleUnlink}
                                    disabled={saving}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold transition-all border border-red-500/20"
                                >
                                    Unlink
                                </button>
                            ) : (
                                <button
                                    onClick={handleLink}
                                    disabled={saving}
                                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Link Number
                                </button>
                            )}
                        </div>
                        {message.text && (
                            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}
                    </div>

                    {isLinked && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-wide text-xs">
                                <CheckCircle className="text-purple-400 w-4 h-4" />
                                Next Steps
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-black">1</div>
                                    <p className="text-slate-300 text-sm">
                                        Add <span className="text-white font-bold">+1 (415) 523-8886</span> to your contacts as <span className="text-white font-bold">VoxValt Assistant</span>.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-black">2</div>
                                    <p className="text-slate-300 text-sm">
                                        Send <span className="text-white font-bold">join [YOUR_SANDBOX_CODE]</span> to that number.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-black">3</div>
                                    <p className="text-slate-300 text-sm">
                                        Start sending voice notes or text like <span className="italic text-slate-400">"I'll send the report by 5pm"</span>.
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-widest text-center">
                                Powered by Groq & Gemini Intelligence
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
