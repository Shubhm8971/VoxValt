// components/voice-recorder.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type ProcessingStatus = 'idle' | 'recording' | 'processing' | 'success' | 'error';

interface ExtractedItem {
    content: string;
    type: string;
    priority: string;
}

interface ProcessingResult {
    transcription: string;
    extracted: {
        summary: string;
        items: ExtractedItem[];
        tags: string[];
        sentiment: string;
    };
    saved_count: number;
}

export default function VoiceRecorder() {
    const [status, setStatus] = useState<ProcessingStatus>('idle');
    const [result, setResult] = useState<ProcessingResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setResult(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm',
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                if (audioBlob.size < 1000) {
                    setError('Recording too short. Please try again.');
                    setStatus('idle');
                    return;
                }

                await processAudio(audioBlob);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000); // Collect in 1s chunks

            setStatus('recording');
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration((d) => d + 1);
            }, 1000);

        } catch (err: any) {
            setError(
                err.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone access in your browser settings.'
                    : `Failed to start recording: ${err.message}`
            );
            setStatus('error');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const processAudio = async (audioBlob: Blob) => {
        setStatus('processing');

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/process-voice', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Processing failed');
            }

            const data: ProcessingResult = await response.json();
            setResult(data);
            setStatus('success');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const typeColors: Record<string, string> = {
        task: 'bg-blue-100 text-blue-800 border-blue-200',
        promise: 'bg-amber-100 text-amber-800 border-amber-200',
        reminder: 'bg-purple-100 text-purple-800 border-purple-200',
        idea: 'bg-green-100 text-green-800 border-green-200',
        memo: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Recording Button */}
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={status === 'recording' ? stopRecording : startRecording}
                    disabled={status === 'processing'}
                    className={`
            relative w-24 h-24 rounded-full transition-all duration-300
            flex items-center justify-center
            ${status === 'recording'
                            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                            : status === 'processing'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                        }
            shadow-lg active:scale-95
          `}
                >
                    {status === 'recording' ? (
                        <div className="w-8 h-8 bg-white rounded-sm" />
                    ) : status === 'processing' ? (
                        <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    )}
                </button>

                {/* Status Text */}
                <div className="text-center">
                    {status === 'recording' && (
                        <p className="text-red-600 font-medium text-lg">
                            Recording... {formatDuration(duration)}
                        </p>
                    )}
                    {status === 'processing' && (
                        <p className="text-gray-600 font-medium">
                            Processing your voice note...
                        </p>
                    )}
                    {status === 'idle' && (
                        <p className="text-gray-500">Tap to start recording</p>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                        onClick={() => { setError(null); setStatus('idle'); }}
                        className="mt-2 text-red-600 underline text-sm"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div className="mt-8 space-y-6">
                    {/* Transcription */}
                    <div className="p-4 bg-gray-50 rounded-xl border">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Transcription
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{result.transcription}</p>
                    </div>

                    {/* Extracted Items */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Extracted ({result.saved_count} items saved)
                        </h3>
                        <div className="space-y-3">
                            {result.extracted.items.map((item, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl border ${typeColors[item.type] || typeColors.memo}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {item.type}
                                        </span>
                                        {item.priority === 'high' && (
                                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                HIGH
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-medium">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    {result.extracted.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {result.extracted.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-200"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Record Another */}
                    <button
                        onClick={() => { setResult(null); setStatus('idle'); setDuration(0); }}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
                    >
                        Record Another Note
                    </button>
                </div>
            )}
        </div>
    );
}