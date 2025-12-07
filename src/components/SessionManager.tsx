import { useState, useEffect } from 'react';
import { Player, GameSession, Chip } from '../types';
import { ChipCounter } from './ChipCounter';

interface Props {
  players: Player[];
  currentSession: GameSession | null;
  defaultChips: Chip[];
  defaultConversionRate: number;
  onStartSession: (playerIds: string[], chips: Chip[], conversionRate: number) => void;
  onUpdateChips: (playerId: string, finalChips: number) => void;
  onUpdateChipCounts: (playerId: string, chipId: string, count: number) => void;
  onCompleteSession: (finalChipsOverride?: Record<string, number>) => void;
  onCancelSession: () => void;
}

function getTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

function shouldShowBorder(hexColor: string): boolean {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85;
}

// Shared number input handler
function handleNumberInput(value: string, min: number = 0): number {
  // Allow empty to be treated as 0 temporarily
  if (value === '') return 0;
  const num = parseFloat(value);
  // Only allow valid positive numbers
  if (isNaN(num) || num < 0) return min;
  return num;
}

function enforceMinimum(value: number, min: number = 0): number {
  return value < min ? min : value;
}

export function SessionManager({
  players,
  currentSession,
  defaultChips,
  defaultConversionRate,
  onStartSession,
  onUpdateChips,
  onUpdateChipCounts,
  onCompleteSession,
  onCancelSession
}: Props) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [sessionChips, setSessionChips] = useState<Chip[]>([...defaultChips]);
  const [conversionRate, setConversionRate] = useState(defaultConversionRate);
  const [inputMode, setInputMode] = useState<Record<string, 'counter' | 'total'>>({});
  const [quickTotalValues, setQuickTotalValues] = useState<Record<string, number>>({});

  useEffect(() => {
    setSessionChips([...defaultChips]);
  }, [defaultChips]);

  useEffect(() => {
    if (selectedPlayerIds.length > 0) {
      setSessionChips(prevChips => prevChips.map(chip => {
        const defaultChip = defaultChips.find(dc => dc.id === chip.id);
        return {
          ...chip,
          count: Math.floor((defaultChip?.count || 0) / selectedPlayerIds.length)
        };
      }));
    } else {
      setSessionChips([...defaultChips]);
    }
  }, [selectedPlayerIds.length, defaultChips]);

  // Initialize quickTotalValues for all players in the current session
  useEffect(() => {
    if (currentSession) {
      setQuickTotalValues(prev => {
        const updated = { ...prev };
        currentSession.players.forEach(sp => {
          if (updated[sp.playerId] === undefined) {
            updated[sp.playerId] = sp.startingChips;
          }
        });
        return updated;
      });
    }
  }, [currentSession?.id]); // Only run when session changes

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleChipCountChange = (chipId: string, count: number) => {
    setSessionChips(sessionChips.map(chip =>
      chip.id === chipId ? { ...chip, count } : chip
    ));
  };

  const calculateStartingChipsPerPlayer = () => {
    if (selectedPlayerIds.length === 0) return 0;
    const totalChips = sessionChips.reduce((sum, chip) => sum + (chip.value * chip.count), 0);
    return Math.floor(totalChips / selectedPlayerIds.length);
  };

  const handleStartSession = () => {
    if (selectedPlayerIds.length < 2) {
      alert('Please select at least 2 players');
      return;
    }
    onStartSession(selectedPlayerIds, sessionChips, conversionRate);
  };

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const startingChipsPerPlayer = calculateStartingChipsPerPlayer();

  // ACTIVE SESSION VIEW
  if (currentSession) {
    return (
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
          <h2 className="text-2xl font-bold text-poker-400 mb-4 flex items-center gap-2">
            <span className="text-3xl">🎰</span>
            Active Session
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div className="bg-background/50 rounded p-3">
              <div className="text-foreground-muted text-xs mb-1">Starting Chips (per player)</div>
              <div className="text-2xl font-bold text-foreground">{currentSession.startingChips}</div>
            </div>
            <div className="bg-background/50 rounded p-3">
              <div className="text-foreground-muted text-xs mb-1">Total Chips</div>
              <div className="text-2xl font-bold text-foreground">
                {currentSession.startingChips * currentSession.players.length}
              </div>
            </div>
            <div className="bg-background/50 rounded p-3">
              <div className="text-foreground-muted text-xs mb-1">Conversion Rate</div>
              <div className="text-2xl font-bold text-poker-400">
                ${currentSession.conversionRate.toFixed(2)}
              </div>
            </div>
            <div className="bg-background/50 rounded p-3">
              <div className="text-foreground-muted text-xs mb-1">Total Value</div>
              <div className="text-2xl font-bold text-poker-400">
                ${(currentSession.startingChips * currentSession.players.length * currentSession.conversionRate).toFixed(2)}
              </div>
            </div>
            <div className="bg-background/50 rounded p-3">
              <div className="text-foreground-muted text-xs mb-1">Started</div>
              <div className="text-lg font-medium text-foreground">
                {new Date(currentSession.date).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span>👥</span>
            Player Chips
          </h3>

          {currentSession.players.map(sp => {
            const currentMode = inputMode[sp.playerId] || 'counter';

            // Calculate current total based on active tab ONLY
            let currentTotal = sp.startingChips;
            if (currentMode === 'counter' && sp.chipCounts && currentSession.chips) {
              // Chip Counter mode: calculate from chip counts
              currentTotal = Object.entries(sp.chipCounts).reduce((sum, [chipId, count]) => {
                const chip = currentSession.chips!.find(c => c.id === chipId);
                return sum + (chip ? count * chip.value : 0);
              }, 0);
            } else {
              // Quick Total mode: use local quickTotalValues
              currentTotal = quickTotalValues[sp.playerId] ?? sp.startingChips;
            }

            const chipDiff = currentTotal - sp.startingChips;
            const moneyDiff = chipDiff * currentSession.conversionRate;

            return (
              <div
                key={sp.playerId}
                className="bg-background-lightest rounded-lg p-5 border border-background-lightest hover:border-poker-700/50 transition-all"
              >
                {/* Player Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-poker-600 to-poker-800 flex items-center justify-center text-white font-bold">
                      {getPlayerName(sp.playerId).charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-lg text-foreground">
                      {getPlayerName(sp.playerId)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${chipDiff >= 0 ? 'text-poker-400' : 'text-red-400'}`}>
                      {chipDiff >= 0 ? '+' : '−'}{Math.abs(chipDiff)}
                    </div>
                    <div className={`text-lg font-medium ${moneyDiff >= 0 ? 'text-poker-400' : 'text-red-400'}`}>
                      {moneyDiff >= 0 ? '+' : '−'} ${Math.abs(moneyDiff).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Input Mode Toggle */}
                {currentSession.chips && sp.chipCounts && (
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => setInputMode(prev => ({ ...prev, [sp.playerId]: 'counter' }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        (inputMode[sp.playerId] || 'counter') === 'counter'
                          ? 'bg-poker-500 text-white shadow-glow-sm'
                          : 'bg-background text-foreground-muted hover:bg-background-lightest border border-background-lightest'
                      }`}
                    >
                      Chip Counter
                    </button>
                    <button
                      onClick={() => setInputMode(prev => ({ ...prev, [sp.playerId]: 'total' }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMode[sp.playerId] === 'total'
                          ? 'bg-poker-500 text-white shadow-glow-sm'
                          : 'bg-background text-foreground-muted hover:bg-background-lightest border border-background-lightest'
                      }`}
                    >
                      Quick Total
                    </button>
                  </div>
                )}

                {/* Chip Counter or Manual Input */}
                {currentSession.chips && sp.chipCounts ? (
                  (inputMode[sp.playerId] || 'counter') === 'counter' ? (
                    <ChipCounter
                      chipCounts={sp.chipCounts}
                      chips={currentSession.chips}
                      onChipCountChange={(chipId, count) => onUpdateChipCounts(sp.playerId, chipId, count)}
                      totalValue={currentTotal}
                      startingChips={sp.startingChips}
                    />
                  ) : (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground-muted mb-2">
                        Total chips:
                      </label>
                      <input
                        type="number"
                        value={(quickTotalValues[sp.playerId] ?? sp.startingChips) || ''}
                        onChange={(e) => {
                          const total = handleNumberInput(e.target.value, 0);
                          setQuickTotalValues(prev => ({ ...prev, [sp.playerId]: total }));
                        }}
                        onBlur={() => {
                          const currentValue = quickTotalValues[sp.playerId];
                          if (currentValue === undefined || currentValue === 0) {
                            setQuickTotalValues(prev => ({ ...prev, [sp.playerId]: sp.startingChips }));
                          } else {
                            setQuickTotalValues(prev => ({ ...prev, [sp.playerId]: enforceMinimum(currentValue, 0) }));
                          }
                        }}
                        className="w-full bg-background border border-background-lightest rounded-lg px-4 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-poker-500 focus:border-poker-500"
                        min="0"
                        placeholder={`Default: ${sp.startingChips} chips`}
                      />
                    </div>
                  )
                ) : (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Final chips:
                    </label>
                    <input
                      type="number"
                      value={sp.finalChips}
                      onChange={(e) => onUpdateChips(sp.playerId, Number(e.target.value))}
                      className="w-full bg-background border border-background-lightest rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500"
                      min="0"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => {
              // Build finalChips map based on active tab for each player
              const finalChipsMap: Record<string, number> = {};

              currentSession.players.forEach(sp => {
                const mode = inputMode[sp.playerId] || 'counter';

                if (mode === 'total') {
                  // Use Quick Total value
                  const quickTotal = quickTotalValues[sp.playerId] ?? sp.startingChips;
                  finalChipsMap[sp.playerId] = quickTotal;
                } else {
                  // Calculate total from chip counts
                  if (sp.chipCounts && currentSession.chips) {
                    const total = Object.entries(sp.chipCounts).reduce((sum, [chipId, count]) => {
                      const chip = currentSession.chips!.find(c => c.id === chipId);
                      return sum + (chip ? count * chip.value : 0);
                    }, 0);
                    finalChipsMap[sp.playerId] = total;
                  }
                }
              });

              // Pass finalChips directly to avoid state closure issues
              onCompleteSession(finalChipsMap);
            }}
            className="flex-1 bg-poker-500 hover:bg-poker-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-glow-sm hover:shadow-glow"
          >
            ✓ Complete Session
          </button>

          {/* Game Saldo */}
          <div className="px-4 py-3 bg-background-lightest rounded-lg border border-background-lightest flex items-center gap-3">
            <span className="text-sm text-foreground-muted">Game Saldo:</span>
            <span className="text-lg font-bold text-foreground">
              ${(() => {
                const totalSaldo = currentSession.players.reduce((sum, sp) => {
                  const currentMode = inputMode[sp.playerId] || 'counter';
                  let currentTotal = sp.startingChips;

                  if (currentMode === 'counter' && sp.chipCounts && currentSession.chips) {
                    currentTotal = Object.entries(sp.chipCounts).reduce((chipSum, [chipId, count]) => {
                      const chip = currentSession.chips!.find(c => c.id === chipId);
                      return chipSum + (chip ? count * chip.value : 0);
                    }, 0);
                  } else {
                    currentTotal = quickTotalValues[sp.playerId] ?? sp.startingChips;
                  }

                  const chipDiff = currentTotal - sp.startingChips;
                  const moneyDiff = chipDiff * currentSession.conversionRate;
                  return sum + moneyDiff;
                }, 0);
                // Handle negative zero
                return Math.abs(totalSaldo) < 0.001 ? '0.00' : totalSaldo.toFixed(2);
              })()}
            </span>
          </div>

          <button
            onClick={onCancelSession}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 px-6 rounded-lg border border-red-700/50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // NEW SESSION VIEW
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">🎲</span>
        Start New Session
      </h2>

      {/* Player Selection */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <label className="block text-lg font-semibold text-foreground mb-4">
          Select Players <span className="text-foreground-muted text-sm font-normal">(minimum 2)</span>
        </label>

        {players.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <div className="text-4xl mb-2">👥</div>
            <p>No players yet. Add players in the Players tab first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => handlePlayerToggle(player.id)}
                className={`
                  flex items-center justify-center gap-2 p-4 rounded-lg font-medium transition-all duration-200
                  ${selectedPlayerIds.includes(player.id)
                    ? 'bg-poker-500 text-white shadow-glow border-2 border-poker-400'
                    : 'bg-background text-foreground border-2 border-background-lightest hover:border-poker-600 hover:bg-background/80'
                  }
                `}
              >
                {selectedPlayerIds.includes(player.id) && <span className="text-lg">✓</span>}
                <span>{player.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversion Rate */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <label className="block text-lg font-semibold text-foreground mb-4">
          Conversion Rate
        </label>
        <div className="flex items-center gap-3">
          <span className="text-foreground-muted">1 chip =</span>
          <span className="text-2xl text-poker-400">$</span>
          <input
            type="number"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="w-32 bg-background border border-background-lightest rounded-lg px-4 py-2 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-poker-500"
            step="0.01"
            min="0.01"
          />
        </div>
      </div>

      {/* Chip Configuration */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <h3 className="text-lg font-semibold text-foreground mb-2">Chip Configuration</h3>

        {/* Summary */}
        <div className="bg-background/50 rounded-lg p-4 mb-4 flex items-center justify-between">
          {selectedPlayerIds.length > 0 ? (
            <>
              <div className="text-foreground-muted">
                Per player: <span className="text-poker-400 font-bold text-xl ml-2">
                  {sessionChips.reduce((sum, c) => sum + c.value * c.count, 0)}
                </span>
              </div>
              <div className="text-foreground-muted">
                Total (all players): <span className="text-foreground font-bold text-xl ml-2">
                  {sessionChips.reduce((sum, c) => sum + c.value * c.count, 0) * selectedPlayerIds.length}
                </span>
              </div>
            </>
          ) : (
            <div className="text-foreground-muted">
              Total chip value: <span className="text-foreground font-bold text-xl ml-2">
                {sessionChips.reduce((sum, c) => sum + c.value * c.count, 0)}
              </span>
            </div>
          )}
        </div>

        {/* Chip List */}
        <div className="space-y-3">
          {sessionChips.map((chip) => (
            <div
              key={chip.id}
              className="flex items-center gap-4 bg-background/50 rounded-lg p-4 hover:bg-background/70 transition-all"
            >
              {/* Chip Visual */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: chip.color,
                  color: getTextColor(chip.color),
                  border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none'
                }}
              >
                {chip.value}
              </div>

              {/* Chip Info */}
              <div className="flex-1">
                <div className="text-foreground font-medium mb-1">
                  Value: {chip.value}
                </div>
                <div className="text-foreground-muted text-sm">
                  {selectedPlayerIds.length > 0 ? 'Per player' : 'Total'}
                </div>
              </div>

              {/* Count Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChipCountChange(chip.id, Math.max(0, chip.count - 1))}
                  className="w-8 h-8 rounded bg-background-lightest hover:bg-poker-900/30 text-foreground font-bold transition-all"
                >
                  −
                </button>
                <input
                  type="number"
                  value={chip.count}
                  onChange={(e) => handleChipCountChange(chip.id, Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-background border border-background-lightest rounded px-3 py-2 text-center text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-poker-500"
                  min="0"
                />
                <button
                  onClick={() => handleChipCountChange(chip.id, chip.count + 1)}
                  className="w-8 h-8 rounded bg-background-lightest hover:bg-poker-900/30 text-foreground font-bold transition-all"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartSession}
        disabled={selectedPlayerIds.length < 2}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200
          ${selectedPlayerIds.length < 2
            ? 'bg-background-lightest text-foreground-muted cursor-not-allowed'
            : 'bg-poker-500 hover:bg-poker-600 text-white shadow-glow-sm hover:shadow-glow'
          }
        `}
      >
        {selectedPlayerIds.length < 2
          ? 'Select at least 2 players to start'
          : `Start Session with ${selectedPlayerIds.length} players`
        }
      </button>
    </div>
  );
}
