export interface Recording {
  id: string;
  user_id: string;
  audio_url: string;
  transcription: string;
  created_at: string;
  duration: number;
  team_id?: string;
}

export interface Task {
  id?: string;
  user_id?: string;
  recording_id?: string;
  title: string;
  description: string;
  task_type?: 'task' | 'reminder' | 'promise' | 'recurring';
  type?: 'task' | 'reminder' | 'promise' | 'recurring';
  due_date?: string | null;
  recurrence?: string | null;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
  team_id?: string;
}

export interface ExtractedData {
  tasks: Array<{
    title: string;
    description: string;
    type: 'task' | 'reminder' | 'promise' | 'recurring';
    due_date?: string | null;
    recurrence?: string | null;
  }>;
  summary: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Memo {
  id: string;
  user_id: string;
  content: string;
  type: string;
  embedding?: number[];
  created_at: string;
}
