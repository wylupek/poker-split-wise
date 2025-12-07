import { GameSession, Player, BorrowTransaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  sessions: GameSession[];
  players: Player[];
}

// Calculate correction for a player based on borrow transactions
function calculatePlayerCorrection(playerId: string, transactions: BorrowTransaction[]): number {
  return transactions.reduce((correction, tx) => {
    if (tx.borrower === playerId) {
      return correction + tx.amount; // Borrowed chips (debt)
    } else if (tx.lender === playerId) {
      return correction - tx.amount; // Lent chips (credit)
    }
    return correction;
  }, 0);
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalSessions: number;
  totalTimePlayed: number; // in minutes
  totalMoneyMoved: number; // sum of absolute values
  currentBalance: number;
  winSessions: number;
  lossSessions: number;
  bestSession: number;
  worstSession: number;
  balanceHistory: { sessionNumber: number; balance: number; date: string }[];
}

function calculatePlayerStats(
  playerId: string,
  playerName: string,
  sessions: GameSession[]
): PlayerStats {
  const playerSessions = sessions
    .filter(s => s.completed && s.players.some(p => p.playerId === playerId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativeBalance = 0;
  const balanceHistory: { sessionNumber: number; balance: number; date: string }[] = [];
  let totalTimePlayed = 0;
  let totalMoneyMoved = 0;
  let winSessions = 0;
  let lossSessions = 0;
  let bestSession = 0;
  let worstSession = 0;

  playerSessions.forEach((session, index) => {
    const sessionPlayer = session.players.find(p => p.playerId === playerId);
    if (!sessionPlayer) return;

    const correction = calculatePlayerCorrection(playerId, session.borrowTransactions || []);
    const chipDiff = (sessionPlayer.finalChips - sessionPlayer.startingChips) - correction;
    const moneyDiff = chipDiff * session.conversionRate;

    cumulativeBalance += moneyDiff;
    balanceHistory.push({
      sessionNumber: index + 1,
      balance: cumulativeBalance,
      date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });

    totalMoneyMoved += Math.abs(moneyDiff);

    if (moneyDiff > 0) winSessions++;
    if (moneyDiff < 0) lossSessions++;

    if (moneyDiff > bestSession) bestSession = moneyDiff;
    if (moneyDiff < worstSession) worstSession = moneyDiff;

    // Calculate time played
    if (session.endTime) {
      const start = new Date(session.date);
      const end = new Date(session.endTime);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      totalTimePlayed += durationMinutes;
    }
  });

  return {
    playerId,
    playerName,
    totalSessions: playerSessions.length,
    totalTimePlayed,
    totalMoneyMoved,
    currentBalance: cumulativeBalance,
    winSessions,
    lossSessions,
    bestSession,
    worstSession,
    balanceHistory
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function Statistics({ sessions, players }: Props) {
  const completedSessions = sessions.filter(s => s.completed);

  if (completedSessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
          <span className="text-3xl">📈</span>
          Statistics
        </h2>
        <div className="bg-background-lightest rounded-lg p-12 text-center border border-poker-800/30">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No Statistics Yet</h3>
          <p className="text-foreground-muted">Complete some sessions to see player statistics!</p>
        </div>
      </div>
    );
  }

  // Calculate stats for all players who have played at least one session
  const playersWithSessions = players.filter(p =>
    completedSessions.some(s => s.players.some(sp => sp.playerId === p.id))
  );

  const playerStats = playersWithSessions.map(player =>
    calculatePlayerStats(player.id, player.name, completedSessions)
  );

  // Sort by total sessions played (most active first)
  playerStats.sort((a, b) => b.totalSessions - a.totalSessions);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">📈</span>
        Statistics
      </h2>

      <div className="space-y-8">
        {playerStats.map(stats => (
          <div
            key={stats.playerId}
            className="bg-background-lightest rounded-lg border border-poker-800/30 overflow-hidden"
          >
            {/* Player Header */}
            <div className="bg-background/50 p-6 border-b border-poker-800/30">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                  stats.currentBalance > 0
                    ? 'bg-gradient-to-br from-poker-600 to-poker-800'
                    : stats.currentBalance < 0
                    ? 'bg-gradient-to-br from-red-600 to-red-800'
                    : 'bg-gradient-to-br from-gray-600 to-gray-800'
                }`}>
                  {stats.playerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground">{stats.playerName}</h3>
                  <div className={`text-lg font-semibold ${
                    stats.currentBalance > 0
                      ? 'text-poker-400'
                      : stats.currentBalance < 0
                      ? 'text-red-400'
                      : 'text-foreground-muted'
                  }`}>
                    Current Balance: {stats.currentBalance >= 0 ? '+' : ''}${stats.currentBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-poker-800/30">
              <div className="bg-background/50 rounded-lg p-4 border border-background-lightest">
                <div className="text-sm text-foreground-muted mb-1">Sessions Played</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                <div className="text-xs text-foreground-muted mt-1">
                  {stats.winSessions}W / {stats.lossSessions}L
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-background-lightest">
                <div className="text-sm text-foreground-muted mb-1">Total Time</div>
                <div className="text-2xl font-bold text-foreground">{formatDuration(stats.totalTimePlayed)}</div>
                <div className="text-xs text-foreground-muted mt-1">
                  {stats.totalSessions > 0 ? formatDuration(stats.totalTimePlayed / stats.totalSessions) : '0m'} avg
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-background-lightest">
                <div className="text-sm text-foreground-muted mb-1">Total Moved</div>
                <div className="text-2xl font-bold text-poker-400">${stats.totalMoneyMoved.toFixed(2)}</div>
                <div className="text-xs text-foreground-muted mt-1">
                  All wins + losses
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-background-lightest">
                <div className="text-sm text-foreground-muted mb-1">Best / Worst</div>
                <div className="text-sm font-bold">
                  <span className="text-poker-400">+${stats.bestSession.toFixed(2)}</span>
                  <span className="text-foreground-muted mx-1">/</span>
                  <span className="text-red-400">${stats.worstSession.toFixed(2)}</span>
                </div>
                <div className="text-xs text-foreground-muted mt-1">
                  Single session
                </div>
              </div>
            </div>

            {/* Balance Chart */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Balance History</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.balanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                    labelFormatter={(label) => `Session: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke={stats.currentBalance >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={{ fill: stats.currentBalance >= 0 ? '#10b981' : '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
