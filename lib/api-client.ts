import { Task, Recording } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchTasks(userId: string, completed?: boolean, teamId?: string, boardId?: string) {
  const params = new URLSearchParams();
  if (completed !== undefined) params.append('completed', String(completed));
  if (teamId) params.append('teamId', teamId);
  if (boardId) params.append('boardId', boardId);

  const res = await fetch(`/api/tasks${params.toString() ? '?' + params.toString() : ''}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch tasks');
  }
  const data = await res.json();
  return data.data as Task[];
}

export async function fetchRecordings(userId: string, teamId?: string, boardId?: string) {
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);
  if (boardId) params.append('boardId', boardId);
  const res = await fetch(`/api/recordings${params.toString() ? '?' + params.toString() : ''}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch recordings');
  }
  const data = await res.json();
  return data.data as Recording[];
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  const res = await fetch('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, completed }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to update task');
  }
  const data = await res.json();
  return data.data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const res = await fetch('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, ...updates }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to update task');
  }
  const data = await res.json();
  return data.data as Task;
}

export async function deleteTask(taskId: string) {
  const res = await fetch('/api/tasks', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to delete task');
  }
  return res.json();
}

export async function deleteRecording(recordingId: string) {
  const res = await fetch('/api/recordings', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordingId }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to delete recording');
  }
  return res.json();
}


export async function fetchSubscriptionStatus() {
  const res = await fetch('/api/subscription');
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch subscription status');
  }
  const data = await res.json();
  return data.data as { isPremium: boolean };
}

export async function fetchTeams() {
  const res = await fetch('/api/teams');
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch teams');
  }
  const data = await res.json();
  return data.teams as any[];
}

export async function createTeam(name: string) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to create team');
  }
  return res.json();
}

export async function joinTeam(inviteCode: string) {
  const res = await fetch('/api/teams/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to join team');
  }
  return res.json();
}
