# Poker Split-Wise

A Splitwise-style settlement system for home poker games. Track poker sessions, manage player balances, and calculate minimal settlements.

## Features

- **Player Management**: Add and manage players with persistent balances
- **Session Tracking**: Start poker sessions with customizable chip values and conversion rates
- **Real-time Balance Updates**: See how chip changes convert to real money during sessions
- **Smart Settlements**: Calculate the minimum number of transactions needed to settle all balances (like Splitwise)
- **Session History**: View and manage past poker sessions
- **Local SQLite Database**: All data stored locally in your browser using SQLite (safe and secure)

## How It Works

1. **Players Start Equal**: Every session begins with all players receiving the same number of chips
2. **Chips = Temporary Currency**: Chips only matter during a game session
3. **Conversion to Money**: At session end, chip differences are converted to real money using a fixed rate
4. **Balances Accumulate**: Player balances persist across sessions
5. **Smart Settlement**: The system calculates the minimal set of payments to zero out all balances

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

No configuration needed - the SQLite database is created automatically in your browser!

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### 1. Add Players

Go to the **Players** tab and add all players who will participate in your poker games.

### 2. Start a Session

- Navigate to the **New Session** tab
- Set the starting chips (same for all players)
- Set the conversion rate (e.g., 0.01 means 1 chip = $0.01)
- Select at least 2 players
- Click **Start Session**

### 3. Track the Game

During the game, update each player's final chip count. The app will automatically calculate:
- Chip difference from starting amount
- Real money equivalent

### 4. Complete the Session

When the game ends, click **Complete Session**. Player balances will be automatically updated.

### 5. View Balances

The **Balances** tab shows:
- Current balance for each player
- Total amounts owed/receivable
- **Minimal Settlement**: The optimal set of transactions to settle all debts

### 6. Session History

View all past sessions in the **History** tab. You can delete sessions if needed (this will reverse the balance changes).

## Example

**Setup:**
- 3 players: Alice, Bob, Charlie
- Starting chips: 100 each
- Conversion rate: $0.10 per chip

**Game Results:**
- Alice ends with 150 chips (+50 chips = +$5.00)
- Bob ends with 80 chips (-20 chips = -$2.00)
- Charlie ends with 70 chips (-30 chips = -$3.00)

**Balances After Session:**
- Alice: +$5.00
- Bob: -$2.00
- Charlie: -$3.00

**Minimal Settlement:**
- Bob pays Alice $2.00
- Charlie pays Alice $3.00

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS** - Styling
- **sql.js** - SQLite database running in the browser (WebAssembly)

## Data Storage

All data is stored locally in a **SQLite database** running in your browser:
- **players** table - Player list and balances
- **game_sessions** table - Game session history with chip configurations
- **settings** table - Default chip configurations and conversion rates

### Local & Secure

- Database file stored in browser localStorage as `poker-splitwise-db`
- All data stays on your computer
- No external servers or accounts required
- Can export/import database for backups

### Documentation

- **[Database Schema](./docs/database_schema.md)** - Complete database structure and table definitions
- **[Database Management](./docs/database_management.md)** - How to query, export, and manage your data
- **[General Rules](./docs/general_rules.md)** - Game rules and settlement logic

### Quick Database Management

To clear all data, open the browser console and run:
```javascript
localStorage.removeItem('poker-splitwise-db')
```

Then refresh the page to create a fresh database.

For advanced operations (export to CSV, query data, backup/restore), see [Database Management Guide](./docs/database_management.md).

## Contributing

This is a simple, self-contained poker settlement tracker. Feel free to fork and customize for your own games!

## License

MIT
