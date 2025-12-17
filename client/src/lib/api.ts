const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

// Auth
export const auth = {
  register: (username: string, email: string, password: string) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Player
export const player = {
  getProfile: () => fetchApi('/player/profile'),
  allocateStats: (stats: Record<string, number>) =>
    fetchApi('/player/stats', {
      method: 'PUT',
      body: JSON.stringify(stats),
    }),
  getInventory: () => fetchApi('/player/inventory'),
  getShop: () => fetchApi('/player/shop'),
  buyItem: (itemId: number) =>
    fetchApi(`/player/shop/${itemId}`, { method: 'POST' }),
};

// Quests
export const quests = {
  getAll: (type?: string) => fetchApi(`/quests${type ? `?type=${type}` : ''}`),
  create: (quest: {
    name: string;
    description?: string;
    questType: string;
    difficulty?: string;
    targetCount?: number;
    statType?: string;
  }) =>
    fetchApi('/quests', {
      method: 'POST',
      body: JSON.stringify(quest),
    }),
  updateProgress: (questId: number, progress: number) =>
    fetchApi(`/quests/${questId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    }),
  complete: (questId: number) =>
    fetchApi(`/quests/${questId}/complete`, { method: 'POST' }),
  delete: (questId: number) =>
    fetchApi(`/quests/${questId}`, { method: 'DELETE' }),
};

// Dungeons
export const dungeons = {
  getAll: () => fetchApi('/dungeons'),
  getActive: () => fetchApi('/dungeons/active'),
  start: (dungeonId: number) =>
    fetchApi(`/dungeons/${dungeonId}/start`, { method: 'POST' }),
  complete: () => fetchApi('/dungeons/complete', { method: 'POST' }),
};

