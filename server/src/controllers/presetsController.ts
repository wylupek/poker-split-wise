import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { ChipPreset, DbChipPreset } from '../../../shared/types/index.js';

export function getAllPresets(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM chip_presets ORDER BY created_at ASC').all() as DbChipPreset[];

    const presets: ChipPreset[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      chips: JSON.parse(row.chips),
      isDefault: row.is_default === 1
    }));

    res.json(presets);
  } catch (error) {
    console.error('Error getting presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
}

export function createPreset(req: Request, res: Response): void {
  try {
    const { name, chips } = req.body as { name: string; chips: any[] };

    if (!name || !Array.isArray(chips)) {
      res.status(400).json({ error: 'Invalid preset data' });
      return;
    }

    const db = getDatabase();
    const presetId = `preset-${Date.now()}`;

    db.prepare('INSERT INTO chip_presets (id, name, chips, is_default) VALUES (?, ?, ?, ?)').run(
      presetId,
      name,
      JSON.stringify(chips),
      0
    );

    const preset: ChipPreset = {
      id: presetId,
      name,
      chips,
      isDefault: false
    };

    res.status(201).json(preset);
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Failed to create preset' });
  }
}

export function updatePreset(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { name, chips } = req.body as { name?: string; chips?: any[] };

    if (!name && !chips) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    const db = getDatabase();

    // Check if preset exists
    const existing = db.prepare('SELECT id FROM chip_presets WHERE id = ?').get(id) as { id: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Preset not found' });
      return;
    }

    // Update preset
    if (name && chips) {
      db.prepare('UPDATE chip_presets SET name = ?, chips = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        name,
        JSON.stringify(chips),
        id
      );
    } else if (name) {
      db.prepare('UPDATE chip_presets SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);
    } else if (chips) {
      db.prepare('UPDATE chip_presets SET chips = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        JSON.stringify(chips),
        id
      );
    }

    // Fetch updated preset
    const updated = db.prepare('SELECT * FROM chip_presets WHERE id = ?').get(id) as DbChipPreset;

    const preset: ChipPreset = {
      id: updated.id,
      name: updated.name,
      chips: JSON.parse(updated.chips),
      isDefault: updated.is_default === 1
    };

    res.json(preset);
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update preset' });
  }
}

export function deletePreset(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if preset exists
    const existing = db.prepare('SELECT id, is_default FROM chip_presets WHERE id = ?').get(id) as
      | { id: string; is_default: number }
      | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Preset not found' });
      return;
    }

    // Check if it's the only preset
    const count = db.prepare('SELECT COUNT(*) as count FROM chip_presets').get() as { count: number };

    if (count.count <= 1) {
      res.status(400).json({ error: 'Cannot delete the last preset' });
      return;
    }

    // If deleting the default preset, set another one as default
    if (existing.is_default === 1) {
      const nextDefault = db.prepare('SELECT id FROM chip_presets WHERE id != ? LIMIT 1').get(id) as
        | { id: string }
        | undefined;

      if (nextDefault) {
        db.prepare('UPDATE chip_presets SET is_default = 1 WHERE id = ?').run(nextDefault.id);
        db.prepare('UPDATE settings SET default_preset_id = ? WHERE id = ?').run(nextDefault.id, 'default');
      }
    }

    // Delete preset
    db.prepare('DELETE FROM chip_presets WHERE id = ?').run(id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
}

export function setDefaultPreset(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if preset exists
    const existing = db.prepare('SELECT id FROM chip_presets WHERE id = ?').get(id) as { id: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Preset not found' });
      return;
    }

    // Unset all other defaults
    db.prepare('UPDATE chip_presets SET is_default = 0').run();

    // Set this preset as default
    db.prepare('UPDATE chip_presets SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    // Update settings table
    db.prepare('UPDATE settings SET default_preset_id = ? WHERE id = ?').run(id, 'default');

    // Fetch updated preset
    const updated = db.prepare('SELECT * FROM chip_presets WHERE id = ?').get(id) as DbChipPreset;

    const preset: ChipPreset = {
      id: updated.id,
      name: updated.name,
      chips: JSON.parse(updated.chips),
      isDefault: true
    };

    res.json(preset);
  } catch (error) {
    console.error('Error setting default preset:', error);
    res.status(500).json({ error: 'Failed to set default preset' });
  }
}
