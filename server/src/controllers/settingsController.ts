import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { Settings, DbSettings } from '../../../shared/types/index.js';

export function getSettings(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM settings LIMIT 1').get() as DbSettings | undefined;

    if (!row) {
      // Return default settings if none exist
      const defaultSettings: Settings = {
        defaultConversionRate: 0.01,
        chips: [
          { id: 'chip-1', label: '1', color: '#8B4513', value: 1, count: 20 },
          { id: 'chip-2', label: '5', color: '#FFFFFF', value: 5, count: 20 },
          { id: 'chip-3', label: '25', color: '#2E7D32', value: 25, count: 20 },
          { id: 'chip-4', label: '50', color: '#1976D2', value: 50, count: 20 },
          { id: 'chip-5', label: '100', color: '#FBC02D', value: 100, count: 20 }
        ]
      };
      res.json(defaultSettings);
      return;
    }

    const settings: Settings = {
      defaultConversionRate: row.default_conversion_rate,
      chips: JSON.parse(row.chips)
    };

    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export function updateSettings(req: Request, res: Response): void {
  try {
    const { defaultConversionRate, chips } = req.body as Settings;

    if (typeof defaultConversionRate !== 'number' || !Array.isArray(chips)) {
      res.status(400).json({ error: 'Invalid settings data' });
      return;
    }

    const db = getDatabase();

    // Check if settings exist
    const existing = db.prepare('SELECT id FROM settings LIMIT 1').get() as { id: string } | undefined;

    if (existing) {
      // Update existing settings
      db.prepare(
        'UPDATE settings SET default_conversion_rate = ?, chips = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(defaultConversionRate, JSON.stringify(chips), existing.id);
    } else {
      // Insert new settings
      db.prepare('INSERT INTO settings (id, default_conversion_rate, chips) VALUES (?, ?, ?)').run(
        'default',
        defaultConversionRate,
        JSON.stringify(chips)
      );
    }

    const settings: Settings = { defaultConversionRate, chips };
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

export function clearAllData(req: Request, res: Response): void {
  try {
    const db = getDatabase();

    db.prepare('DELETE FROM players').run();
    db.prepare('DELETE FROM game_sessions').run();

    console.log('✓ All data cleared');
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
}
