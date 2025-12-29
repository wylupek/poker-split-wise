import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'poker-splitwise.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize database
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Initialize schema
  initializeSchema(db);

  console.log(`✓ Database initialized at ${DB_PATH}`);

  return db;
}

function initializeSchema(db: Database.Database): void {
  // Create players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      default_conversion_rate REAL DEFAULT 0.01,
      chips TEXT NOT NULL,
      default_preset_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create chip_presets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chip_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      chips TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create game_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      end_time TEXT,
      conversion_rate REAL NOT NULL,
      starting_chips INTEGER NOT NULL,
      chips TEXT NOT NULL,
      players TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add end_time column to existing game_sessions table if it doesn't exist
  const tableInfo = db.prepare("PRAGMA table_info(game_sessions)").all() as { name: string }[];
  const hasEndTime = tableInfo.some(col => col.name === 'end_time');

  if (!hasEndTime) {
    db.exec('ALTER TABLE game_sessions ADD COLUMN end_time TEXT');
    console.log('✓ Added end_time column to game_sessions table');
  }

  // Migration: Add borrow_transactions column to existing game_sessions table if it doesn't exist
  const hasBorrowTransactions = tableInfo.some(col => col.name === 'borrow_transactions');

  if (!hasBorrowTransactions) {
    db.exec('ALTER TABLE game_sessions ADD COLUMN borrow_transactions TEXT');
    console.log('✓ Added borrow_transactions column to game_sessions table');
  }

  // Migration: Add default_preset_id column to existing settings table if it doesn't exist
  const settingsTableInfo = db.prepare("PRAGMA table_info(settings)").all() as { name: string }[];
  const hasDefaultPresetId = settingsTableInfo.some(col => col.name === 'default_preset_id');

  if (!hasDefaultPresetId) {
    db.exec('ALTER TABLE settings ADD COLUMN default_preset_id TEXT');
    console.log('✓ Added default_preset_id column to settings table');
  }

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_players_name ON players(name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(date DESC)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON game_sessions(completed)');

  // Check if default settings exist
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };

  if (settingsCount.count === 0) {
    // Insert default settings
    const defaultChips = [
      { id: 'chip-1', label: '1', color: '#8B4513', value: 1, count: 20 },
      { id: 'chip-2', label: '5', color: '#FFFFFF', value: 5, count: 20 },
      { id: 'chip-3', label: '25', color: '#2E7D32', value: 25, count: 20 },
      { id: 'chip-4', label: '50', color: '#1976D2', value: 50, count: 20 },
      { id: 'chip-5', label: '100', color: '#FBC02D', value: 100, count: 20 }
    ];

    db.prepare('INSERT INTO settings (id, default_conversion_rate, chips) VALUES (?, ?, ?)').run(
      'default',
      0.01,
      JSON.stringify(defaultChips)
    );

    console.log('✓ Default settings created');
  }

  // Migration: Create default preset from existing settings if no presets exist
  const presetsCount = db.prepare('SELECT COUNT(*) as count FROM chip_presets').get() as { count: number };

  if (presetsCount.count === 0) {
    const settings = db.prepare('SELECT chips FROM settings WHERE id = ?').get('default') as { chips: string } | undefined;

    if (settings) {
      const presetId = 'preset-default';
      db.prepare('INSERT INTO chip_presets (id, name, chips, is_default) VALUES (?, ?, ?, ?)').run(
        presetId,
        'Default',
        settings.chips,
        1
      );

      // Set this preset as the default in settings
      db.prepare('UPDATE settings SET default_preset_id = ? WHERE id = ?').run(presetId, 'default');

      console.log('✓ Default chip preset created from existing settings');
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
