'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Sparkles } from 'lucide-react';

export function ChatAssistant({ teamId, boardId }: { teamId?: string | null; boardId?: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim() || isLoading) return;

        const userMessage = query.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    teamId,
                    boardId
                }),
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my memory right now. Please check your connection." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 ${isOpen ? 'bg-vox-surface border border-vox-border rotate-90' : 'bg-brand-600 text-white hover:bg-brand-500 scale-110 hover:rotate-12'
                    }`}
            >
                {isOpen ? <X size={24} className="text-vox-text" /> : <MessageSquare size={24} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[90vw] sm:w-[400px] max-h-[600px] h-[70vh] bg-vox-surface border border-vox-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-vox-border bg-gradient-to-r from-vox-surface to-brand-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-600/20 rounded-lg text-brand-500">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-vox-text">Ask VoxValt</h3>
                                <p className="text-[10px] text-vox-text-secondary uppercase tracking-widest font-black">Conversational Memory</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-vox-border/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MessageSquare size={20} className="text-vox-text-muted" />
                                </div>
                                <p className="text-sm text-vox-text-secondary px-6">
                                    "What did I discuss with Shubh last Friday?" or "Any tasks related to the roadmap?"
                                </p>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                        ? 'bg-brand-600 text-white rounded-tr-none'
                                        : 'bg-vox-border/30 text-vox-text rounded-tl-none border border-vox-border/50'
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-vox-border/30 p-3 rounded-2xl rounded-tl-none border border-vox-border/50">
                                    <Loader2 size={16} className="animate-spin text-brand-500" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-vox-border bg-vox-surface">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'ENTER' && handleSend()}
                                placeholder="Ask your memory assistant..."
                                className="w-full bg-vox-border/20 border border-vox-border rounded-xl py-3 pl-4 pr-12 text-sm text-vox-text focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!query.trim() || isLoading}
                                className="absolute right-2 p-2 text-brand-500 hover:text-brand-400 disabled:opacity-50 transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
