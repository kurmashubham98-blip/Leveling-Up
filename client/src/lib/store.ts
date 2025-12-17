import { create } from 'zustand';
import { player as playerApi, quests as questsApi } from './api';

interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
}

interface Player {
  id: number;
  username: string;
  email: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  rank_name: string;
  rank_color: string;
  gold: number;
  stat_points: number;
  streak_days: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
}

interface Quest {
  id: number;
  custom_name: string;
  custom_description: string;
  quest_type: string;
  difficulty: string;
  xp_reward: number;
  gold_reward: number;
  current_progress: number;
  target_count: number;
  status: string;
}

interface GameStore {
  player: Player | null;
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
  
  setPlayer: (player: Player | null) => void;
  fetchPlayer: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  completeQuest: (questId: number) => Promise<{ levelUp: boolean; newLevel: number }>;
  logout: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  quests: [],
  isLoading: false,
  error: null,

  setPlayer: (player) => set({ player }),

  fetchPlayer: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await playerApi.getProfile();
      set({ player: data.player, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchQuests: async () => {
    try {
      const data = await questsApi.getAll();
      set({ quests: data.quests });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  completeQuest: async (questId: number) => {
    const result = await questsApi.complete(questId);
    await get().fetchPlayer();
    await get().fetchQuests();
    return result;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ player: null, quests: [] });
  },
}));

