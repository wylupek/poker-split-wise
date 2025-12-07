import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { GameSession, DbGameSession } from '../../../shared/types/index.js';
import { randomUUID } from 'crypto';

export function getAllSessions(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM game_sessions ORDER BY date DESC').all() as DbGameSession[];

    const sessions: GameSession[] = rows.map(row => ({
      id: row.id,
      date: row.date,
      endTime: row.end_time || undefined,
      conversionRate: row.conversion_rate,
      startingChips: row.starting_chips,
      chips: JSON.parse(row.chips),
      players: JSON.parse(row.players),
      borrowTransactions: row.borrow_transactions ? JSON.parse(row.borrow_transactions) : undefined,
      completed: row.completed === 1
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}

export function createSession(req: Request, res: Response): void {
  try {
    const session: GameSession = req.body;

    if (!session.id) {
      session.id = randomUUID();
    }

    if (!session.date) {
      session.date = new Date().toISOString();
    }

    const db = getDatabase();

    // Check if session exists (for updates)
    const existing = db.prepare('SELECT id FROM game_sessions WHERE id = ?').get(session.id);

    if (existing) {
      // Update existing session
      db.prepare(
        `UPDATE game_sessions
         SET date = ?, end_time = ?, conversion_rate = ?, starting_chips = ?, chips = ?, players = ?, borrow_transactions = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        session.date,
        session.endTime || null,
        session.conversionRate,
        session.startingChips,
        JSON.stringify(session.chips || []),
        JSON.stringify(session.players),
        session.borrowTransactions ? JSON.stringify(session.borrowTransactions) : null,
        session.completed ? 1 : 0,
        session.id
      );
    } else {
      // Insert new session
      db.prepare(
        `INSERT INTO game_sessions (id, date, end_time, conversion_rate, starting_chips, chips, players, borrow_transactions, completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        session.id,
        session.date,
        session.endTime || null,
        session.conversionRate,
        session.startingChips,
        JSON.stringify(session.chips || []),
        JSON.stringify(session.players),
        session.borrowTransactions ? JSON.stringify(session.borrowTransactions) : null,
        session.completed ? 1 : 0
      );
    }

    res.status(existing ? 200 : 201).json(session);
  } catch (error) {
    console.error('Error creating/updating session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
}

export function deleteSession(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const db = getDatabase();
    const result = db.prepare('DELETE FROM game_sessions WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
}
