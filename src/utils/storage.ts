import { Player, GameSession, Settings } from '../../shared/types';
import { api } from './api';

// Re-export Settings type for convenience
export type { Settings };

// Players
export async function loadPlayers(): Promise<Player[]> {
  try {
    const response = await api.get<Player[]>('/players');
    return response.data;
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
}

export async function savePlayer(player: Omit<Player, 'id'>): Promise<Player | null> {
  try {
    const response = await api.post<Player>('/players', player);
    return response.data;
  } catch (error) {
    console.error('Error saving player:', error);
    return null;
  }
}

export async function updatePlayer(player: Player): Promise<boolean> {
  try {
    await api.put(`/players/${player.id}`, player);
    return true;
  } catch (error) {
    console.error('Error updating player:', error);
    return false;
  }
}

export async function deletePlayer(playerId: string): Promise<boolean> {
  try {
    await api.delete(`/players/${playerId}`);
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}

// Sessions
export async function loadSessions(): Promise<GameSession[]> {
  try {
    const response = await api.get<GameSession[]>('/sessions');
    return response.data;
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

export async function saveSession(session: GameSession): Promise<GameSession | null> {
  try {
    const response = await api.post<GameSession>('/sessions', session);
    return response.data;
  } catch (error) {
    console.error('Error saving session:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await api.delete(`/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

// Settings
export async function loadSettings(): Promise<Settings> {
  try {
    const response = await api.get<Settings>('/settings');
    return response.data;
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return default settings on error
    return {
      defaultConversionRate: 0.01,
      chips: [
        { id: 'chip-1', label: '1', color: '#8B4513', value: 1, count: 20 },
        { id: 'chip-2', label: '5', color: '#FFFFFF', value: 5, count: 20 },
        { id: 'chip-3', label: '25', color: '#2E7D32', value: 25, count: 20 },
        { id: 'chip-4', label: '50', color: '#1976D2', value: 50, count: 20 },
        { id: 'chip-5', label: '100', color: '#FBC02D', value: 100, count: 20 }
      ]
    };
  }
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await api.put('/settings', settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}
