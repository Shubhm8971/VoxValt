import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { extractTasksFromTranscription } from '@/lib/ai-extract';
import { transcribeWhatsAppMedia } from '@/lib/whatsapp-media';
import twilio from 'twilio';

// Twilio webhook route
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const params = new URLSearchParams(rawBody);
        const body = Object.fromEntries(params.entries());

        // 1. Signature Validation
        const signature = req.headers.get('x-twilio-signature');
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const url = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL || req.url;

        if (authToken && signature) {
            const isValid = twilio.validateRequest(authToken, signature, url, body);
            if (!isValid) {
                console.error('Invalid Twilio signature');
                return new NextResponse('Forbidden', { status: 403 });
            }
        } else if (process.env.NODE_ENV === 'production') {
            console.warn('Twilio Auth Token or signature missing in production');
        }

        const from = body.From as string; // WhatsApp number (e.g., whatsapp:+1234567890)
        const text = body.Body as string;
        const mediaUrl = body.MediaUrl0 as string;
        const mediaType = body.MediaContentType0 as string;

        console.log(`Received WhatsApp message from ${from}: ${text || '[Media]'}`);

        const supabase = createServerClient();

        // 1. Find the user associated with this phone number
        const phoneNumber = from.replace('whatsapp:', '');
        const { data: whatsappUser, error: userError } = await supabase
            .from('whatsapp_users')
            .select('user_id')
            .eq('phone_number', phoneNumber)
            .single();

        if (userError || !whatsappUser) {
            console.log(`No user found for phone number: ${phoneNumber}`);
            // TODO: Send a message back to invite them to link their account
            return respondWithTwiML("Hi! I don't recognize this number. Please link your WhatsApp to VoxValt in the settings page.");
        }

        const userId = whatsappUser.user_id;
        let transcription = text;

        // 2. If it's a voice note, transcribe it
        if (mediaUrl) {
            console.log(`Handling media type: ${mediaType} from ${mediaUrl}`);
            const transcribedText = await transcribeWhatsAppMedia(mediaUrl, mediaType);
            if (transcribedText) {
                transcription = transcribedText;
            }
        }

        if (!transcription) {
            return respondWithTwiML("I didn't catch that. Try sending me a text or a voice note!");
        }

        // 3. Extract tasks using existing AI logic
        const extracted = await extractTasksFromTranscription(transcription);

        if (extracted.tasks.length === 0) {
            return respondWithTwiML("Got it! I've saved your note, but I didn't find any specific tasks.");
        }

        // 4. Save tasks to Supabase
        for (const task of extracted.tasks) {
            await supabase.from('tasks').insert({
                user_id: userId,
                title: task.title,
                description: task.description || transcription,
                due_date: task.due_date,
                type: task.type,
                status: 'pending'
            });
        }

        const taskCount = extracted.tasks.length;
        return respondWithTwiML(`Success! I've extracted ${taskCount} tasks from your message and added them to your VoxValt dashboard. 🚀`);

    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

function respondWithTwiML(message: string) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(message);
    return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
    });
}
