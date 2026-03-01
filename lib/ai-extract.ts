import { ExtractedData } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractDateFromText } from './date-extractor';
import { extractWithGroq } from './groq';

// Fallback pattern-based extraction when AI fails
function extractTasksUsingPatterns(transcription: string): ExtractedData {
  const tasks: Array<{
    title: string;
    description: string;
    type: 'task' | 'reminder' | 'promise' | 'recurring';
    due_date: string | null;
  }> = [];
  const text = transcription.toLowerCase();

  // Pattern for tasks (looking for action verbs)
  const taskPatterns = [
    /(?:i need to|need to|should|must|gotta|have to|need)\s+([^.!?]+)/gi,
    /(?:todo|task)[\s:]*([^.!?]+)/gi,
  ];

  // Pattern for reminders (time-based)
  const reminderPatterns = [
    /(?:remind me|reminder|remember to)\s+([^.!?]+)/gi,
    /(?:call|contact|email|text)\s+([^.!?]+)\s+(?:at|on|by|tomorrow|next|today)/gi,
  ];

  // Pattern for promises (Informal commitments)
  const promisePatterns = [
    /(?:i will|i'll|i am going to|imma|i'm gonna)\s+([^.!?]+)/gi,
    /(?:i promise|i'll make sure|count on me to|i'll handle|don't worry i'll)\s+([^.!?]+)/gi,
    /(?:just wanted to let you know i'll|i should be able to)\s+([^.!?]+)/gi,
    /(?:i'll send|i'll call|i'll text|i'll email)\s+([^.!?]+)/gi,
  ];

  // Pattern for recurring
  const recurringPatterns = [
    /(?:every|daily|weekly|monthly|always)\s+([^.!?]+)/gi,
    /(?:i always|i usually)\s+([^.!?]+)/gi,
  ];

  // Extract tasks
  taskPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(transcription)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200) {
        const dateExtraction = extractDateFromText(title);
        tasks.push({
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: '',
          type: 'task' as const,
          due_date: dateExtraction.date,
        });
      }
    }
  });

  // Extract reminders
  reminderPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(transcription)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200 && !tasks.some((t) => t.title.includes(title))) {
        const dateExtraction = extractDateFromText(title);
        tasks.push({
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: 'Reminder',
          type: 'reminder' as const,
          due_date: dateExtraction.date,
        });
      }
    }
  });

  // Extract promises
  promisePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(transcription)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200 && !tasks.some((t) => t.title.includes(title))) {
        const dateExtraction = extractDateFromText(title);
        tasks.push({
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: 'Promise',
          type: 'promise' as const,
          due_date: dateExtraction.date,
        });
      }
    }
  });

  // Extract recurring
  recurringPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(transcription)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200 && !tasks.some((t) => t.title.includes(title))) {
        const dateExtraction = extractDateFromText(title);
        tasks.push({
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: 'Recurring',
          type: 'recurring' as const,
          due_date: dateExtraction.date,
        });
      }
    }
  });

  // Remove duplicates
  const uniqueTasks = Array.from(
    new Map(tasks.map((task) => [task.title, task])).values()
  );

  return {
    tasks: uniqueTasks.slice(0, 10),
    summary: `Extracted ${uniqueTasks.length} task(s) from recording`,
  };
}

// Google Gemini API extraction
async function extractTasksUsingGemini(transcription: string): Promise<ExtractedData> {
  try {
    const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      console.warn('Google AI API key not available');
      return extractTasksUsingPatterns(transcription);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const currentDate = new Date().toISOString();
    const prompt = `
      You are an intelligent personal assistant. Extract tasks, reminders, promises, and recurring commitments from the following voice transcription.
      
      Current Date/Time: ${currentDate}
      
      Rules:
      1. Analyze the text to identify actionable items.
      2. Determine the type: 'task' (general to-do), 'reminder' (time-specific), 'promise' (commitments to others / "I will" statements), or 'recurring' (repeating actions).
      3. Extract specific due dates and times relative to the Current Date/Time. Calculate the exact ISO date string (YYYY-MM-DDTHH:mm:00).
      4. If a time is mentioned (e.g., "tonight", "at 5pm", "in 2 hours"), include it in the due_date.
      5. PAY SPECIAL ATTENTION to "Promises" - any time the user says they will do something for someone else, mark it as a 'promise'.
      6. Create a brief summary of what was extracted.
      
      Return ONLY valid JSON in the following format, without any markdown formatting or code blocks:
      {
        "tasks": [
          {
            "title": "Concise title of the task",
            "description": "More details if available",
            "type": "task" | "reminder" | "promise" | "recurring",
            "due_date": "YYYY-MM-DDTHH:mm:00" or null
          }
        ],
        "summary": "Brief summary of extracted items"
      }

      Transcription: "${transcription}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up response if it contains markdown code blocks
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const extracted = JSON.parse(cleanedText) as ExtractedData;
      return extracted;
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      return extractTasksUsingPatterns(transcription);
    }
  } catch (error) {
    console.error('Gemini extraction failed, trying Groq:', error);
    try {
      const groqResult = await extractWithGroq(transcription);
      return {
        tasks: groqResult.items.map(item => ({
          title: item.content,
          description: item.context,
          type: item.type as any,
          due_date: item.due_date
        })),
        summary: groqResult.summary
      };
    } catch (groqError) {
      console.error('Groq extraction also failed:', groqError);
      return extractTasksUsingPatterns(transcription);
    }
  }
}

export async function extractTasksFromTranscription(
  transcription: string
): Promise<ExtractedData> {
  // Try Gemini API first with timeout, always fall back to patterns
  try {
    const result = await Promise.race([
      extractTasksUsingGemini(transcription),
      new Promise<ExtractedData>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      ),
    ]);
    return result;
  } catch (error) {
    console.error('Gemini timeout or error, using patterns:', error);
    return extractTasksUsingPatterns(transcription);
  }
}

// Generate text embedding for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn('Google AI API key not available for embeddings');
      return [];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return [];
  }
}
