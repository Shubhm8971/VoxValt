// app/api/process-voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding } from '@/lib/ai-extract';
import { saveMemo, saveRecording, saveTasks, getOrCreateBoard, getReportData } from '@/lib/db';
import { uploadAudioToStorage } from '@/lib/storage';
import { transcribeWithGroq, extractWithGroq } from '@/lib/groq';
import { syncMultipleTasks } from '@/lib/calendar-sync';
import { NotificationScheduler } from '@/lib/notification-scheduler';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE__GENERATIVE_AI_API_KEY!);

// Structured extraction prompt
const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the following voice transcription and extract structured information.

Return ONLY valid JSON in this exact format:
{
  "summary": "A concise 1-2 sentence summary of the entire note",
  "is_report_request": true | false,
  "report_type": "status | summary | activity | analytics | null",
  "report_scope": "personal | team | all | null",
  "items": [
    {
      "content": "The specific item described clearly",
      "type": "task | promise | memo | idea | reminder | recurring",
      "priority": "high | medium | low",
      "due_date": "ISO date string if mentioned, otherwise null",
      "recurrence": "daily | weekly | monthly | every [day] | null",
      "people_involved": ["names of people mentioned"],
      "context": "brief context about why this matters",
      "board_name": "name of a specific board if mentioned (e.g., 'Grocery', 'Work', 'Home')"
    }
  ],
  "tags": ["relevant", "topic", "tags"],
  "sentiment": "positive | neutral | negative | urgent",
  "settings_action": {
    "action": "theme_toggle | navigate | notification_toggle | unknown | null",
    "value": "light | dark | dashboard | settings | search | team | on | off | null"
  }
}

Rules:
- A "recurring" item is something that happens repeatedly (e.g., "pay rent every month", "daily standup")
- Capture the PATTERN in the "recurrence" field (e.g., "monthly", "every Tuesday")
- A "promise" is a commitment made TO someone else (e.g., "I told Sarah I'd send the report")
- A "task" is something the user needs to do for themselves
- A "reminder" has a time component
- An "idea" is speculative or brainstorming
- A "memo" is general information worth remembering
- Extract ALL distinct items, even from a single sentence
- If no due date is explicitly stated, set it to null
- Be precise with people's names
- **Board Detection**: If the user mentions a specific category or board name (e.g., "Add this to Work", "put this in my Shopping list", "add to the Home Reno board"), extract that as "board_name". Match this against the names of the user's existing memory boards.
- **Report Detection**: If the user is asking a question or requesting a summary (e.g., "What do I need to do today?", "How is the team doing?", "Give me a report on the Home board"), set "is_report_request" to true.
- Set "report_scope" to "team" if they mention the team/family or others, "personal" if they talk about themselves, and "all" if it's general.
- **Settings Detection**: If the user wants to change a setting or navigate, populate "settings_action".
  - Example: "Switch to dark mode" -> { "action": "theme_toggle", "value": "dark" }
  - Example: "Go to settings" -> { "action": "navigate", "value": "settings" }
  - Example: "Mute notifications" -> { "action": "notification_toggle", "value": "off" }

Transcription:
"""
{TRANSCRIPTION}
"""

{TEAM_CONTEXT}

