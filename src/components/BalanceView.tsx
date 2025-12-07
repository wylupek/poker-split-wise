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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          Balances
        </h2>
        <div className="bg-background-lightest rounded-lg p-12 text-center border border-poker-800/30">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-poker-400 mb-2">All Settled!</h3>
          <p className="text-foreground-muted">Everyone's balance is zero. Start a new session to play!</p>
        </div>
      </div>
    );
  }

  const settlements = calculateMinimalSettlement(players);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">💰</span>
        Current Balances
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background-lightest rounded-lg p-6 border border-red-800/30">
          <div className="text-sm text-foreground-muted mb-2">Total Owed</div>
          <div className="text-3xl font-bold text-red-400">
            ${totalNegative.toFixed(2)}
          </div>
        </div>
        <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
          <div className="text-sm text-foreground-muted mb-2">Total Receivable</div>
          <div className="text-3xl font-bold text-poker-400">
            ${totalPositive.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Player Balances */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Player Balances</h3>
        <div className="space-y-3">
          {players
            .filter(p => Math.abs(p.balance) > 0.01)
            .sort((a, b) => b.balance - a.balance)
            .map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    player.balance >= 0
                      ? 'bg-gradient-to-br from-poker-600 to-poker-800'
                      : 'bg-gradient-to-br from-red-600 to-red-800'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground text-lg">{player.name}</span>
                </div>
                <div className={`text-2xl font-bold ${
                  player.balance >= 0 ? 'text-poker-400' : 'text-red-400'
                }`}>
                  {player.balance >= 0 ? '+' : '−'} ${Math.abs(player.balance).toFixed(2)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Settlement Instructions */}
      {settlements.length > 0 && (
        <div className="bg-poker-900/20 rounded-lg p-6 border border-poker-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔄</span>
            <h3 className="text-xl font-bold text-poker-400">
              Minimal Settlement
            </h3>
            <span className="ml-2 px-3 py-1 bg-poker-500/20 rounded-full text-sm font-medium text-poker-400">
              {settlements.length} transaction{settlements.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {settlements.map((transaction, idx) => {
              const fromPlayer = players.find(p => p.id === transaction.from);
              const toPlayer = players.find(p => p.id === transaction.to);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-background-lightest rounded-lg border border-poker-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm">
                        {fromPlayer?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{fromPlayer?.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-foreground-muted">
                      <span className="text-xl">→</span>
                      <span className="text-sm">pays</span>
                      <span className="text-xl">→</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-poker-600 to-poker-800 flex items-center justify-center text-white font-bold text-sm">
                        {toPlayer?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{toPlayer?.name}</span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-poker-400">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-background/50 rounded-lg border border-poker-800/30">
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="text-poker-400">💡</span>
              <p>
                This is the <strong className="text-foreground">minimum number of transactions</strong> needed to settle all balances.
                Once these payments are made, everyone's balance will be zero.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
