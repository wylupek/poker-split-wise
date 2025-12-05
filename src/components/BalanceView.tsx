import { Player } from '../types';
import { calculateMinimalSettlement } from '../utils/settlement';

interface Props {
  players: Player[];
}

export function BalanceView({ players }: Props) {
  const playersWithBalance = players.filter(p => Math.abs(p.balance) > 0.01);
  const totalPositive = players.reduce((sum, p) => sum + (p.balance > 0 ? p.balance : 0), 0);
  const totalNegative = players.reduce((sum, p) => sum + (p.balance < 0 ? Math.abs(p.balance) : 0), 0);

  if (playersWithBalance.length === 0) {
    return (
      <div className="balance-view">
        <h2>Balances</h2>
        <p className="empty-state">All balances are settled!</p>
      </div>
    );
  }

  const settlements = calculateMinimalSettlement(players);

  return (
    <div className="balance-view">
      <h2>Current Balances</h2>

      <div className="balance-summary">
        <div className="summary-item">
          <span>Total owed:</span>
          <span className="negative">${totalNegative.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span>Total receivable:</span>
          <span className="positive">${totalPositive.toFixed(2)}</span>
        </div>
      </div>

      <div className="balance-list">
        {players
          .filter(p => Math.abs(p.balance) > 0.01)
          .sort((a, b) => b.balance - a.balance)
          .map(player => (
            <div key={player.id} className="balance-item">
              <span className="player-name">{player.name}</span>
              <span className={`balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>
                {player.balance >= 0 ? '+' : ''}${player.balance.toFixed(2)}
              </span>
            </div>
          ))}
      </div>

      {settlements.length > 0 && (
        <div className="settlement-section">
          <h3>Minimal Settlement ({settlements.length} transaction{settlements.length !== 1 ? 's' : ''})</h3>
          <div className="settlement-list">
            {settlements.map((transaction, idx) => {
              const fromPlayer = players.find(p => p.id === transaction.from);
              const toPlayer = players.find(p => p.id === transaction.to);

              return (
                <div key={idx} className="settlement-item">
                  <strong>{fromPlayer?.name}</strong>
                  {' pays '}
                  <strong>{toPlayer?.name}</strong>
                  {' '}
                  <span className="amount">${transaction.amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
