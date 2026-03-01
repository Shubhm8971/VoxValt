import { createServerClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadAudioToStorage(userId: string, audioFile: File): Promise<string> {
    const supabase = createServerClient();

    // Create a unique filename
    const fileExt = audioFile.name.split('.').pop() || 'webm';
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    // Upload to 'recordings' bucket
    const { data, error } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioFile, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

    return publicUrl;
}