Instructions for Team Context:
If Team Context is provided, use it to resolve ambiguity in the transcription. For example, if the user mentions a project name or technical term used in recent team memories, ensure the extraction reflects that shared knowledge.
`;

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate using verifyAuth
        const { verifyAuth } = await import('@/lib/api-auth');
        const user = await verifyAuth(req);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;

        // Check if user can record (based on plan limits)
        const { canUserRecord } = await import('@/lib/subscription');
        const check = await canUserRecord(userId);
        if (!check.canRecord) {
            return NextResponse.json(
                { error: 'Limit reached', message: check.reason },
                { status: 403 }
            );
        }

        // 2. Get the audio blob
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;
        const durationStr = formData.get('duration') as string;
        const teamId = formData.get('teamId') as string | null;
        const duration = parseInt(durationStr || '0', 10);

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Upload audio to Supabase Storage
        let audioUrl = '';
        try {
            audioUrl = await uploadAudioToStorage(userId, audioFile);
        } catch (storageError) {
            console.error('Audio upload failed:', storageError);
            // Non-fatal, we can still process text, but audio playback won't work
        }

        // 3. Transcribe using Groq (Primary) or Gemini (Fallback)
        let transcription = '';
        try {
            console.log('[API] Attempting Groq transcription...');
            transcription = await transcribeWithGroq(audioFile);
            console.log('[API] Groq transcription success');
        } catch (groqError: any) {
            console.warn('[API] Groq transcription failed, falling back to Gemini:', groqError.message);
            const audioBytes = await audioFile.arrayBuffer();
            const audioBase64 = Buffer.from(audioBytes).toString('base64');

            const transcriptionModel = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
            });

            const transcriptionResult = await transcriptionModel.generateContent([
                {
                    inlineData: {
                        mimeType: audioFile.type || 'audio/webm',
                        data: audioBase64,
                    },
                },
                {
                    text: 'Transcribe this audio exactly as spoken. Include filler words only if they carry meaning. Output only the transcription text, nothing else.',
                },
            ]);
            transcription = transcriptionResult.response.text().trim();
        }

        console.log('[API] Transcription:', transcription);

        if (!transcription || transcription.length < 2) {
            return NextResponse.json(
                { error: 'Could not transcribe audio — too short or unclear' },
                { status: 422 }
            );
        }

        // 4. Fetch Team Context (if applicable)
        let teamContext = '';
        if (teamId) {
            try {
                const { data: recentMemos } = await createClient()
                    .from('memories')
                    .select('content, type, created_at')
                    .eq('team_id', teamId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (recentMemos && recentMemos.length > 0) {
                    teamContext = `\nTEAM CONTEXT (Recent items from this team): \n` +
                        recentMemos.map(m => `- [${m.type}] ${m.content} `).join('\n') + `\n`;
                }
            } catch (contextError) {
                console.warn('Failed to fetch team context:', contextError);
            }
        }

        // 5. Extract structured data using Groq (Primary) or Gemini (Fallback)
        let extracted;
        try {
            console.log('[API] Attempting Groq extraction...');
            extracted = await extractWithGroq(transcription, teamContext);
            console.log('[API] Groq extraction success');
        } catch (groqExtractError: any) {
            console.warn('[API] Groq extraction failed, falling back to Gemini:', groqExtractError.message);

            async function runGeminiWithFallback(prompt: string, config: any) {
                const models = ['gemini-2.0-flash', 'gemini-2.1-preview', 'gemini-1.5-flash-latest'];
                let lastError;
                for (const modelName of models) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName, ...config });
                        const result = await model.generateContent(prompt);
                        return result.response.text();
                    } catch (err: any) {
                        lastError = err;
                        if (err.message?.includes('404')) continue;
                        throw err;
                    }
                }
                throw lastError;
            }

            try {
                const finalPrompt = EXTRACTION_PROMPT
                    .replace('{TRANSCRIPTION}', transcription)
                    .replace('{TEAM_CONTEXT}', teamContext || 'No recent team context available.');

                const extractionText = await runGeminiWithFallback(
                    finalPrompt,
                    { generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }
                );
                extracted = JSON.parse(extractionText);
            } catch (geminiError: any) {
                console.error('[API] Both Groq and Gemini failed:', geminiError);
                // Last resort fallback
                extracted = {
                    summary: transcription,
                    items: [{
                        content: transcription,
                        type: 'memo',
                        priority: 'medium',
                        due_date: null,
                        people_involved: [],
                        context: '',
                        recurrence: null
                    }],
                    tags: [],
                    sentiment: 'neutral',
                };
            }
        }

        // 5. If it's a report request, generate the summary
        if (extracted.is_report_request) {
            try {
                const reportScope = extracted.report_scope || 'personal';
                const reportData = await getReportData(userId, reportScope as any, teamId || undefined);

                const reportPrompt = `
                You are VoxValt, an AI memory assistant. The user just asked for a report/summary: "${transcription}"
                
                Here is the relevant data for the ${reportScope} scope:
                TASKS: ${JSON.stringify(reportData.tasks)}
                RECENT MEMORIES: ${JSON.stringify(reportData.memories)}
                
                Instructions:
                - Generate a conversational, encouraging, and highly professional report.
                - Focus on what's urgent or interesting.
                - If there are many tasks, summarize them.
                - Mention if people (teammates) have been active.
                - Output ONLY the natural language report text.
                - Keep it under 150 words.
                `;

                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(reportPrompt);
                const reportText = result.response.text().trim();

                return NextResponse.json({
                    success: true,
                    transcription,
                    is_report: true,
                    report_text: reportText,
                    extracted
                });
            } catch (reportError) {
                console.error('Failed to generate report:', reportError);
            }
        }

        // 5. Save recording and extracted tasks to Dashboard tables
        let recordingId = '';
        try {
            // Resolve board for the recording (take first board_name found in items)
            let recordingBoardId: string | undefined;
            if (teamId) {
                const firstBoardItem = extracted.items.find((item: any) => item.board_name);
                if (firstBoardItem?.board_name) {
                    try {
                        recordingBoardId = await getOrCreateBoard(firstBoardItem.board_name, teamId, userId);
                    } catch (err) {
                        console.warn('Failed to resolve recording board:', err);
                    }
                }
            }

            const recording = await saveRecording(userId, audioUrl, transcription, duration, teamId || undefined, recordingBoardId);
            recordingId = recording.id;

            // Filter out actionable items to save to 'tasks' table
            const actionableTypes = ['task', 'promise', 'reminder', 'recurring'];
            const actionableItems = extracted.items.filter((item: any) => actionableTypes.includes(item.type));

            if (actionableItems.length > 0) {
                for (const item of actionableItems) {
                    try {
                        let itemBoardId = recordingBoardId;
                        if (teamId && item.board_name && item.board_name !== extracted.items.find((i: any) => i.board_name)?.board_name) {
                            itemBoardId = await getOrCreateBoard(item.board_name, teamId, userId);
                        }

                        const savedTasks = await saveTasks(userId, recordingId, [{
                            title: item.content,
                            description: item.context || '',
                            task_type: item.type,
                            due_date: item.due_date,
                            recurrence: item.recurrence || null,
                        }], teamId || undefined, itemBoardId);

                        // 5b. Real-time Calendar Sync
                        try {
                            await syncMultipleTasks(userId, savedTasks);
                        } catch (syncError) {
                            console.error('Real-time calendar sync failed (non-fatal):', syncError);
                        }

                        // 5c. Schedule Notifications
                        try {
                            await NotificationScheduler.syncTasks(userId, savedTasks);
                        } catch (notifError) {
                            console.error('Notification scheduling failed (non-fatal):', notifError);
                        }
                    } catch (itemDbError) {
                        console.error('Failed to save task item:', itemDbError);
                    }
                }
            }
        } catch (dbError) {
            console.error('Failed to save recording/tasks to db:', dbError);
        }

        // 6. Generate embeddings and save each item for vector search
        const savedItems = [];
        const errors = [];

        // Save the full transcription as a parent memo
        const fullContent = `[Voice Note] ${extracted.summary} \n\nFull transcription: ${transcription} `;
        const fullEmbedding = await generateEmbedding(fullContent);

        if (fullEmbedding.length > 0) {
            // Re-resolve board if needed (not strictly necessary but consistent)
            let recordingBoardId: string | undefined;
            if (teamId) {
                const firstBoardItem = extracted.items.find((item: any) => item.board_name);
                if (firstBoardItem?.board_name) {
                    recordingBoardId = await getOrCreateBoard(firstBoardItem.board_name, teamId, userId);
                }
            }
            const parentMemo = await saveMemo(userId, fullContent, 'voice_note', fullEmbedding, teamId || undefined, recordingBoardId);
            savedItems.push(parentMemo);
        }

        // Save each extracted item individually (for granular search)
        for (const item of extracted.items) {
            try {
                // Enrich the content for better embedding quality
                const enrichedContent = buildEnrichedContent(item, extracted.tags);
                const embedding = await generateEmbedding(enrichedContent);

                if (embedding.length === 0) {
                    errors.push(`Failed to embed: ${item.content.substring(0, 50)}...`);
                    continue;
                }

                let itemBoardId: string | undefined;
                if (teamId && item.board_name) {
                    itemBoardId = await getOrCreateBoard(item.board_name, teamId, userId);
                }

                const saved = await saveMemo(userId, enrichedContent, item.type, embedding, teamId || undefined, itemBoardId);
                savedItems.push(saved);
            } catch (itemError: any) {
                errors.push(itemError.message);
            }
        }

        // 6. Return results
        return NextResponse.json({
            success: true,
            transcription,
            extracted,
            saved_count: savedItems.length,
            items: savedItems,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('Voice processing error:', error);
        return NextResponse.json(
            { error: 'Processing failed', details: error.message },
            { status: 500 }
        );
    }
}

function buildEnrichedContent(
    item: any,
    tags: string[]
): string {
    const parts = [
        `[${item.type.toUpperCase()}]`,
        item.content,
    ];

    if (item.priority === 'high') parts.push('(HIGH PRIORITY)');
    if (item.recurrence) parts.push(`Recurring: ${item.recurrence} `);
    if (item.due_date) parts.push(`Due: ${item.due_date} `);
    if (item.people_involved?.length > 0) {
        parts.push(`People: ${item.people_involved.join(', ')} `);
    }
    if (item.context) parts.push(`Context: ${item.context} `);
    if (tags.length > 0) parts.push(`Tags: ${tags.join(', ')} `);

    return parts.join(' | ');
}