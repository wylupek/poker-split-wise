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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
          <span className="text-3xl">📊</span>
          Session History
        </h2>
        <div className="bg-background-lightest rounded-lg p-12 text-center border border-poker-800/30">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No History Yet</h3>
          <p className="text-foreground-muted">Complete your first session to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-poker-400 flex items-center gap-2">
          <span className="text-3xl">📊</span>
          Session History
        </h2>
        <div className="px-4 py-2 bg-poker-900/20 rounded-full border border-poker-700/50">
          <span className="text-foreground-muted text-sm">
            Total: <span className="text-poker-400 font-bold">{sessions.length}</span> session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {[...sessions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((session, index) => (
            <div
              key={session.id}
              className="bg-background-lightest rounded-lg border border-poker-800/30 overflow-hidden hover:border-poker-700/50 transition-all"
            >
              {/* Two Column Layout: Header+Config | Players List */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-0">
                {/* Left Side: Session Header + Game Config */}
                <div className="p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-background-lightest">
                  {/* Session Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-poker-900/30 flex items-center justify-center text-poker-400 font-bold text-lg border border-poker-700/50">
                      #{sessions.length - index}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg">
                        {new Date(session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-foreground-muted">
                        {new Date(session.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Game Config Stats */}
                  <div className="bg-background/50 rounded-lg p-4 border border-background-lightest space-y-3">
                    <div>
                      <div className="text-xs text-foreground-muted mb-1">Players</div>
                      <div className="text-2xl font-bold text-foreground">{session.players.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-foreground-muted mb-1">Starting Chips</div>
                      <div className="text-2xl font-bold text-foreground">{session.startingChips}</div>
                    </div>
                    <div>
                      <div className="text-xs text-foreground-muted mb-1">Conversion Rate</div>
                      <div className="text-2xl font-bold text-poker-400">${session.conversionRate.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Delete + Player Results List */}
                <div className="p-6 space-y-4">
                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?\n\nThis will reverse all balance changes from this session.')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg font-medium bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-700/50 transition-all"
                  >
                    ✕ Delete Session
                  </button>

                  {/* Players List */}
                  <div className="space-y-2">
                    {session.players
                      .map(sp => {
                        const chipDiff = sp.finalChips - sp.startingChips;
                        const moneyDiff = chipDiff * session.conversionRate;
                        return { ...sp, chipDiff, moneyDiff };
                      })
                      .sort((a, b) => b.moneyDiff - a.moneyDiff)
                      .map(sp => (
                        <div
                          key={sp.playerId}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-background-lightest hover:border-poker-700/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              sp.moneyDiff > 0
                                ? 'bg-gradient-to-br from-poker-600 to-poker-800'
                                : sp.moneyDiff < 0
                                ? 'bg-gradient-to-br from-red-600 to-red-800'
                                : 'bg-gradient-to-br from-gray-600 to-gray-800'
                            }`}>
                              {getPlayerName(sp.playerId).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {getPlayerName(sp.playerId)}
                              </div>
                              <div className="text-xs text-foreground-muted">
                                {sp.chipDiff >= 0 ? '+' : ''}{sp.chipDiff} chips
                              </div>
                            </div>
                          </div>
                          <div className={`text-xl font-bold ${
                            sp.moneyDiff > 0
                              ? 'text-poker-400'
                              : sp.moneyDiff < 0
                              ? 'text-red-400'
                              : 'text-foreground-muted'
                          }`}>
                            {sp.moneyDiff >= 0 ? '+' : '−'} ${Math.abs(sp.moneyDiff).toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
