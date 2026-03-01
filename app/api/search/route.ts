// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding } from '@/lib/ai-extract';
import { getUserSubscriptionPlan } from '@/lib/subscription';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE__GENERATIVE_AI_API_KEY!);

interface SearchFilters {
    types?: string[];
    status?: string | null;
    tags?: string[];
    people?: string[];
    teamId?: string | null;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query, mode = 'ask', filters } = body as {
            query: string;
            mode: 'ask' | 'search' | 'browse' | 'deep';
            filters?: SearchFilters;
        };

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        const trimmedQuery = query.trim();

        // Check subscription
        const { isPremium } = await getUserSubscriptionPlan(session.user.id);

        // Block Deep Search for non-premium
        if (mode === 'deep' && !isPremium) {
            return NextResponse.json(
                { error: 'Deep Search is a Premium feature. Please upgrade to unlock reasoning-heavy analysis.' },
                { status: 403 }
            );
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateLimit = isPremium ? null : sevenDaysAgo.toISOString();

        // ============================================
        // Browse mode: text-based filtering (no AI)
        // ============================================
        if (mode === 'browse') {
            let dbQuery = supabase
                .from('memories')
                .select('id, content, type, status, priority, due_date, people, tags, created_at')
            if (filters?.teamId) {
                dbQuery = dbQuery.eq('team_id', filters.teamId);
            } else {
                dbQuery = dbQuery.is('team_id', null);
            }

            if (!isPremium) {
                dbQuery = dbQuery.gte('created_at', dateLimit!);
            }

            dbQuery = dbQuery.order('created_at', { ascending: false })
                .limit(30);

            // Apply text search
            dbQuery = dbQuery.ilike('content', `%${trimmedQuery}%`);

            // Apply filters
            if (filters?.types && filters.types.length > 0) {
                dbQuery = dbQuery.in('type', filters.types);
            }
            if (filters?.status) {
                dbQuery = dbQuery.eq('status', filters.status);
            }
            if (filters?.tags && filters.tags.length > 0) {
                dbQuery = dbQuery.overlaps('tags', filters.tags);
            }
            if (filters?.people && filters.people.length > 0) {
                dbQuery = dbQuery.overlaps('people', filters.people);
            }

            const { data, error } = await dbQuery;

            if (error) throw error;

            return NextResponse.json({
                memories: data || [],
                query: trimmedQuery,
                total: data?.length || 0,
            });
        }

        // ============================================
        // Search, Ask & Deep modes: semantic vector search
        // ============================================

        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(trimmedQuery);

        if (!queryEmbedding || queryEmbedding.length === 0) {
            return NextResponse.json(
                { error: 'Failed to process search query. Please try again.' },
                { status: 500 }
            );
        }

        // Determine search parameters
        const isDeep = mode === 'deep';
        const threshold = isDeep ? 0.45 : (mode === 'ask' ? 0.55 : 0.65);
        const matchCount = isDeep ? 25 : (mode === 'ask' ? 15 : 10);

        // Check if we have filters applied
        const hasFilters =
            filters &&
            ((filters.types && filters.types.length > 0) ||
                filters.status ||
                (filters.tags && filters.tags.length > 0) ||
                (filters.people && filters.people.length > 0));

        let memories;
        if (hasFilters) {
            // Use v2 function with type and status filters
            const { data, error } = await supabase.rpc('match_memories_v2', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: matchCount,
                p_user_id: session.user.id,
                p_types: filters?.types?.length ? filters.types : null,
                p_status: filters?.status || null,
            });

            if (error) {
                console.error('match_memories_v2 failed:', error);
                // Fallback to v1
                const fallback = await supabase.rpc('match_memories', {
                    query_embedding: queryEmbedding,
                    match_threshold: threshold,
                    match_count: matchCount,
                    p_user_id: session.user.id,
                });
                memories = fallback.data || [];
            } else {
                memories = data || [];
            }
        } else {
            // No filters — use original function
            const { data, error } = await supabase.rpc('match_memories', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: matchCount,
                p_user_id: session.user.id,
            });

            if (error) throw error;
            memories = data || [];
        }

        // Post-filtering for both cases
        if (filters?.teamId) {
            memories = memories.filter((m: any) => m.team_id === filters.teamId);
        } else {
            memories = memories.filter((m: any) => !m.team_id);
        }

        if (filters?.tags && filters.tags.length > 0) {
            memories = memories.filter((m: any) =>
                m.tags && filters.tags!.some((tag) => m.tags.includes(tag))
            );
        }
        if (filters?.people && filters.people.length > 0) {
            memories = memories.filter((m: any) =>
                m.people && filters.people!.some((person) => m.people.includes(person))
            );
        }

        // Enforce date limit for non-premium
        if (!isPremium && dateLimit) {
            memories = memories.filter((m: any) => m.created_at >= dateLimit);
        }

        // ============================================
        // Ask & Deep modes: Generate AI answer from context
        // ============================================
        if ((mode === 'ask' || mode === 'deep') && memories.length > 0) {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: isDeep ? 0.4 : 0.3 },
            });

            const contextBlock = memories
                .map(
                    (m: any, i: number) =>
                        `[${i + 1}] (Type: ${m.type}, Similarity: ${Math.round((m.similarity || 0) * 100)}%, Created: ${new Date(m.created_at).toLocaleDateString('en-IN')})
${m.content}`
                )
                .join('\n\n---\n\n');

            const prompt = isDeep
                ? `You are VoxValt Deep Search, a highly advanced personal memory researcher.
                
User's Complex Query: "${trimmedQuery}"

I have retrieved the top ${memories.length} relevant memories from their past. Your goal is to SYNTHESIZE these memories to provide a deep, reasoned answer.

Relevant Memories:
${contextBlock}

Instructions for DEEP SEARCH:
- Perform a thematic analysis across the provided memories.
- Connect dots that might not be obvious (e.g., "You mentioned X last week, which relates to the promise you made yesterday...").
- If the user asks for a summary or count (e.g., "How many times did I talk about...?"), be precise.
- Be extremely thorough. If there's conflicting information in different notes, point it out.
- Maintain a highly professional yet personalized tone.
- Use advanced markdown: tables for comparisons, bold for emphasis, and clear hierarchical headers.
- Since this is a premium feature, provide a "wow" factor with your depth of insight.`
                : `You are VoxValt, a personal voice memory assistant. The user is searching through their own past voice notes and memories.

User's question: "${trimmedQuery}"

Here are the most relevant memories found (ranked by similarity):

${contextBlock}

Instructions:
- Answer the user's question based ONLY on the memories provided above
- Be conversational, warm, and helpful — like a personal assistant who knows them well
- Reference specific memories when relevant (e.g., "Based on your note from March 15th...")
- If there are actionable items (tasks/promises), highlight them clearly
- If the memories don't fully answer the question, honestly say what you found and what's missing
- Use markdown formatting for readability (headers, bold, bullet points)
- Keep the answer concise but complete — aim for 100-200 words
- If you notice patterns across multiple memories, mention them
- NEVER make up information that isn't in the memories`;

            try {
                const result = await model.generateContent(prompt);
                const answer = result.response.text();

                return NextResponse.json({
                    answer,
                    memories,
                    query: trimmedQuery,
                    total: memories.length,
                });
            } catch (aiError: any) {
                console.error('AI answer generation failed:', aiError);
                return NextResponse.json({
                    memories,
                    query: trimmedQuery,
                    total: memories.length,
                    ai_error: 'Could not generate AI summary',
                });
            }
        }

        // ============================================
        // Search mode: Return results only
        // ============================================
        return NextResponse.json({
            memories,
            query: trimmedQuery,
            total: memories.length,
        });
    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json(
            {
                error: 'Search failed. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
