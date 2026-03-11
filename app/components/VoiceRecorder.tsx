// app/components/VoiceRecorder.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Activity, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchTeams } from '@/lib/api-client';
import { useRecordingLimit } from '@/hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { RecordingLimitBanner } from './UpgradePrompt';
import { extractDateFromText } from '@/lib/date-extractor';

// Constants
const MAX_RECORDING_SECONDS = 300;
const MIN_RECORDING_SECONDS = 1;
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
};

// Bug #5 Fix: Detect best supported mimeType for current browser (Safari doesn't support webm)
const getSupportedMimeType = (): string => {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        '',  // empty string = browser default
    ];
    return types.find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';
};

interface ExtractedData {
    summary: string;
    is_report?: boolean;
    report_text?: string;
    items: Array<{
        title: string;
        description: string;
        type: 'task' | 'reminder' | 'promise' | 'recurring';
        due_date: string | null;
        people_involved: string[];
        context: string;
    }>;
    tags: string[];
    sentiment: string;
    settings_action?: {
        action: string;
        value: string;
    };
}

interface Task {
    title: string;
    description: string;
    type: 'task' | 'reminder' | 'promise' | 'recurring';
    due_date: string | null;
    people_involved: string[];
    context: string;
}

export default function VoiceRecorder({
    userId,
    onTasksExtracted,
    onReportGenerated,
    onSettingsAction,
    onComplete,
    compact = false
}: {
    userId: string;
    onTasksExtracted?: (tasks: Task[]) => void;
    onReportGenerated?: (text: string) => void;
    onSettingsAction?: (action: string, value: string) => void;
    onComplete?: () => void;
    compact?: boolean;
}) {
    const { session } = useAuth();

    // State
    const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'paused' | 'processing' | 'success' | 'error'>('idle');
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));
    const [focusPulseCount, setFocusPulseCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ExtractedData | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAmbientMode, setIsAmbientMode] = useState(false);
    const [lastVoiceTime, setLastVoiceTime] = useState<number>(Date.now());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    // Recording limit check
    const { canRecord, remaining, reason, loading: limitLoading } = useRecordingLimit();
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastPulseTimeRef = useRef<number>(0);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const ambientPulseRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch teams
    useEffect(() => {
        if (session) {
            fetchTeams().then(setTeams).catch(console.error);
        }
    }, [session]);

    // Simple local extraction fallback
    const extractTasksFromTranscript = useCallback((transcript: string): ExtractedData => {
        console.log('[WORKING] Extracting from transcript:', transcript);

        const extractedItems: Array<{
            title: string;
            description: string;
            type: 'task' | 'reminder' | 'promise' | 'recurring';
            due_date: string | null;
            people_involved: string[];
            context: string;
        }> = [];

        const patterns = [
            { regex: /(?:i need to|need to|should|must|gotta|have to)\s+([^.!?]+)/gi, type: 'task' },
            { regex: /(?:todo|task)[\s:]*([^.!?]+)/gi, type: 'task' },
            { regex: /(?:remind me|reminder|remember to)\s+([^.!?]+(?:at|on|by|tomorrow|next|today)?)/gi, type: 'reminder' },
            { regex: /(?:call|contact|email|text)\s+([^.!?]+(?:at|on|by|tomorrow|next|today)?)/gi, type: 'reminder' },
            { regex: /(?:i will|i'll|i am going to|imma)\s+([^.!?]+)/gi, type: 'task' },
            { regex: /(?:i promise|i'll make sure|i guarantee)\s+([^.!?]+)/gi, type: 'promise' },
            { regex: /(?:every|daily|weekly|monthly|always)\s+([^.!?]+)/gi, type: 'recurring' },
        ];

        patterns.forEach(({ regex, type }) => {
            let match;
            regex.lastIndex = 0;
            while ((match = regex.exec(transcript)) !== null) {
                const content = match[1].trim();
                
                // Extract date from the content
                const dateExtraction = extractDateFromText(content);
                
                extractedItems.push({
                    title: content,
                    description: content,
                    type: type as any,
                    due_date: dateExtraction.date,
                    people_involved: [],
                    context: transcript
                });
            }
        });

        return {
            summary: extractedItems.length > 0
                ? `Extracted ${extractedItems.length} task(s) from local transcript`
                : 'Processed as voice memory',
            items: extractedItems,
            tags: [],
            sentiment: 'neutral'
        };
    }, []);

    // API Processing
    const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number) => {
        console.log('[WORKING] Starting processRecording...');
        setStatus('processing');
        const transcript = currentTranscript.trim();
        console.log('[WORKING] Current transcript:', transcript);

        // Bug #4 Fix: Reset status when transcript is empty — prevents frozen spinner
        if (!transcript) {
            console.log('[AMBIENT] Empty transcript, no content to process.');
            setStatus('idle');
            return;
        }

        console.log('[WORKING] Processing audio with team:', selectedTeamId);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, `recording.webm`);
            formData.append('duration', recordingDuration.toString());
            if (transcript) formData.append('transcript', transcript);
            if (selectedTeamId) formData.append('teamId', selectedTeamId);

            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/process-voice', {
                method: 'POST',
                headers,
                body: formData,
            });

            if (response.ok) {
                const apiResult: ExtractedData = await response.json();
                setResult(apiResult);
                setStatus('success');

                if (apiResult.is_report && apiResult.report_text) {
                    speakFeedback(apiResult.report_text);
                    onReportGenerated?.(apiResult.report_text);
                } else if (apiResult.settings_action?.action && apiResult.settings_action.action !== 'unknown') {
                    const { action, value } = apiResult.settings_action;
                    speakFeedback(`Applying setting: ${action.replace('_', ' ')} `);
                    onSettingsAction?.(action, value);
                } else if (apiResult.items?.length > 0 && (isAmbientMode || isFocusMode)) {
                    const message = `I've noted down: ${apiResult.items.map(i => i.title).join(', ')}`;
                    speakFeedback(message);
                }

                if (apiResult.items?.length > 0) {
                    onTasksExtracted?.(apiResult.items as Task[]);
                }
            } else {
                throw new Error(`API failed: ${response.status}`);
            }
        } catch (apiError) {
            console.error('[WORKING] API failure, falling back to local extraction:', apiError);
            try {
                const localExtracted = extractTasksFromTranscript(transcript);
                console.log('[WORKING] Local extraction result:', localExtracted);
                setResult(localExtracted);
                setStatus('success');
                if (localExtracted.items.length > 0) {
                    console.log('[WORKING] Calling onTasksExtracted with items:', localExtracted.items);
                    onTasksExtracted?.(localExtracted.items as Task[]);
                } else {
                    console.log('[WORKING] No items extracted from transcript');
                }
            } catch (localError) {
                console.error('[WORKING] Local extraction failed:', localError);
                setStatus('error');
                setError('Failed to extract tasks from voice');
            }
        }
    }, [currentTranscript, session?.access_token, selectedTeamId, extractTasksFromTranscript, onTasksExtracted, onSettingsAction, isAmbientMode, isFocusMode]);

    const pulseFocusMode = useCallback(async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

        console.log('[AMBIENT/FOCUS] Pulsing recording chunk...');
        setFocusPulseCount(prev => prev + 1);

        // Grab current data
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.requestData();
        }

        setTimeout(async () => {
            if (audioChunksRef.current.length === 0) return;
            const pulseBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            // In Ambient Mode or Focus Mode, we don't WANT to stop the recording, 
            // but we process what we have so far semanticly.
            // We clear chunks after pulse to keep processing discrete.
            const now = Date.now();
            const pulseDuration = Math.floor((now - (lastPulseTimeRef.current || startTimeRef.current)) / 1000);
            lastPulseTimeRef.current = now;

            // Keep the recognition going, but we can process the "Current" transcript
            await processRecording(pulseBlob, pulseDuration);

            // In Ambient Mode, we might want to reset the transcript after successful extraction 
            // to avoid duplicates, but usually the AI handles that.
            // For now, keep it simple.
        }, 500);
    }, [processRecording]);

    const speakFeedback = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Setup Visualizer
    const setupAudioAnalysis = useCallback((stream: MediaStream) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.75;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const updateVisualizer = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
                const level = Math.min(average / 128, 1);
                setAudioLevel(level);

                // Silence detection for Ambient Mode
                if (level > 0.05) {
                    setLastVoiceTime(Date.now());
                }

                const bars: number[] = [];
                const step = Math.floor(dataArray.length / 40);
                for (let i = 0; i < 40; i++) {
                    bars.push((dataArray[i * step] || 0) / 255);
                }
                setWaveformData(bars);
                animationRef.current = requestAnimationFrame(updateVisualizer);
            };
            updateVisualizer();
        } catch (err) {
            console.warn('[WORKING] Visualizer setup failed:', err);
        }
    }, []);

    const setupSpeechRecognition = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalTranscript += text + ' ';
                else interim = text;
            }
            setCurrentTranscript(finalTranscript + interim);
        };

        recognition.onend = () => {
            if (status === 'recording' && !isSpeaking) try { recognition.start(); } catch { }
        };

        return recognition;
    }, [status, isSpeaking]);

    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
        if (ambientPulseRef.current) clearInterval(ambientPulseRef.current);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current?.state !== 'closed') try { audioContextRef.current?.close(); } catch { }
        streamRef.current = null;
        analyserRef.current = null;
        mediaRecorderRef.current = null;
    }, []);

    const startRecording = useCallback(async () => {
        // Check recording limit before starting
        if (!limitLoading && !canRecord) {
            setShowLimitModal(true);
            return;
        }

        try {
            cleanup();
            setError(null);
            setResult(null);
            setDuration(0);
            setCurrentTranscript('');
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
            streamRef.current = stream;

            // Bug #5 Fix: Use detected mimeType for cross-browser support (Safari, iOS, Firefox)
            const mimeType = getSupportedMimeType();
            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            const recordingMimeType = mimeType || 'audio/webm';
            mediaRecorder.onstop = async () => {
                const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                if (finalDuration < MIN_RECORDING_SECONDS) {
                    setError('Recording too short');
                    setStatus('error');
                    return;
                }
                await processRecording(new Blob(audioChunksRef.current, { type: recordingMimeType }), finalDuration);
            };

            mediaRecorder.start(500);
            startTimeRef.current = Date.now();
            setStatus('recording');

            const recognition = setupSpeechRecognition();
            if (recognition) {
                recognitionRef.current = recognition;
                try { recognition.start(); } catch { }
            }

            if (isFocusMode) {
                lastPulseTimeRef.current = Date.now();
                focusIntervalRef.current = setInterval(pulseFocusMode, 60000);
            }

            if (isAmbientMode) {
                lastPulseTimeRef.current = Date.now();
                // Ambient mode pulses on silence OR every 2 mins as backup
                ambientPulseRef.current = setInterval(pulseFocusMode, 120000);
            }

            setupAudioAnalysis(stream);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('[WORKING] Mic access error:', err);
            setError('Microphone access denied or not found.');
            setStatus('error');
        }
    }, [cleanup, isFocusMode, isAmbientMode, processRecording, pulseFocusMode, setupAudioAnalysis, setupSpeechRecognition, canRecord, limitLoading]);

    // Update silence trigger
    useEffect(() => {
        if (!isAmbientMode || status !== 'recording') return;

        const silenceGap = Date.now() - lastVoiceTime;
        if (silenceGap > 3000 && currentTranscript.length > 10) {
            // If been silent for 3 seconds and we have something to say
            pulseFocusMode();
            setLastVoiceTime(Date.now()); // Reset
        }
    }, [lastVoiceTime, isAmbientMode, status, currentTranscript, pulseFocusMode]);

    const stopRecording = useCallback(() => {
        // Bug #3 Fix: Do NOT set status to 'idle' here.
        // mediaRecorder.stop() triggers onstop asynchronously, which calls processRecording.
        // The status flow is: recording → processing → success/error (controlled by processRecording).
        if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
        if (recognitionRef.current) try { recognitionRef.current.stop(); } catch { }
    }, []);

    // RENDER
    return (
        <div className={`flex flex-col items-center justify-between w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden rounded-3xl relative border border-white/5 shadow-2xl transition-all duration-500`}>
            {/* Top Bar / Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <button
                    onClick={() => {
                        setIsAmbientMode(!isAmbientMode);
                        setIsFocusMode(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isAmbientMode
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-glow-blue'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'}`}
                >
                    <Activity size={12} className={isAmbientMode ? 'animate-pulse' : ''} />
                    {isAmbientMode ? 'AMBIENT: ON' : 'AMBIENT MODE'}
                </button>

                <button
                    onClick={() => {
                        setIsFocusMode(!isFocusMode);
                        setIsAmbientMode(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isFocusMode
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-glow-amber'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'}`}
                >
                    <Activity size={12} className={isFocusMode ? 'animate-pulse' : ''} />
                    {isFocusMode ? 'FOCUS: ON' : 'FOCUS MODE'}
                </button>

                {teams.length > 0 && !compact && (
                    <div className="flex items-center gap-2 bg-slate-950/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
                        <Users size={12} className="text-purple-400" />
                        <select
                            value={selectedTeamId || ''}
                            onChange={(e) => setSelectedTeamId(e.target.value || null)}
                            className="bg-transparent text-white/80 text-[10px] font-bold outline-none cursor-pointer hover:text-white transition-colors uppercase tracking-wider"
                        >
                            <option value="" className="bg-slate-900">Personal</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Header Area */}
            <div className="w-full p-4 pt-6 text-center">
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">VoxValt <span className="text-purple-500 NOT-italic">v2</span></h1>
                <p className="text-[10px] text-purple-300/60 font-medium tracking-widest uppercase mt-1">
                    {status === 'recording' ? `REC • ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 'Ready to capture'}
                </p>
            </div>

            {/* Visualizer Area */}
            <div className="flex-1 w-full flex items-center justify-center relative px-8">
                {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 animate-spin" />
                            <Activity className="absolute inset-0 m-auto text-purple-500" size={32} />
                        </div>
                        <span className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">Synthesizing...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1 w-full h-24">
                        {waveformData.map((v, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-all duration-75 ${status === 'recording' ? 'bg-purple-500' : 'bg-white/10'}`}
                                style={{ height: `${Math.max(4, v * 96)}%`, opacity: 0.3 + (v * 0.7) }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Transcript Preview */}
            <div className="w-full px-6 mb-8 text-center">
                <p className="text-sm text-white/80 font-medium line-clamp-2 min-h-[2.5rem] italic">
                    {currentTranscript || (status === 'idle' ? 'Your thoughts, captured forever.' : 'Listening...')}
                </p>
            </div>

            {/* Controls */}
            <div className="w-full p-8 pt-0 flex flex-col items-center gap-4">
                <button
                    onClick={status === 'recording' ? stopRecording : startRecording}
                    className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'recording'
                        ? 'bg-red-500 shadow-glow-red scale-110'
                        : 'bg-white text-slate-900 hover:scale-105'}`}
                >
                    {status === 'recording' ? <Square size={24} fill="currentColor" /> : <Mic size={32} />}
                    {status === 'idle' && <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />}
                </button>

                {error && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{error}</span>}
                {result && status === 'success' && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Saved Successfully</span>
                        <p className="text-[10px] text-white/40 mt-1 max-w-[200px] line-clamp-1">{result.summary}</p>
                    </div>
                )}
            </div>

            {/* Recording Limit Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowLimitModal(false)}
                    />
                    <div className="relative bg-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full p-6 animate-scale-in">
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">
                                Recording Limit Reached
                            </h3>

                            <p className="text-sm text-white/60 mb-4">
                                {reason || "You've used your 5 free recordings this month."}
                            </p>

                            <button
                                onClick={() => {
                                    setShowLimitModal(false);
                                    window.location.href = '/pricing';
                                }}
                                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition-all active:scale-95"
                            >
                                Upgrade to Premium
                            </button>

                            <button
                                onClick={() => setShowLimitModal(false)}
                                className="w-full mt-3 py-2 text-sm text-white/40 hover:text-white/60"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
