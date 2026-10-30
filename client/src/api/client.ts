import {
  User,
  DocumentItem,
  DocumentChunk,
  Project,
  ChatMessage,
  ChatSession,
  DeptDistribution,
  SearchResultChunk
} from '../types/index.ts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const tokenStorage = {
  get: () => localStorage.getItem('enterpriseiq_user'),
  set: (user: User) => localStorage.setItem('enterpriseiq_user', JSON.stringify(user)),
  remove: () => localStorage.removeItem('enterpriseiq_user')
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      errorDetail = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  getUsers: () => request<{ users: User[] }>('/auth/users'),
  login: (username: string, password?: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  // Dashboard & Projects
  getProjectsAnalytics: () =>
    request<{
      kpis: {
        total: number;
        active: number;
        completed: number;
        pending: number;
      };
      departmentDistribution: DeptDistribution[];
    }>('/projects/analytics'),

  getProjects: (params: { dept?: string; status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.dept) qs.append('dept', params.dept);
    if (params.status) qs.append('status', params.status);
    if (params.search) qs.append('search', params.search);
    return request<{ projects: Project[] }>(`/projects?${qs.toString()}`);
  },

  createProject: (projectData: Partial<Project>) =>
    request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    }),

  // Documents
  getDocsStats: () =>
    request<{
      total: number;
      byFormat: Record<string, number>;
      byClearance: Record<string, number>;
    }>('/docs/stats'),

  getDocuments: (params: { dept?: string; format?: string; search?: string; role?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.dept) qs.append('dept', params.dept);
    if (params.format) qs.append('format', params.format);
    if (params.search) qs.append('search', params.search);
    if (params.role) qs.append('role', params.role);
    return request<{ documents: DocumentItem[] }>(`/docs?${qs.toString()}`);
  },

  getDocumentDetails: (id: string) =>
    request<{ document: DocumentItem & { raw_text: string }; chunks: DocumentChunk[] }>(`/docs/${id}`),

  uploadDocument: (formData: FormData) =>
    request<{ message: string; document: DocumentItem }>('/docs/upload', {
      method: 'POST',
      body: formData
    }),

  deleteDocument: (id: string) =>
    request<{ message: string }>(`/docs/${id}`, {
      method: 'DELETE'
    }),

  // AI Assistant Chat
  getChatSessions: () => request<{ sessions: ChatSession[] }>('/chat/sessions'),
  createChatSession: (title?: string, userId?: string) =>
    request<{ session: ChatSession }>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, user_id: userId })
    }),
  deleteChatSession: (id: string) =>
    request<{ message: string }>(`/chat/sessions/${id}`, {
      method: 'DELETE'
    }),
  getSessionMessages: (sessionId: string) =>
    request<{ messages: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`),
  sendChatMessage: (sessionId: string, message: string, userRole: string) =>
    request<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, userRole })
    }),

  // Smart Search
  smartSearch: (params: { q: string; dept?: string; format?: string; role?: string }) => {
    const qs = new URLSearchParams();
    qs.append('q', params.q);
    if (params.dept) qs.append('dept', params.dept);
    if (params.format) qs.append('format', params.format);
    if (params.role) qs.append('role', params.role);
    return request<{
      query: string;
      count: number;
      results: SearchResultChunk[];
      projectMatches: Project[];
    }>(`/search?${qs.toString()}`);
  }
};
