export interface Player {
  id: string;
  name: string;
  balance: number; // Current balance in currency (accumulates across sessions)
}

export interface Chip {
  id: string;
  label: string;
  color: string; // Hex color code
  value: number;
  count: number; // Total number of chips available
}

export interface ChipCounts {
  [chipId: string]: number;
}

export interface SessionPlayer {
  playerId: string;
  startingChips: number;
  finalChips: number;
  chipCounts?: ChipCounts; // Optional: for visual chip counting
}

export interface BorrowTransaction {
  id: string;
  borrower: string; // Player ID or "bank"
  lender: string; // Player ID or "bank"
  amount: number; // Chip amount
  timestamp: string;
}

export interface GameSession {
  id: string;
  date: string; // ISO date string (start time)
  endTime?: string; // ISO date string (when session was completed)
  conversionRate: number; // e.g., 0.01 means 1 chip = 1 cent
  startingChips: number; // Same for all players
  players: SessionPlayer[];
  completed: boolean;
  chips?: Chip[]; // Store chip definitions used in this session
  borrowTransactions?: BorrowTransaction[]; // Track chip loans during session
}

export interface Transaction {
  from: string; // Player ID
  to: string; // Player ID
  amount: number;
}

export interface Settlement {
  transactions: Transaction[];
  totalAmount: number;
}

export interface AppState {
  players: Player[];
  sessions: GameSession[];
  currentSession: GameSession | null;
}

// Settings interface (used by storage layer)
export interface Settings {
  defaultConversionRate: number;
  chips: Chip[];
}

// Database-specific types
export interface DbPlayer {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface DbSettings {
  id: string;
  default_conversion_rate: number;
  chips: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DbGameSession {
  id: string;
  date: string;
  end_time: string | null;
  conversion_rate: number;
  starting_chips: number;
  chips: string; // JSON string
  players: string; // JSON string
  borrow_transactions: string | null; // JSON string
  completed: number; // SQLite boolean (0 or 1)
  created_at: string;
  updated_at: string;
}
