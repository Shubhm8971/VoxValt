import { createServerClient } from './supabase';
import { Recording, Task } from '@/types';
import { getUserSubscriptionPlan } from './subscription';

const supabase = createServerClient();

// Recording operations
export async function saveRecording(
  userId: string,
  audioUrl: string,
  transcription: string,
  duration: number,
  teamId?: string,
  boardId?: string
): Promise<Recording> {
  const { data, error } = await supabase
    .from('recordings')
    .insert({
      user_id: userId,
      audio_url: audioUrl,
      transcription,
      duration,
      team_id: teamId,
      board_id: boardId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save recording: ${error.message}`);
  return data;
}

export async function getRecordings(userId: string, limit = 20, teamId?: string, boardId?: string): Promise<Recording[]> {
  const plan = await getUserSubscriptionPlan(userId);
  let query = supabase
    .from('recordings')
    .select('*');

  if (teamId) {
    query = query.eq('team_id', teamId);
  } else {
    query = query.eq('user_id', userId).is('team_id', null);
  }

  if (!plan.isPremium) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte('created_at', sevenDaysAgo.toISOString());
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch recordings: ${error.message}`);
  return data || [];
}

// Task operations
export async function saveTasks(
  userId: string,
  recordingId: string,
  tasks: Array<{
    title: string;
    description: string;
    task_type: 'task' | 'reminder' | 'promise' | 'recurring';
    due_date?: string;
    recurrence?: string | null;
  }>,
  teamId?: string,
  boardId?: string
): Promise<Task[]> {
  const tasksToInsert = tasks.map((task) => ({
    user_id: userId,
    recording_id: recordingId,
    team_id: teamId,
    board_id: boardId,
    ...task,
    completed: false,
    priority: 'medium',
    labels: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select();

  if (error) throw new Error(`Failed to save tasks: ${error.message}`);
  return data || [];
}

export async function getTasks(userId: string, completed?: boolean, teamId?: string, boardId?: string): Promise<Task[]> {
  const plan = await getUserSubscriptionPlan(userId);
  let query = supabase.from('tasks').select('*');

  if (teamId) {
    query = query.eq('team_id', teamId);
  } else {
    query = query.eq('user_id', userId).is('team_id', null);
  }

  if (completed !== undefined) {
    query = query.eq('completed', completed);
  }

  if (!plan.isPremium) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte('created_at', sevenDaysAgo.toISOString());
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data || [];
}

export async function updateTaskStatus(taskId: string, completed: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return data;
}
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  // ... (deleteTask implementation)
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
}

export async function deleteRecording(recordingId: string): Promise<void> {
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('id', recordingId);

  if (error) throw new Error(`Failed to delete recording: ${error.message}`);
}

export async function getMonthlyRecordingCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setHours(0, 0, 0, 0);
  startOfMonth.setDate(1);

  const { count, error } = await supabase
    .from('recordings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw new Error(`Failed to count monthly recordings: ${error.message}`);
  return count || 0;
}

// Memo/Vector operations
export async function saveMemo(
  userId: string,
  content: string,
  type: string,
  embedding: number[],
  teamId?: string,
  boardId?: string
): Promise<any> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      content,
      type,
      embedding,
      team_id: teamId,
      board_id: boardId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save memo: ${error.message}`);
  return data;
}

export async function searchMemories(
  userId: string,
  queryEmbedding: number[],
  matchThreshold = 0.7,
  matchCount = 5
): Promise<any[]> {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    p_user_id: userId,
  });

  if (error) throw new Error(`Failed to search memories: ${error.message}`);
  return data || [];
}

// Notification operations
export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string }
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      ...subscription,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, endpoint'
    });

  if (error) throw new Error(`Failed to save push subscription: ${error.message}`);
}

export async function getPushSubscriptions(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to fetch push subscriptions: ${error.message}`);
  return data || [];
}

export async function scheduleNotification(
  userId: string,
  notification: {
    taskId?: string;
    memoryId?: string;
    title: string;
    body: string;
    scheduled_for: string;
    type: string;
  }
): Promise<any> {
  const { data, error } = await supabase
    .from('scheduled_notifications')
    .insert({
      user_id: userId,
      ...notification,
      sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to schedule notification: ${error.message}`);
  return data;
}

export async function getPendingNotifications(): Promise<any[]> {
  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*, user_subscriptions(status)')
    .eq('sent', false)
    .lte('scheduled_for', new Date().toISOString());

  if (error) throw new Error(`Failed to fetch pending notifications: ${error.message}`);
  return data || [];
}

export async function markNotificationSent(id: string, error?: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('scheduled_notifications')
    .update({
      sent: true,
      error: error || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw new Error(`Failed to mark notification as sent: ${updateError.message}`);
}

// Board operations
export async function getOrCreateBoard(
  name: string,
  teamId: string,
  createdBy: string
): Promise<string> {
  // Try to find existing board in this team
  const { data: existing, error: findError } = await supabase
    .from('memory_boards')
    .select('id')
    .eq('team_id', teamId)
    .ilike('name', name)
    .maybeSingle();

  if (findError) throw new Error(`Failed to find board: ${findError.message}`);
  if (existing) return existing.id;

  // Create new board
  const { data: created, error: createError } = await supabase
    .from('memory_boards')
    .insert({
      name,
      team_id: teamId,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (createError) throw new Error(`Failed to create board: ${createError.message}`);
  return created.id;
}

export async function getBoards(teamId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('memory_boards')
    .select('*')
    .eq('team_id', teamId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch boards: ${error.message}`);
  return data || [];
}

export async function getTeamAnalytics(teamId: string, userId: string): Promise<any> {
  const plan = await getUserSubscriptionPlan(userId);

  let memoriesQuery = supabase
    .from('memories')
    .select('created_at, user_id, type')
    .eq('team_id', teamId);

  let tasksQuery = supabase
    .from('tasks')
    .select('completed, task_type')
    .eq('team_id', teamId);

  if (!plan.isPremium) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    memoriesQuery = memoriesQuery.gte('created_at', sevenDaysAgo.toISOString());
    tasksQuery = tasksQuery.gte('created_at', sevenDaysAgo.toISOString());
  }

  const { data: memories, error: mError } = await memoriesQuery;

  if (mError) throw mError;

  const { data: tasks, error: tError } = await tasksQuery;

  if (tError) throw tError;

  // Aggregate stats
  const totalMemories = memories.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Daily trend (last 7 days)
  const trend: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    trend[dateStr] = 0;
  }

  memories.forEach(m => {
    const date = m.created_at.split('T')[0];
    if (trend[date] !== undefined) {
      trend[date]++;
    }
  });

  const dailyTrend = Object.entries(trend).map(([date, count]) => ({ date, count }));

  // Top contributor
  const contributors: Record<string, number> = {};
  memories.forEach(m => {
    contributors[m.user_id] = (contributors[m.user_id] || 0) + 1;
  });

  const topContributorEntry = Object.entries(contributors).sort((a, b) => b[1] - a[1])[0];

  return {
    totalMemories,
    totalTasks,
    completedTasks,
    completionRate,
    dailyTrend,
    topContributorId: topContributorEntry ? topContributorEntry[0] : null,
    topContributorCount: topContributorEntry ? topContributorEntry[1] : 0
  };
}

