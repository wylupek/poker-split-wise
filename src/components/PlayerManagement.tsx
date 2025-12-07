import { useState } from 'react';
import { Player } from '../types';

interface Props {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

export function PlayerManagement({ players, onAddPlayer, onRemovePlayer }: Props) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">👥</span>
        Players
      </h2>

      {/* Add Player Form */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add New Player</h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name..."
            className="flex-1 bg-background border border-background-lightest rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500 focus:border-poker-500"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim()}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              newPlayerName.trim()
                ? 'bg-poker-500 hover:bg-poker-600 text-white shadow-glow-sm hover:shadow-glow'
                : 'bg-background-lightest text-foreground-muted cursor-not-allowed'
            }`}
          >
            + Add Player
          </button>
        </form>
      </div>

      {/* Player List */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          All Players <span className="text-foreground-muted text-sm font-normal">({players.length})</span>
        </h3>

        {players.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-lg">No players yet</p>
            <p className="text-sm mt-2">Add your first player above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map(player => {
              const hasBalance = player.balance !== 0;
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-all"
                >
                  {/* Player Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      player.balance > 0
                        ? 'bg-gradient-to-br from-poker-600 to-poker-800'
                        : player.balance < 0
                        ? 'bg-gradient-to-br from-red-600 to-red-800'
                        : 'bg-gradient-to-br from-gray-600 to-gray-800'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-lg">
                        {player.name}
                      </div>
                      <div className={`text-sm font-medium ${
                        player.balance > 0
                          ? 'text-poker-400'
                          : player.balance < 0
                          ? 'text-red-400'
                          : 'text-foreground-muted'
                      }`}>
                        Balance: {player.balance >= 0 ? '+' : '−'} ${Math.abs(player.balance).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    disabled={hasBalance}
                    title={hasBalance ? 'Cannot remove player with non-zero balance. Settle balances first.' : 'Remove player'}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      hasBalance
                        ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-700/50'
                    }`}
                  >
                    {hasBalance ? '🔒 Remove' : '✕ Remove'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      {players.some(p => p.balance !== 0) && (
        <div className="bg-background/50 rounded-lg p-4 border border-poker-800/30">
          <div className="flex items-start gap-2 text-sm text-foreground-muted">
            <span className="text-poker-400">💡</span>
            <p>
              Players with non-zero balances are <strong className="text-foreground">locked</strong> and cannot be removed.
              Complete sessions or clear balances first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
