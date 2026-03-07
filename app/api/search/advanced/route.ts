import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserSubscriptionPlan } from '@/lib/subscription';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      searchType = 'semantic', // 'semantic', 'text', 'hybrid'
      teamId,
      filters = {},
      limit = 20,
      offset = 0
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const startTime = Date.now();
    let results: any[] = [];
    let totalCount = 0;

    // Log search start
    const searchLogData = {
      user_id: session.user.id,
      search_query: query,
      search_type: searchType,
      results_count: 0,
      search_duration_ms: 0
    };

    // Check subscription plan
    const { isPremium } = await getUserSubscriptionPlan(session.user.id);

    // Enforce 7-day limit for free users
    let effectiveStartDate = filters.dateRange?.startDate;
    if (!isPremium) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      if (!effectiveStartDate || new Date(effectiveStartDate) < sevenDaysAgo) {
        effectiveStartDate = sevenDaysAgoStr;
      }
    }

    try {
      if (searchType === 'semantic' || searchType === 'hybrid') {
        // Generate embedding for semantic search
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const embeddingResult = await model.embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;

        // Perform semantic search
        const { data: semanticResults, error: semanticError } = await supabase
          .rpc('match_memories_advanced', {
            query_embedding: queryEmbedding,
            match_threshold: filters.similarityThreshold || 0.7,
            match_count: limit,
            p_user_id: teamId ? null : session.user.id,
            p_team_id: teamId || null,
            p_content_types: filters.contentTypes || null,
            p_date_range_start: effectiveStartDate || null,
            p_date_range_end: filters.dateRange?.endDate || null
          });

        if (!semanticError && semanticResults) {
          results = semanticResults;
          totalCount = semanticResults.length;
        }
      }

      if (searchType === 'text' || (searchType === 'hybrid' && results.length < limit)) {
        // Perform full-text search
        const { data: textResults, error: textError } = await supabase
          .rpc('search_memories_text', {
            search_query: query,
            p_user_id: teamId ? null : session.user.id,
            p_team_id: teamId || null,
            limit_count: searchType === 'hybrid' ? limit - results.length : limit
          });

        if (!textError && textResults) {
          let filteredTextResults = textResults;
          if (!isPremium) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString();
            filteredTextResults = textResults.filter((r: any) => r.created_at >= sevenDaysAgoStr);
          }

          if (searchType === 'hybrid') {
            // Combine and deduplicate results
            const existingIds = new Set(results.map((r: any) => r.id));
            const newResults = filteredTextResults.filter((r: any) => !existingIds.has(r.id));
            results.push(...newResults);
          } else {
            results = filteredTextResults;
          }
          totalCount = results.length;
        }
      }

      // Update memory access counts and importance scores
      if (results.length > 0) {
        const memoryIds = results.slice(0, 5).map(r => r.id); // Update top 5 results

        await supabase
          .from('memories')
          .update({
            access_count: 1, // Simple increment for now
            last_accessed: new Date().toISOString()
          })
          .in('id', memoryIds);
      }

      const searchDuration = Date.now() - startTime;

      // Log search completion
      searchLogData.results_count = results.length;
      searchLogData.search_duration_ms = searchDuration;

      await supabase
        .from('memory_search_logs')
        .insert(searchLogData);

      return NextResponse.json({
        success: true,
        results,
        totalCount,
        searchType,
        searchDuration,
        query,
        filters
      });

    } catch (searchError) {
      console.error('Search error:', searchError);

      // Log failed search
      await supabase
        .from('memory_search_logs')
        .insert({
          ...searchLogData,
          results_count: 0,
          search_duration_ms: Date.now() - startTime
        });

      return NextResponse.json({
        error: 'Search failed',
        details: searchError instanceof Error ? searchError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Advanced search API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'trending', 'recent', 'suggested'

    switch (type) {
      case 'trending':
        // Get most searched terms
        const { data: allSearches } = await supabase
          .from('memory_search_logs')
          .select('search_query')
          .eq('user_id', session.user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

        // Count occurrences manually
        const searchCounts: { [key: string]: number } = {};
        allSearches?.forEach(search => {
          searchCounts[search.search_query] = (searchCounts[search.search_query] || 0) + 1;
        });

        const trending = Object.entries(searchCounts)
          .map(([search_query, search_count]) => ({ search_query, search_count }))
          .sort((a, b) => b.search_count - a.search_count)
          .slice(0, 10);

        return NextResponse.json({ trending });

      case 'recent':
        // Get recent searches
        const { data: recent } = await supabase
          .from('memory_search_logs')
          .select('search_query, created_at, search_type')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        return NextResponse.json({ recent: recent || [] });

      case 'suggested':
        // Get suggested searches based on user's memories
        const { data: suggested } = await supabase
          .from('memories')
          .select('content, type, importance_score')
          .eq('user_id', session.user.id)
          .eq('is_archived', false)
          .order('importance_score', { ascending: false })
          .limit(10);

        // Extract key phrases from important memories
        const suggestions = suggested?.map(memory => ({
          query: memory.content.slice(0, 50) + (memory.content.length > 50 ? '...' : ''),
          type: memory.type,
          score: memory.importance_score
        })) || [];

        return NextResponse.json({ suggestions });

      default:
        return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