export async function getReportData(userId: string, scope: 'personal' | 'team' | 'all', teamId?: string, boardId?: string): Promise<any> {
  const plan = await getUserSubscriptionPlan(userId);
  let tasksQuery = supabase.from('tasks').select('*');
  let memoriesQuery = supabase.from('memories').select('*');

  if (scope === 'team' && teamId) {
    tasksQuery = tasksQuery.eq('team_id', teamId);
    memoriesQuery = memoriesQuery.eq('team_id', teamId);
  } else if (scope === 'personal') {
    tasksQuery = tasksQuery.eq('user_id', userId).is('team_id', null);
    memoriesQuery = memoriesQuery.eq('user_id', userId).is('team_id', null);
  } else {
    // 'all' - get everything for user + their teams
    tasksQuery = tasksQuery.eq('user_id', userId);
    memoriesQuery = memoriesQuery.eq('user_id', userId);
  }

  if (boardId) {
    tasksQuery = tasksQuery.eq('board_id', boardId);
    memoriesQuery = memoriesQuery.eq('board_id', boardId);
  }

  if (!plan.isPremium) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    tasksQuery = tasksQuery.gte('created_at', sevenDaysAgo.toISOString());
    memoriesQuery = memoriesQuery.gte('created_at', sevenDaysAgo.toISOString());
  }

  const [{ data: tasks }, { data: memories }] = await Promise.all([
    tasksQuery.order('created_at', { ascending: false }).limit(20),
    memoriesQuery.order('created_at', { ascending: false }).limit(20)
  ]);

  return {
    tasks: tasks || [],
    memories: memories || []
  };
}