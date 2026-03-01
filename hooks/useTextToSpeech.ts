// hooks/useTextToSpeech.ts
import { useState, useCallback } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a high-quality "assistant" voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Premium')
        );

        if (preferredVoice) utterance.voice = preferredVoice;

        // Adjust tone to match VoxValt's "supportive" persona
        utterance.pitch = 1.05; // Slightly higher/friendly
        utterance.rate = 0.95;  // Slightly slower for clarity

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking };
};