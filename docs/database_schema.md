# Database Schema

This document describes the SQLite database structure used by Poker Split-Wise.

## Overview

The app uses **SQLite** running in the browser via [sql.js](https://github.com/sql-js/sql.js). The database is stored in localStorage as a binary array under the key `poker-splitwise-db`.

## Tables

### `players`

Stores player information and running balances across all sessions.

| Column      | Type      | Constraints           | Description                          |
|-------------|-----------|----------------------|--------------------------------------|
| id          | TEXT      | PRIMARY KEY          | UUID v4 identifier                   |
| name        | TEXT      | NOT NULL             | Player's display name                |
| balance     | REAL      | DEFAULT 0            | Current balance (cumulative)         |
| created_at  | TEXT      | DEFAULT CURRENT_TIMESTAMP | When player was added       |
| updated_at  | TEXT      | DEFAULT CURRENT_TIMESTAMP | Last modification time      |

**Indexes:**
- `idx_players_name` on `name` - for fast player lookup

**Example:**
```sql
SELECT * FROM players;
```
```
id                                   | name    | balance | created_at              | updated_at
-------------------------------------|---------|---------|-------------------------|-------------------------
550e8400-e29b-41d4-a716-446655440000 | Alice   | 15.50   | 2024-12-05 10:00:00     | 2024-12-05 22:30:00
6ba7b810-9dad-11d1-80b4-00c04fd430c8 | Bob     | -8.25   | 2024-12-05 10:00:00     | 2024-12-05 22:30:00
```

---

### `settings`

Stores default chip configurations and conversion rates. Single row table (only one settings record).

| Column                    | Type      | Constraints           | Description                              |
|---------------------------|-----------|----------------------|------------------------------------------|
| id                        | TEXT      | PRIMARY KEY          | Always 'default'                         |
| default_conversion_rate   | REAL      | DEFAULT 0.01         | Default chip-to-currency rate            |
| chips                     | TEXT      | NOT NULL             | JSON array of chip configurations        |
| created_at                | TEXT      | DEFAULT CURRENT_TIMESTAMP | When settings were created      |
| updated_at                | TEXT      | DEFAULT CURRENT_TIMESTAMP | Last modification time          |

**Chip JSON Structure:**
```json
[
  {
    "id": "chip-1",
    "label": "1",
    "color": "#8B4513",
    "value": 1,
    "count": 20
  },
  {
    "id": "chip-2",
    "label": "5",
    "color": "#FFFFFF",
    "value": 5,
    "count": 20
  }
]
```

**Example:**
```sql
SELECT * FROM settings;
```

---

### `game_sessions`

Stores completed poker game sessions with chip configurations and player results.

| Column           | Type      | Constraints           | Description                              |
|------------------|-----------|----------------------|------------------------------------------|
| id               | TEXT      | PRIMARY KEY          | UUID v4 identifier                       |
| date             | TEXT      | DEFAULT CURRENT_TIMESTAMP | When session started            |
| conversion_rate  | REAL      | NOT NULL             | Chip-to-currency rate for this session   |
| starting_chips   | INTEGER   | NOT NULL             | Starting chips per player                |
| chips            | TEXT      | NOT NULL             | JSON array of chip config for session    |
| players          | TEXT      | NOT NULL             | JSON array of player results             |
| completed        | INTEGER   | DEFAULT 0            | 1 if completed, 0 if cancelled           |
| created_at       | TEXT      | DEFAULT CURRENT_TIMESTAMP | When record was created         |
| updated_at       | TEXT      | DEFAULT CURRENT_TIMESTAMP | Last modification time          |

**Indexes:**
- `idx_game_sessions_date` on `date DESC` - for recent sessions first
- `idx_game_sessions_completed` on `completed` - for filtering completed sessions

**Players JSON Structure:**
```json
[
  {
    "playerId": "550e8400-e29b-41d4-a716-446655440000",
    "startingChips": 100,
    "finalChips": 125,
    "chipCounts": {
      "chip-1": 5,
      "chip-2": 10,
      "chip-3": 4
    }
  }
]
```

**Example:**
```sql
SELECT id, date, conversion_rate, starting_chips, completed
FROM game_sessions
WHERE completed = 1
ORDER BY date DESC
LIMIT 5;
```

---

## Relationships

### Logical Relationships (Not Enforced)

While SQLite foreign keys are not strictly enforced in this schema, there are logical relationships:

```
players (1) -----> (*) game_sessions.players[].playerId
  |
  └─> Player balances are updated when sessions complete
```

**Note:** The `players` field in `game_sessions` is a JSON array that references player IDs, but this is not enforced at the database level.

---

## Data Flow

### Creating a Session

1. User selects players and chip configuration
2. `game_sessions` record created with:
   - Player IDs
   - Chip configuration
   - Starting chips per player
   - Conversion rate

### Completing a Session

1. Final chip counts entered for each player
2. Calculate winnings/losses: `(final - starting) * conversion_rate`
3. Update `players.balance` for each player
4. Mark `game_sessions.completed = 1`

### Deleting a Session

1. Calculate original balance changes
2. Reverse the changes to `players.balance`
3. Delete from `game_sessions`

---

## Storage Details

### Location
- **Browser:** localStorage
- **Key:** `poker-splitwise-db`
- **Format:** JSON array of bytes (SQLite binary serialized)

### Size Considerations

- Typical database size: ~50KB for 100 sessions
- localStorage limit: ~5-10MB (browser dependent)
- Estimated capacity: ~10,000 sessions before hitting limits

### Performance

- All queries run in-memory (fast)
- Database loaded once on app start
- Saved to localStorage after each modification
- No network overhead

---

## Queries & Examples

### Get Player Statistics

```sql
SELECT
  p.name,
  p.balance,
  COUNT(DISTINCT s.id) as sessions_played
FROM players p
LEFT JOIN game_sessions s ON s.players LIKE '%' || p.id || '%'
WHERE s.completed = 1
GROUP BY p.id, p.name, p.balance
ORDER BY p.balance DESC;
```

### Session History

```sql
SELECT
  date,
  starting_chips,
  conversion_rate,
  (starting_chips * conversion_rate) as buy_in_amount
FROM game_sessions
WHERE completed = 1
ORDER BY date DESC;
```

### Total Games Played

```sql
SELECT COUNT(*) as total_games
FROM game_sessions
WHERE completed = 1;
```

### Recent Activity

```sql
SELECT
  date,
  starting_chips,
  conversion_rate
FROM game_sessions
WHERE completed = 1
  AND date >= datetime('now', '-30 days')
ORDER BY date DESC;
```

---

## Schema Migrations

Currently, the schema is initialized when the database is first created. For future schema changes:

1. Check database version (could add a `schema_version` table)
2. Apply migrations as needed
3. Update `schema_version`

**Note:** No migration system is currently implemented. Breaking changes would require manual database export/import.

---

## Backup Recommendations

1. **Automatic:** Data persists in localStorage
2. **Manual Export:** Use browser console to export .db file weekly
3. **CSV Exports:** Export players and sessions to CSV for external analysis
4. **External Tools:** Use DB Browser for SQLite for advanced queries

See [database_management.md](./database_management.md) for detailed backup/restore instructions.
