import { Player, GameSession, Chip } from '../types';
import { getDatabase, saveDatabase } from '../lib/database';

export interface Settings {
  defaultConversionRate: number;
  chips: Chip[];
}

// Players
export async function loadPlayers(): Promise<Player[]> {
  try {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM players ORDER BY name');

    if (result.length === 0) {
      return [];
    }

    const rows = result[0];
    return rows.values.map(row => ({
      id: row[0] as string,
      name: row[1] as string,
      balance: parseFloat(row[2] as string)
    }));
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
}

export async function savePlayer(player: Omit<Player, 'id'>): Promise<Player | null> {
  try {
    const db = await getDatabase();
    const id = crypto.randomUUID();

    db.run(
      'INSERT INTO players (id, name, balance) VALUES (?, ?, ?)',
      [id, player.name, player.balance]
    );

    await saveDatabase();

    return {
      id,
      name: player.name,
      balance: player.balance
    };
  } catch (error) {
    console.error('Error saving player:', error);
    return null;
  }
}

export async function updatePlayer(player: Player): Promise<boolean> {
  try {
    const db = await getDatabase();

    db.run(
      'UPDATE players SET name = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [player.name, player.balance, player.id]
    );

    await saveDatabase();
    return true;
  } catch (error) {
    console.error('Error updating player:', error);
    return false;
  }
}

export async function deletePlayer(playerId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    db.run('DELETE FROM players WHERE id = ?', [playerId]);
    await saveDatabase();
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}

// Sessions
export async function loadSessions(): Promise<GameSession[]> {
  try {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM game_sessions ORDER BY date DESC');

    if (result.length === 0) {
      return [];
    }

    const rows = result[0];
    return rows.values.map(row => ({
      id: row[0] as string,
      date: row[1] as string,
      conversionRate: parseFloat(row[2] as string),
      startingChips: parseInt(row[3] as string),
      chips: JSON.parse(row[4] as string),
      players: JSON.parse(row[5] as string),
      completed: (row[6] as number) === 1
    }));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

export async function saveSession(session: GameSession): Promise<GameSession | null> {
  try {
    const db = await getDatabase();

    // Check if session exists
    const exists = db.exec('SELECT id FROM game_sessions WHERE id = ?', [session.id]);

    if (exists.length > 0 && exists[0].values.length > 0) {
      // Update existing session
      db.run(
        `UPDATE game_sessions
         SET date = ?, conversion_rate = ?, starting_chips = ?, chips = ?, players = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          session.date,
          session.conversionRate,
          session.startingChips,
          JSON.stringify(session.chips),
          JSON.stringify(session.players),
          session.completed ? 1 : 0,
          session.id
        ]
      );
    } else {
      // Insert new session
      db.run(
        `INSERT INTO game_sessions (id, date, conversion_rate, starting_chips, chips, players, completed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.date,
          session.conversionRate,
          session.startingChips,
          JSON.stringify(session.chips),
          JSON.stringify(session.players),
          session.completed ? 1 : 0
        ]
      );
    }

    await saveDatabase();
    return session;
  } catch (error) {
    console.error('Error saving session:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    db.run('DELETE FROM game_sessions WHERE id = ?', [sessionId]);
    await saveDatabase();
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

// Settings
export async function loadSettings(): Promise<Settings> {
  try {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM settings LIMIT 1');

    if (result.length === 0 || result[0].values.length === 0) {
      // Return default settings
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

    const row = result[0].values[0];
    return {
      defaultConversionRate: parseFloat(row[1] as string),
      chips: JSON.parse(row[2] as string)
    };
  } catch (error) {
    console.error('Error loading settings:', error);
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
    const db = await getDatabase();

    // Check if settings exist
    const exists = db.exec('SELECT id FROM settings LIMIT 1');

    if (exists.length > 0 && exists[0].values.length > 0) {
      const settingsId = exists[0].values[0][0] as string;
      // Update existing settings
      db.run(
        'UPDATE settings SET default_conversion_rate = ?, chips = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [settings.defaultConversionRate, JSON.stringify(settings.chips), settingsId]
      );
    } else {
      // Insert new settings
      db.run(
        'INSERT INTO settings (id, default_conversion_rate, chips) VALUES (?, ?, ?)',
        ['default', settings.defaultConversionRate, JSON.stringify(settings.chips)]
      );
    }

    await saveDatabase();
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Clear all data (for testing)
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM players');
  db.run('DELETE FROM game_sessions');
  await saveDatabase();
}
