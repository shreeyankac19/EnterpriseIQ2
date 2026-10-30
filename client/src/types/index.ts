export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  avatar_initial: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_type: 'CSV' | 'DOCX' | 'PDF' | 'XLSX' | string;
  department: string;
  confidentiality: 'Internal' | 'Confidential' | 'Restricted' | string;
  file_size_bytes: number;
  formatted_size: string;
  content_length_desc: string;
  uploaded_by: string;
  upload_date: string;
  file_path?: string;
  isAccessible?: boolean;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  page_number: number;
  token_count: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  scope: string;
  department: string;
  status: 'Completed' | 'Active' | 'Pending' | string;
  progress: number;
  budget: number;
  actual_spent: number;
  lead: string;
}

export interface SourceReference {
  type: 'database' | 'document';
  title: string;
  detail: string;
  reference: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  sources: SourceReference[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface DeptDistribution {
  department: string;
  projectCount: number;
  docCount: number;
  budget: number;
  spent: number;
  formattedSpent: string;
  formattedBudget: string;
  completedCount: number;
  activeCount: number;
  pendingCount: number;
  completedPct: number;
  activePct: number;
  pendingPct: number;
}

export interface SearchResultChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  filename: string;
  department: string;
  confidentiality: string;
  pageNumber: number;
  content: string;
  score: number;
}
