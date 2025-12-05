# Poker Home Bank – Functional and Domain Specification (EN)

## 1. Purpose of the app

The app should:

- track **who actually invested how much** in a given game,
- track the **value of chips** during and after the game,
- handle **loans** between players (borrowing, re-buys),
- provide a **simple settlement** at the end: who owes whom and how much real cash,
- support two working modes:
  1. **Balance-first mode** – a player mostly plays using their balance/piggy bank.
  2. **Fixed buy-in mode** – a player always joins a game for a specified amount (buy-in).

Implementation technology is free to choose. The specification focuses on logic and conceptual models.

---

## 2. General assumptions

1. We play poker with chips.
2. There is a **limited number of chips**:
   - 5 denominations: `x1`, `x2`, `x5`, `x10`, `x25`
   - Each denomination has `chips_count` pieces (e.g., 20).
3. All denominations are multiplied by `multiplier` (e.g., 1 PLN / 2 PLN / 5 PLN).
4. Player count is variable: `players_count ∈ [2, 5]`.
5. Chips are split evenly among players; leftovers stay in the **bank**.
6. The app **does not enforce poker rules** – we only care about cash/chips.

---

## 3. Glossary (ontology)

### 3.1. Chip

A **chip** is a physical token with a denomination:

- Field: `denomination` ∈ {1, 2, 5, 10, 25}
- Field: `multiplier` – base currency value (e.g., 1 PLN).
- Monetary value of a chip:

  ```
  chip_value = denomination × multiplier
  ```

In practice we don’t model individual chips – just **counts** per denomination.

### 3.2. Chip set (ChipSet)

**ChipSet** describes all chips available for a given table setup:

- `denominations = [1, 2, 5, 10, 25]`
- `chips_count_per_denom` – how many pieces of each denomination (e.g., 20)
- `multiplier` – currency value (e.g., 1 PLN)

Total value of all chips:

```
total_chipset_value = multiplier × chips_count_per_denom × sum(denominations)
```

Example:

- `chips_count_per_denom = 20`
- `denominations = [1, 2, 5, 10, 25]`, sum is 43
- `multiplier = 1`

```
total_chipset_value = 20 × 43 × 1 = 860 PLN
```

### 3.3. Chip bank (Bank)

The **bank** is the stack of chips that:

- were not dealt at the start,
- or returned to the bank during the game (e.g., someone busts and gives chips back).

Parameters:

- `bank_chips[denomination]` – chip counts in the bank per denomination
- `bank_value` – monetary value of the bank chips

### 3.4. Player

A player has:

- `id`
- `name`
- **Global wallet/balance** (persistent across games):
  - `wallet_balance` – amount of real cash assigned to the player in the system
- **State in a given game**:
  - `session_stack[denomination]` – chip counts per denomination
  - `session_stack_value` – value of those chips
  - `session_buyin_total` – how much real money the player has put into the current game (total)
  - `session_rebuys[]` – list of extra buy-ins/loans
  - `session_net_result` – financial result at game end (profit/loss)

### 3.5. GameSession

**GameSession** describes a single game/night:

- `id`
- `created_at`
- `players` – list of participants
- `config` – table configuration (chipset, multiplier, calculator mode)
- `initial_stacks` – chips dealt to each player at start
- `bank_initial` – chips left in the bank
- `events[]` – in-game events (re-buys, loans)
- `final_stacks` – chip states at game end
- `settlement` – game settlement (who pays whom)

### 3.6. Loan / Rebuy

When a player busts or wants to add chips:

- **Loan from another player**:
  - `lender_id`
  - `borrower_id`
  - `loan_value` (currency)
  - `chips_transferred[denomination]`
  - `is_from_wallet` – did the lender fund from wallet balance or just from their in-game winnings
- **Loan from bank/shared pool**:
  - similar, but `lender_id = BANK`

A loan affects:

- **chip state** (physical chip transfer),
- **debt relations** (who owes whom, beyond game result).

### 3.7. Wallet / Balance

Each player has a **global wallet**:

- represents cumulative wins/losses across games,
- can fund entry to future games (Mode 1),
- never “disappears” – we always know the player’s balance in the system.

---

## 4. Calculator modes

The app has two main working modes.

