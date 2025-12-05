import initSqlJs, { Database } from 'sql.js';

const DB_KEY = 'poker-splitwise-db';

let dbInstance: Database | null = null;
let sqlPromise: Promise<any> | null = null;

// Initialize SQL.js
async function initSQL() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  return sqlPromise;
}

// Load database from localStorage or create new one
export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSQL();

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem(DB_KEY);

  let db: Database;
  if (savedDb) {
    // Restore database from saved data
    const binaryArray = JSON.parse(savedDb);
    const uint8Array = new Uint8Array(binaryArray);
    db = new SQL.Database(uint8Array);
  } else {
    // Create new database
    db = new SQL.Database();
    await initializeSchema(db);
  }

  dbInstance = db;

  // Save if it's a new database
  if (!savedDb) {
    await saveDatabase();
  }

  return db;
}

// Save database to localStorage
export async function saveDatabase(): Promise<void> {
  const db = await getDatabase();
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem(DB_KEY, JSON.stringify(array));
}

// Initialize database schema
async function initializeSchema(db: Database): Promise<void> {
  if (!db) return;

  // Create players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      default_conversion_rate REAL DEFAULT 0.01,
      chips TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create game_sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      conversion_rate REAL NOT NULL,
      starting_chips INTEGER NOT NULL,
      chips TEXT NOT NULL,
      players TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_players_name ON players(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(date DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON game_sessions(completed)');

  // Insert default settings
  const defaultChips = [
    { id: 'chip-1', label: '1', color: '#8B4513', value: 1, count: 20 },
    { id: 'chip-2', label: '5', color: '#FFFFFF', value: 5, count: 20 },
    { id: 'chip-3', label: '25', color: '#2E7D32', value: 25, count: 20 },
    { id: 'chip-4', label: '50', color: '#1976D2', value: 50, count: 20 },
    { id: 'chip-5', label: '100', color: '#FBC02D', value: 100, count: 20 }
  ];

  db.run(
    'INSERT INTO settings (id, default_conversion_rate, chips) VALUES (?, ?, ?)',
    ['default', 0.01, JSON.stringify(defaultChips)]
  );

  await saveDatabase();
}

// Export database as file
export async function exportDatabase(): Promise<Blob> {
  const db = await getDatabase();
  const data = db.export();
  // Convert Uint8Array to ArrayBuffer for Blob
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/octet-stream' });
}

// Import database from file
export async function importDatabase(file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const SQL = await initSQL();
  const newDb = new SQL.Database(uint8Array);

  // Close old database
  if (dbInstance) {
    dbInstance.close();
  }

  dbInstance = newDb;
  await saveDatabase();
}

// Clear database (for testing)
export async function clearDatabase(): Promise<void> {
  localStorage.removeItem(DB_KEY);
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
