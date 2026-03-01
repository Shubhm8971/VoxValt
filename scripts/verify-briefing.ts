
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBriefing() {
    console.log('Verifying Morning Briefing Data Retrieval...');

    // 1. Get a user (just pick the first one for testing)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users || users.length === 0) {
        console.error('Error fetching users or no users found:', userError);
        return;
    }

    const userId = users[0].id;
    console.log(`Testing for User ID: ${userId}`);

    // 2. Simulate Date Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tonight = new Date(today);
    tonight.setHours(23, 59, 59, 999);

    // 3. Fetch Tasks
    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .gte('due_date', today.toISOString())
        .lte('due_date', tonight.toISOString());

    if (taskError) console.error('Error fetching tasks:', taskError);
    else console.log(`Found ${tasks?.length} tasks due today.`);

    // 4. Fetch Memories (Recordings from yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: memories, error: memError } = await supabase
        .from('recordings')
        .select('transcription, created_at')
        .eq('user_id', userId)
        .gte('created_at', yesterday.toISOString());

    if (memError) console.error('Error fetching memories:', memError);
    else console.log(`Found ${memories?.length} memories from yesterday.`);

    // 5. Output Summary
    if (tasks && tasks.length > 0) {
        console.log('Sample Task:', tasks[0].title);
    }

    console.log('Verification Complete.');
}

verifyBriefing();