### 4.1. Mode 1 – “Balance first” (frugal / Splitwise style)

Assumptions:

- A player joins a new game **first using their existing wallet_balance**.
- New external cash (from pocket) is only added if:
  - someone wants to buy in higher than their balance allows, or
  - they busted and others won’t/can’t fund them from winnings.

In practice:

1. **Starting a new game**:
   - for each player the system suggests the maximum possible buy-in from `wallet_balance`,
   - if a player wants to enter for more, the difference is recorded as “new cash”.
2. **During the game – loans/re-buys**:
   - if a player busts:
     - they can:
       - **borrow** from another player (loan),
       - or take from the bank (if using a shared pot),
     - the system records it as a **re-buy event** plus a **debt relation**.
   - at each loan the system tries to:
     - minimize **new external cash**,
     - prefer using existing balances and in-game winnings.
3. **After the game**:
   - compute each player’s **net session result**,
   - update `wallet_balance`:

     ```
     wallet_balance_new = wallet_balance_old + session_net_result
     ```

   - settle loans (who repays whom).

Effect:

- Total `wallet_balance` across the system increases only when someone actually adds new money (e.g., new player or extra external buy-in).
- We minimize “virtual money” – like Splitwise, aiming for few real transfers.

### 4.2. Mode 2 – “Player always buys in” (classic buy-in)

Assumptions:

- Each game is a separate event.
- A player **always declares a buy-in amount**.
- Buy-in is independent of wallet (can be linked, but by default treated as a separate game entry).

In practice:

1. **Game start**:
   - `session_buyin_total` is declared per player (e.g., 100 PLN),
   - based on chip values the player gets a stack equal to buy-in (or what the table config allows).
2. **During the game**:
   - player may `rebuy` for another amount (e.g., +50 PLN),
   - each re-buy increases `session_buyin_total`.
3. **After the game**:
   - compute `session_stack_value`,
   - session result:

     ```
     session_net_result = session_stack_value - session_buyin_total
     ```

   - if using wallets, add result to `wallet_balance` (optional),
   - loans handled as in Mode 1.

Effect:

- Each session has a **clearly defined buy-in**.
- Closer to classic poker with buy-ins.

---

## 5. Table and game configuration

### 5.1. Config parameters

```yaml
GameConfig:
  players_count: int           # 2–5
  player_ids: [uuid]           # selected players
  multiplier: float            # e.g., 1.0 PLN
  denominations: [1, 2, 5, 10, 25]
  chips_count_per_denom: int   # e.g., 20
  calculator_mode: "SALDO" | "BUY_IN"
  allow_loans_between_players: bool
  allow_loans_from_bank: bool
  max_debt_per_player: float | null
```

### 5.2. Chip split at start

For each denomination:

```
chips_per_player = floor(chips_count_per_denom / players_count)
```

```
chips_in_bank = chips_count_per_denom - players_count × chips_per_player
```

Example (yours):

- `chips_count_per_denom = 20`
- `players_count = 3`

```
chips_per_player = floor(20 / 3) = 6
chips_in_bank = 20 - 3 × 6 = 2
```

Each player gets:

- 6 chips of each denomination `1,2,5,10,25`
- total starting stack value:

```
session_stack_value_start = 6 × (1 + 2 + 5 + 10 + 25) × multiplier = 6 × 43 × multiplier
```

For `multiplier = 1 PLN`:

```
session_stack_value_start = 258 PLN
```

---

## 6. Game flow from the app perspective

> Note: the app **does not track hand-by-hand**, only major financial events.

### 6.1. Game start

For each new session:

1. User creates `GameSession`.
2. Chooses `players_count` and specific players.
3. Sets `multiplier` and calculator mode (`SALDO` / `BUY_IN`).
4. App:
   - splits chips between players and bank,
   - computes `session_stack_value_start` for each,
   - depending on mode:
     - Mode 1: system suggests funding the full value from `wallet_balance` (if possible),
     - Mode 2: system assumes `session_buyin_total = session_stack_value_start` (or user-entered).

### 6.2. Event: Bankruptcy and re-buy

During play:

- Player `P` loses all chips (`session_stack_value = 0`).
- Wants to continue – needs new chips.

#### 6.2.1. Loan from another player

