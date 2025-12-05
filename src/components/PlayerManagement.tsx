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
    <div className="player-management">
      <h2>Players</h2>

      <form onSubmit={handleSubmit} className="add-player-form">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Player name"
          className="input"
        />
        <button type="submit" className="btn btn-primary">
          Add Player
        </button>
      </form>

      <div className="player-list">
        {players.length === 0 ? (
          <p className="empty-state">No players yet. Add your first player above.</p>
        ) : (
          <ul>
            {players.map(player => (
              <li key={player.id} className="player-item">
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  <span className={`player-balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>
                    ${player.balance.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="btn btn-danger btn-sm"
                  disabled={player.balance !== 0}
                  title={player.balance !== 0 ? 'Cannot remove player with non-zero balance' : 'Remove player'}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
