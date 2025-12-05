## **Poker Settlement System — Functional Specification**

### **Goal**

Maintain a continuous settlement system for home poker games where players always start each new session with equal chips, while long-term balances reflect actual wins and losses.

---

## **Core Rules**

### **1. Chip Reset per Session**

* At the start of every session, all players receive the same value of chips.
* Chips are only an in-game representation of value, not long-term balances.

### **2. Fixed Chip Conversion Rate**

* The group agrees on a constant conversion (e.g., 1 chip = 0.01 currency units).
* This rate is applied at the end of each session to compute real-value results.

### **3. Session Result Calculation**

For each player:

```
chip_difference = final_chips - starting_chips
session_value = chip_difference × conversion_rate
```

A positive value means the player won money, negative means a loss.

---

## **4. Persistent Player Balances**

Each player has a long-term balance:

```
balance[player] += session_value
```

* Balances accumulate across sessions.
* Chips do **not** carry over; only balances do.

---

## **5. Optional Settlement**

At any moment, players may settle their balances.
The system can compute:

```
the minimal set of transactions needed for all balances to return to zero
```

(similar to Splitwise’s debt minimization).

---

## **6. Independence of Sessions**

* Each game session is isolated.
* Balances allow players to join or leave freely.
* Chips always start from zero baseline each time.

---

## **7. System Outcomes**

This model allows:

* variable number of players,
* flexible stakes,
* consistent bookkeeping,
* continuous scorekeeping independent of physical chips.
