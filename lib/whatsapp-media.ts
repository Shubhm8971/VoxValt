import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Downloads a media file from Twilio and transcribes it using Google Gemini
 */
export async function transcribeWhatsAppMedia(mediaUrl: string, mimeType: string): Promise<string> {
    try {
        const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            throw new Error('Google AI API key not found');
        }

        // 1. Fetch the media from Twilio
        // Note: Twilio media URLs might require basic auth (AccountSid:AuthToken) 
        // but usually they are accessible for a short period if configured.
        const response = await fetch(mediaUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch media from Twilio: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Media = buffer.toString('base64');

        // 2. Transcribe using Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Media,
                    mimeType: mimeType || 'audio/mpeg', // Default to mp3 if unknown
                },
            },
            "Please transcribe this voice message accurately. Only return the transcription text, nothing else.",
        ]);

        const transcription = result.response.text().trim();
        console.log(`WhatsApp Media Transcription: ${transcription}`);

        return transcription;
    } catch (error) {
        console.error('Error transcribing WhatsApp media:', error);
        return '';
    }
}