Event type `LOAN_FROM_PLAYER`:

- User inputs:
  - `from_player_id` (lender)
  - `to_player_id` (borrower)
  - `chips_transferred[denomination]` (physical chips)
- System:
  - calculates chip value: `loan_value`,
  - updates:
    - chip states: subtract from lender, add to borrower,
    - creates `Loan` record:

      ```json
      {
        "lender_id": "A",
        "borrower_id": "B",
        "loan_value": 100,
        "chips_transferred": { "5": 4, "10": 6 },
        "session_id": "...",
        "status": "OPEN"
      }
      ```

  - in Mode 1 may also note whether the loan changes `wallet_balance` (e.g., new cash vs. using in-session winnings).

#### 6.2.2. Loan from bank

Event type `LOAN_FROM_BANK`:

- `from_player_id = BANK`
- `to_player_id = P`
- `chips_transferred` – chips taken from bank (if available)

System checks:

- whether the bank has enough chips,
- if not – shows **warning** / blocks.

### 6.3. Event: Re-buy without busting

A player who still has chips may want to **top up**.

Handling:

- Event `REBUY`:
  - `player_id`
  - `chips_transferred` (from bank / from another player)
  - `funding_source`: `NEW_CASH` | `WALLET` | `LOAN_FROM_PLAYER`
- System updates accordingly:
  - `session_buyin_total` (if new cash),
  - debt relations (if loan),
  - `wallet_balance` (Mode 1).

---

## 7. Game end and settlement

### 7.1. Inputs for settlement

At game end user enters:

- for each player:
  - `final_stack[denomination]` – chip counts remaining,
- optionally:
  - total bank chip value (can be auto-computed).

System:

1. Converts `final_stack_value` per player.
2. Computes:

   ```
   session_net_result = final_stack_value - session_buyin_total
   ```

3. Checks whether sum of results ≈ 0 (consistency check – no missing money).

### 7.2. Settlement without loans

Simplest case – **no loans**:

- Player with positive `session_net_result` is **up** – others owe them.
- Player with negative result **lost**.

Splitwise-like algorithm:

1. `debtors` – players with negative result.
2. `creditors` – players with positive result.
3. Iteratively match debtors to creditors, minimizing transfers.

Outcome:

- Simple list: `X pays Y = amount`.

### 7.3. Settlement with loans

Loans change **who financed whom during the game**.

Logic example:

1. At game end compute “game result” **as if no loans existed** – based on buy-in + re-buys (regardless of source).
2. Then **adjust results** for loans:
   - if B borrowed 100 from A:
     - B has **an extra 100 debt to A**, regardless of game result,
     - if B won and is +300:
       - B repays A 100,
       - the rest goes to the normal Splitwise settlement.
3. Model-wise:
   - treat each `Loan` as an **individual mini-split** between lender and borrower.

Formally:

- Each `Loan` generates at the end an extra transaction:

  ```
  borrower → lender: loan_value
  ```

- After applying these, run the **flattened** Splitwise algorithm between everyone.

### 7.4. Wallet updates (Mode 1 and Mode 2)

After settlement:

- Mode 1 (“balance”):
  - update each player’s `wallet_balance` by `session_net_result`,
  - loans should be settled – `status = SETTLED`.
- Mode 2 (“fixed buy-in”):
  - option 1: also update `wallet_balance` (if tracking long-term results),
  - option 2: sessions are independent and `wallet_balance` is unused (one-off settlements only).

---

## 8. Data model (conceptual)

### 8.1. Player

```json
{
  "id": "uuid",
  "name": "string",
  "wallet_balance": 0.0
}
```

### 8.2. GameSession

```json
{
  "id": "uuid",
  "created_at": "datetime",
  "config": { /* GameConfig */ },
  "player_ids": ["uuid"],
  "initial_stacks": {
    "player_id": { "1": 6, "2": 6, "5": 6, "10": 6, "25": 6 }
  },
  "bank_initial": { "1": 2, "2": 2, "5": 2, "10": 2, "25": 2 },
  "events": [ /* Loan, Rebuy, etc. */ ],
  "final_stacks": {
    "player_id": { "1": 0, "2": 1, "5": 3, "10": 2, "25": 0 }
  },
  "settlement": {
    "net_results": { "player_id": 120.0 },
    "transfers": [
      { "from": "A", "to": "B", "amount": 50.0 }
    ]
  }
}
```

