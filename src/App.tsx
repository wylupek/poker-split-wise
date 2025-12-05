import "./App.css";
import { SectionCard } from "./components/SectionCard";
import { GameConfig } from "./domain/types";
import { DEFAULT_DENOMINATIONS, DEFAULT_MULTIPLIER } from "./domain/constants";

const sampleConfig: GameConfig = {
  players_count: 4,
  player_ids: [],
  multiplier: DEFAULT_MULTIPLIER,
  denominations: DEFAULT_DENOMINATIONS,
  chips_count_per_denom: 20,
  calculator_mode: "SALDO",
  allow_loans_between_players: true,
  allow_loans_from_bank: true,
  max_debt_per_player: null
};

const sections = [
  {
    title: "Setup",
    description:
      "Configure table limits, chip counts, and calculator mode before play starts.",
    items: [
      "Player selection (2–5 players) and multiplier configuration",
      "Chip split preview: per-player stacks and bank remainder",
      "Mode toggle: SALDO vs BUY_IN"
    ]
  },
  {
    title: "Live Session",
    description:
      "Track stacks, rebuys, and loans without needing a backend service.",
    items: [
      "Per-player stack value with denomination breakdown",
      "Rebuy events with funding source: wallet, loan, or new cash",
      "Loan ledger between players or from the bank"
    ]
  },
  {
    title: "Settlement",
    description:
      "End-of-session calculator to reconcile chip counts and cash transfers.",
    items: [
      "Final stack entry by denomination with consistency checks",
      "Net results summary and Splitwise-style settlement suggestions",
      "Wallet balance updates (SALDO mode)"
    ]
  }
];

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">Poker Split Wise</p>
          <h1>Local-first poker bank</h1>
          <p className="lead">
            React + TypeScript + Vite scaffold. Everything runs in the browser,
            no backend required. State can later be persisted to localStorage.
          </p>
        </div>
        <div className="pill">
          <span className="pill__label">Default config</span>
          <span className="pill__value">
            {sampleConfig.players_count} players · {sampleConfig.multiplier}x
            multiplier · {sampleConfig.chips_count_per_denom} chips/denom
          </span>
        </div>
      </header>

      <main className="grid">
        {sections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            description={section.description}
            items={section.items}
          />
        ))}
      </main>

      <footer className="footer">
        <div>
          <p className="eyebrow">Next up</p>
          <ul>
            <li>Define data store for players, sessions, loans.</li>
            <li>Add forms for session setup and live event capture.</li>
            <li>Implement settlement calculator and localStorage sync.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;


