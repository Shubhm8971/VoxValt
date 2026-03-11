import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/ai-extract';
import { searchTasks } from '@/lib/db';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription status for RAG gating
        const subscription = await getUserSubscriptionPlan(user.id);
        const isPremium = subscription.isPremium;

        const { query, teamId, boardId } = await req.json();
        if (!query) {
            return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }

        // 1. Generate Query Embedding
        const queryEmbedding = await generateEmbedding(query);
        if (queryEmbedding.length === 0) {
            return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
        }

        // 2. Search for similar tasks
        const similarTasks = await searchTasks(user.id, queryEmbedding, isPremium, 0.5, 5, teamId, boardId);

        if (similarTasks.length === 0) {
            return NextResponse.json({
                answer: "I couldn't find anything in your memory related to that. Try asking something else!",
                tasks: []
            });
        }

        // 3. Use Gemini to generate a natural language answer based on the retrieved tasks
        const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                answer: `I found these related items: ${similarTasks.map(t => t.title).join(', ')}`,
                tasks: similarTasks
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const context = similarTasks.map(t =>
            `- ${(t.type || t.task_type || 'task').toUpperCase()}: ${t.title} (${t.description || 'no description'}) ${t.due_date ? `due ${t.due_date}` : ''}`
        ).join('\n');

        const prompt = `
      You are VoxValt, a helpful conversational memory assistant. 
      The user is asking a question about their past tasks, promises, and reminders.
      
      User Question: "${query}"
      
      Retrieved Memory Context:
      ${context}
      
      Instructions:
      1. Answer the user's question directly and concisely based ONLY on the provided context.
      2. If you find multiple related items, summarize them.
      3. Maintain a helpful and professional tone.
      4. If the context doesn't fully answer the question, say what you found and ask for clarification.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        return NextResponse.json({
            answer,
            tasks: similarTasks
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
