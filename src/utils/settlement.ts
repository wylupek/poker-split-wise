import { Player, Transaction } from '../types';

/**
 * Computes the minimal set of transactions needed to settle all balances.
 * Uses a greedy algorithm: repeatedly match the largest debtor with the largest creditor.
 */
export function calculateMinimalSettlement(players: Player[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Create a working copy of balances
  const balances = players.map(p => ({
    playerId: p.id,
    balance: p.balance
  }));

  // Continue until all balances are settled (within a small epsilon for floating point)
  const epsilon = 0.01; // 1 cent tolerance

  while (true) {
    // Find the player who owes the most (most negative balance)
    const maxDebtor = balances.reduce((max, curr) =>
      curr.balance < max.balance ? curr : max
    );

    // Find the player who is owed the most (most positive balance)
    const maxCreditor = balances.reduce((max, curr) =>
      curr.balance > max.balance ? curr : max
    );

    // If both are close to zero, we're done
    if (Math.abs(maxDebtor.balance) < epsilon && Math.abs(maxCreditor.balance) < epsilon) {
      break;
    }

    // Calculate the transaction amount (minimum of what debtor owes and creditor is owed)
    const amount = Math.min(Math.abs(maxDebtor.balance), maxCreditor.balance);

    if (amount < epsilon) {
      break; // No meaningful transaction left
    }

    // Record the transaction
    transactions.push({
      from: maxDebtor.playerId,
      to: maxCreditor.playerId,
      amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
    });

    // Update balances
    maxDebtor.balance += amount;
    maxCreditor.balance -= amount;
  }

  return transactions;
}

/**
 * Calculates session results and updates player balances
 */
export function calculateSessionResults(
  startingChips: number,
  conversionRate: number,
  sessionPlayers: Array<{ playerId: string; finalChips: number }>
): Map<string, number> {
  const results = new Map<string, number>();

  sessionPlayers.forEach(({ playerId, finalChips }) => {
    const chipDifference = finalChips - startingChips;
    const sessionValue = chipDifference * conversionRate;
    results.set(playerId, sessionValue);
  });

  return results;
}
