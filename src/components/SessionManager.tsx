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
  onCompleteSession: () => void;
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

  // Sync with defaults when they change
  useEffect(() => {
    setSessionChips([...defaultChips]);
  }, [defaultChips]);

  // Auto-adjust chip counts when player selection changes
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

  if (currentSession) {
    return (
      <div className="session-manager active-session">
        <h2>Active Session</h2>
        <div className="session-info">
          <p>Starting chips: {currentSession.startingChips}</p>
          <p>Conversion rate: 1 chip = ${currentSession.conversionRate.toFixed(2)}</p>
          <p>Date: {new Date(currentSession.date).toLocaleString()}</p>
        </div>

        <div className="session-players">
          <h3>Player Chips</h3>
          {currentSession.players.map(sp => {
            const chipDiff = sp.finalChips - sp.startingChips;
            const moneyDiff = chipDiff * currentSession.conversionRate;

            return (
              <div key={sp.playerId} className="session-player-card">
                <div className="player-header">
                  <strong>{getPlayerName(sp.playerId)}</strong>
                  <div className={`chip-diff ${chipDiff >= 0 ? 'positive' : 'negative'}`}>
                    {chipDiff >= 0 ? '+' : ''}{chipDiff} chips
                    ({moneyDiff >= 0 ? '+' : ''}${moneyDiff.toFixed(2)})
                  </div>
                </div>

                {currentSession.chips && sp.chipCounts ? (
                  <ChipCounter
                    chipCounts={sp.chipCounts}
                    chips={currentSession.chips}
                    onChipCountChange={(chipId, count) => onUpdateChipCounts(sp.playerId, chipId, count)}
                    totalValue={sp.finalChips}
                  />
                ) : (
                  <div className="manual-chip-input">
                    <label>
                      Final chips:
                      <input
                        type="number"
                        value={sp.finalChips}
                        onChange={(e) => onUpdateChips(sp.playerId, Number(e.target.value))}
                        className="input input-sm"
                        min="0"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="session-actions">
          <button onClick={onCompleteSession} className="btn btn-success">
            Complete Session
          </button>
          <button onClick={onCancelSession} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-manager">
      <h2>Start New Session</h2>

      <div className="session-setup">
        <div className="form-group">
          <label>Select players (at least 2):</label>
          <div className="player-selection">
            {players.map(player => (
              <label key={player.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPlayerIds.includes(player.id)}
                  onChange={() => handlePlayerToggle(player.id)}
                />
                {player.name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>
            Conversion rate (1 chip = $ ?):
            <input
              type="number"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="input"
              step="0.01"
              min="0.01"
            />
          </label>
        </div>

        <div className="chip-setup-section">
          <h3>Chip Configuration for This Session</h3>
          <p className="info-text">
            Total chips: {sessionChips.reduce((sum, c) => sum + c.value * c.count, 0)} value
            {selectedPlayerIds.length > 0 && (
              <> | Starting chips per player: <strong>{startingChipsPerPlayer}</strong></>
            )}
          </p>

          <div className="chip-setup-list">
            {sessionChips.map((chip) => (
              <div key={chip.id} className="chip-setup-item">
                <div
                  className="chip-circle-medium"
                  style={{
                    backgroundColor: chip.color,
                    border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none'
                  }}
                >
                  <div className="chip-value-medium" style={{ color: getTextColor(chip.color) }}>
                    {chip.value}
                  </div>
                </div>

                <div className="chip-setup-info">
                  <div className="chip-setup-row">
                    <div className="chip-count-input">
                      <label>{selectedPlayerIds.length > 0 ? 'Count per player:' : 'Total count:'}</label>
                      <input
                        type="number"
                        value={chip.count}
                        onChange={(e) => handleChipCountChange(chip.id, Math.max(0, Number(e.target.value)))}
                        className="input input-sm"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartSession}
          className="btn btn-primary"
          disabled={selectedPlayerIds.length < 2}
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
