export interface Source {
  url: string;
  title: string;
}

export interface Message {
  id: string;
  createdAt?: Date;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  runId?: string;
  sources?: Source[];
  name?: string;
  function_call?: { name: string };
}

export interface Feedback {
  feedback_id: string;
  run_id: string;
  key: string;
  score: number;
  comment?: string;
}

export interface ChatHistory {
  human: string;
  ai: string;
}