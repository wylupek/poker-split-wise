export type Denomination = 1 | 2 | 5 | 10 | 25;

export type CalculatorMode = "SALDO" | "BUY_IN";

export type ChipStack = Partial<Record<Denomination, number>>;

export interface Player {
  id: string;
  name: string;
  wallet_balance: number;
}

export interface GameConfig {
  players_count: number;
  player_ids: string[];
  multiplier: number;
  denominations: Denomination[];
  chips_count_per_denom: number;
  calculator_mode: CalculatorMode;
  allow_loans_between_players: boolean;
  allow_loans_from_bank: boolean;
  max_debt_per_player: number | null;
}

export interface Loan {
  id: string;
  session_id: string;
  lender_id: string | "BANK";
  borrower_id: string;
  loan_value: number;
  chips_transferred: ChipStack;
  created_at: string;
  status: "OPEN" | "SETTLED";
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface Settlement {
  net_results: Record<string, number>;
  transfers: SettlementTransfer[];
}

export interface GameSession {
  id: string;
  created_at: string;
  config: GameConfig;
  player_ids: string[];
  initial_stacks: Record<string, ChipStack>;
  bank_initial: ChipStack;
  events: Loan[];
  final_stacks: Record<string, ChipStack>;
  settlement: Settlement;
}