### 8.3. Loan

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "lender_id": "uuid" | "BANK",
  "borrower_id": "uuid",
  "loan_value": 100.0,
  "chips_transferred": { "5": 4, "10": 6 },
  "created_at": "datetime",
  "status": "OPEN" | "SETTLED"
}
```

---

## 9. User interface (views)

### 9.1. Dashboard

- List of players and their `wallet_balance`.
- List of recent games:
  - date,
  - player count,
  - mode (SALDO / BUY_IN),
  - link to details.

### 9.2. New game configuration

Steps:

1. Choose players (`players_count`, `player_ids`).
2. Set:
   - `multiplier`,
   - `chips_count_per_denom`,
   - calculator mode.
3. Summary:
   - how many chips each player gets,
   - starting stack value.

In Mode 2 also:

- optionally set **individual buy-in** per player.

### 9.3. In-game panel

Per-player view:

- current chip stack (counts by denomination),
- stack value (`stack_value`),
- total buy-ins and re-buys.

Actions:

- “Busted and wants re-buy”:
  - choose source (other player / bank / new cash),
  - choose value / chip counts,
  - record `Loan` / `Rebuy`.
- “Add simple loan” – fixed amount without chip counts.

### 9.4. Settlement screen

At the end:

1. Form:
   - enter `final_stack[denomination]` per player,
2. App:
   - computes `session_net_result`,
   - generates transfers:
     - between players for game result,
     - for loans,
   - shows:

```
Summary:
- A: +120 PLN
- B: -60 PLN
- C: -60 PLN

Transactions:
- B -> A: 60 PLN
- C -> A: 60 PLN
```

3. In Mode 1:
   - “Save to wallets” button – updates `wallet_balance`.

---

## 10. Rules and edge cases

### 10.1. No chips left in bank

- If a player wants a re-buy from the bank and `bank_chips` are insufficient:
  - app shows **warning**,
  - suggests re-buy from another player (loan),
  - optionally allows adding “virtual chips” -> increase `chips_count_per_denom` (if the group has more physical chips).

### 10.2. Debt limit

- If `max_debt_per_player` is set:
  - if a loan would exceed the limit:
    - app blocks the loan or requires confirmation (hard/soft limit).

### 10.3. Chip count inconsistency

- Check:
  - sum of chips with players + in bank should equal a **constant** for the session (unless we allow adding new chips).
- If mismatch (e.g., user enters wrong `final_stack`):
  - app reports error and asks for correction.

---

## 11. Example scenario (3 players, multiplier = 1 PLN)

### 11.1. Parameters

- `players_count = 3`
- `chips_count_per_denom = 20`
- `denominations = [1, 2, 5, 10, 25]`
- `multiplier = 1`
- Mode: `SALDO`

At start:

- each player: 6 pieces of each denomination → 258 PLN total,
- bank: 2 pieces of each denomination → 86 PLN.

### 11.2. Flow (high level)

1. A, B, C play.
2. Player C busts.
3. C wants to continue:
   - borrows chips worth 100 PLN from A.
   - app records `Loan` (A → C: 100).
4. Game continues, at the end:
   - A has chips worth 300 PLN,
   - B has 200 PLN,
   - C has 0 PLN (busted again).

Total buy-in (example):

- A: 258 PLN (start) + 0 re-buy
- B: 258 PLN
- C: 258 PLN (start) + 100 PLN (loan from A) = 358 PLN

Sum of buy-ins = 874 PLN  
Sum of final stacks = 500 PLN (shows a gap – example only; in real life values must reconcile or be explained as tips/rake/lost chips).

For settlement:

- Game result (ignoring the loan):
  - A: +42 PLN
  - B: -58 PLN
  - C: +16 PLN (example – normally sums must balance).
- **Additionally** C owes A 100 PLN.

Final:

- C → A: 100 PLN (loan repayment),
- rest settled via Splitwise algorithm.

---

If you want next steps, we can prepare:

- ready **JSON / OpenAPI schemas**,
- a minimal **database model** for this logic (tables, keys, relations),
- simple **UI flow** (screen mocks, button names, example forms).


