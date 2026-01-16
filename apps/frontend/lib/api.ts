const API_BASE = '';

export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `/api${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Type-safe API methods
export const api = {
  // Projects
  getProjects: () => fetcher<Project[]>('/projects'),
  getProject: (id: string) => fetcher<Project>(`/projects/${id}`),
  createProject: (data: CreateProjectData) =>
    fetcher<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<CreateProjectData>) =>
    fetcher<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    fetcher<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Docs
  getDocs: (projectId: string) => fetcher<Doc[]>(`/projects/${projectId}/docs`),
  getDoc: (projectId: string, fileName: string) =>
    fetcher<Doc>(`/projects/${projectId}/docs/${fileName}`),
  updateDoc: (projectId: string, fileName: string, content: string) =>
    fetcher<Doc>(`/projects/${projectId}/docs/${fileName}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  syncDocs: (projectId: string, options?: { path?: string; recursive?: boolean }) =>
    fetcher<Doc[]>(`/projects/${projectId}/docs/sync`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),
  pushDoc: (projectId: string, fileName: string) =>
    fetcher<{ success: boolean }>(`/projects/${projectId}/docs/${fileName}/push`, {
      method: 'POST',
    }),

  // Lock
  getLock: (projectId: string) => fetcher<Lock | null>(`/projects/${projectId}/lock`),
  acquireLock: (projectId: string, lockedBy: string, reason?: string) =>
    fetcher<Lock>(`/projects/${projectId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ lockedBy, reason }),
    }),
  releaseLock: (projectId: string) =>
    fetcher<{ released: boolean }>(`/projects/${projectId}/lock`, {
      method: 'DELETE',
    }),

  // API Keys
  generateApiKey: (projectId: string, name: string) =>
    fetcher<ApiKey>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};

// Types (shared with backend)
export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  docsPath: string;
  createdAt: string;
  updatedAt: string;
  locks?: Lock[];
  docs?: Doc[];
  apiKeys?: ApiKey[];
  _count?: { docs: number; apiKeys: number };
}

export interface Doc {
  id: string;
  projectId: string;
  fileName: string;
  content: string;
  hash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lock {
  id: string;
  projectId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt?: string;
  reason?: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProjectData {
  name: string;
  repoUrl: string;
  token: string;
  branch?: string;
  docsPath?: string;
}
