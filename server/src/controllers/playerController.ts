import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { Player, DbPlayer } from '../../../shared/types/index.js';
import { randomUUID } from 'crypto';

export function getAllPlayers(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM players ORDER BY name').all() as DbPlayer[];

    const players: Player[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      balance: row.balance
    }));

    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}

export function createPlayer(req: Request, res: Response): void {
  try {
    const { name, balance = 0 } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Player name is required' });
      return;
    }

    const db = getDatabase();
    const id = randomUUID();

    db.prepare('INSERT INTO players (id, name, balance) VALUES (?, ?, ?)').run(id, name, balance);

    const player: Player = { id, name, balance };
    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
}

export function updatePlayer(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { name, balance } = req.body;

    if (!name || typeof name !== 'string' || typeof balance !== 'number') {
      res.status(400).json({ error: 'Valid name and balance are required' });
      return;
    }

    const db = getDatabase();
    const result = db
      .prepare('UPDATE players SET name = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, balance, id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const player: Player = { id, name, balance };
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
}

export function deletePlayer(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const db = getDatabase();
    const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
}
