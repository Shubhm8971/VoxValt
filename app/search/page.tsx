// app/search/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SearchPageClient from './SearchPageClient';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export const metadata = {
    title: 'Search Memories',
    description: 'Search through your voice memories with natural language',
};

export default async function SearchPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth');
    }

    // Check subscription plan
    const { isPremium } = await getUserSubscriptionPlan(session.user.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch recent memories for "browse" mode
    let recentQuery = supabase
        .from('memories')
        .select('id, content, type, status, priority, people, tags, created_at')
        .eq('user_id', session.user.id);

    if (!isPremium) {
        recentQuery = recentQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { data: recentMemories } = await recentQuery
        .order('created_at', { ascending: false })
        .limit(20);

    // Fetch unique tags for filter chips
    let tagsQuery = supabase
        .from('memories')
        .select('tags')
        .eq('user_id', session.user.id)
        .not('tags', 'eq', '{}');

    if (!isPremium) {
        tagsQuery = tagsQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { data: tagData } = await tagsQuery;

    // Extract unique tags
    const allTags: string[] = [];
    tagData?.forEach((row) => {
        if (row.tags && Array.isArray(row.tags)) {
            row.tags.forEach((tag: string) => {
                if (!allTags.includes(tag)) allTags.push(tag);
            });
        }
    });

    // Fetch unique people mentioned
    let peopleQuery = supabase
        .from('memories')
        .select('people')
        .eq('user_id', session.user.id)
        .not('people', 'eq', '{}');

    if (!isPremium) {
        peopleQuery = peopleQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { data: peopleData } = await peopleQuery;

    const allPeople: string[] = [];
    peopleData?.forEach((row) => {
        if (row.people && Array.isArray(row.people)) {
            row.people.forEach((person: string) => {
                if (!allPeople.includes(person)) allPeople.push(person);
            });
        }
    });

    // Get memory stats
    let countQuery = supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

    if (!isPremium) {
        countQuery = countQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { count: totalCount } = await countQuery;

    return (
        <SearchPageClient
            recentMemories={recentMemories || []}
            availableTags={allTags.sort()}
            availablePeople={allPeople.sort()}
            totalMemories={totalCount || 0}
        />
    );
}