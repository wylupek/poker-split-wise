import { GameSession, Player } from '../types';

interface Props {
  sessions: GameSession[];
  players: Player[];
  onDeleteSession: (sessionId: string) => void;
}

export function SessionHistory({ sessions, players, onDeleteSession }: Props) {
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  if (sessions.length === 0) {
    return (
      <div className="session-history">
        <h2>Session History</h2>
        <p className="empty-state">No completed sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="session-history">
      <h2>Session History</h2>

      <div className="sessions-list">
        {[...sessions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div>
                  <strong>{new Date(session.date).toLocaleDateString()}</strong>
                  <span className="session-time">
                    {' at '}
                    {new Date(session.date).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this session? This will reverse the balance changes.')) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>

              <div className="session-details">
                <p>
                  <strong>Players:</strong> {session.players.length}
                  {' | '}
                  <strong>Starting chips:</strong> {session.startingChips}
                  {' | '}
                  <strong>Rate:</strong> 1 chip = ${session.conversionRate.toFixed(2)}
                </p>
              </div>

              <div className="session-results">
                {session.players
                  .map(sp => {
                    const chipDiff = sp.finalChips - sp.startingChips;
                    const moneyDiff = chipDiff * session.conversionRate;
                    return { ...sp, chipDiff, moneyDiff };
                  })
                  .sort((a, b) => b.moneyDiff - a.moneyDiff)
                  .map(sp => (
                    <div key={sp.playerId} className="result-item">
                      <span className="player-name">{getPlayerName(sp.playerId)}</span>
                      <span className="chips">
                        {sp.chipDiff >= 0 ? '+' : ''}{sp.chipDiff} chips
                      </span>
                      <span className={`money ${sp.moneyDiff >= 0 ? 'positive' : 'negative'}`}>
                        {sp.moneyDiff >= 0 ? '+' : ''}${sp.moneyDiff.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
