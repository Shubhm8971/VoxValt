export interface GroqExtractedData {
    summary: string;
    items: Array<{
        content: string;
        type: 'task' | 'promise' | 'memo' | 'idea' | 'reminder' | 'recurring';
        priority: 'high' | 'medium' | 'low';
        due_date: string | null;
        recurrence: string | null;
        people_involved: string[];
        context: string;
    }>;
    tags: string[];
    sentiment: string;
}

export async function transcribeWithGroq(audioBlob: Blob): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not found');

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq transcription failed: ${response.status} ${errorText}`);
    }

    return response.text();
}

export async function extractWithGroq(transcription: string, teamContext?: string): Promise<GroqExtractedData> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not found');

    const prompt = `You are a memory extraction assistant. Analyze the following voice transcription and extract structured information.
${teamContext ? `\nTEAM CONTEXT (Recent items from this team):\n${teamContext}\nInstructions: Use this context to resolve terminology, people, or project names mentioned in the transcription.\n` : ''}
Return ONLY valid JSON in this exact format:
{
  "summary": "A concise 1-2 sentence summary of the entire note",
  "items": [
    {
      "content": "The specific item described clearly",
      "type": "task | promise | memo | idea | reminder | recurring",
      "priority": "high | medium | low",
      "due_date": "ISO date string if mentioned, otherwise null",
      "recurrence": "daily | weekly | monthly | every [day] | null",
      "people_involved": ["names of people mentioned"],
      "context": "brief context about why this matters"
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
- **Settings Detection**: If the user wants to change a setting or navigate, populate "settings_action".
  - Example: "Switch to dark mode" -> { "action": "theme_toggle", "value": "dark" }
  - Example: "Go to settings" -> { "action": "navigate", "value": "settings" }

Transcription: "${transcription}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq extraction failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}
