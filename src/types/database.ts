// Database types matching Supabase schema
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
  chips: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface DbGameSession {
  id: string;
  date: string;
  conversion_rate: number;
  starting_chips: number;
  chips: any; // JSONB - chip configuration
  players: any; // JSONB - player session data
  completed: boolean;
  created_at: string;
  updated_at: string;
}
