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

export interface GameSession {
  id: string;
  date: string; // ISO date string
  conversionRate: number; // e.g., 0.01 means 1 chip = 1 cent
  startingChips: number; // Same for all players
  players: SessionPlayer[];
  completed: boolean;
  chips?: Chip[]; // Store chip definitions used in this session
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
