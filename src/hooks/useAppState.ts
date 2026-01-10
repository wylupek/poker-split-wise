import { useState, useEffect } from 'react';
import { Player, GameSession, ChipCounts, Chip, BorrowTransaction } from '../types';
import {
  loadPlayers,
  savePlayer,
  updatePlayer,
  deletePlayer,
  loadSessions,
  saveSession,
  deleteSession,
  loadSettings,
  saveSettings,
  Settings
} from '../utils/storage';
import { calculateSessionResults } from '../utils/settlement';
import { generateUUID } from '../utils/uuid';

export function useAppState() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [settings, setSettings] = useState<Settings>({
    defaultConversionRate: 0.01,
    chips: []
  });
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedPlayers, loadedSessions, loadedSettings] = await Promise.all([
          loadPlayers(),
          loadSessions(),
          loadSettings()
        ]);
        setPlayers(loadedPlayers);
        setSessions(loadedSessions);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Player management
  const addPlayer = async (name: string) => {
    const newPlayer = await savePlayer({ name, balance: 0 });
    if (newPlayer) {
      setPlayers([...players, newPlayer]);
    }
  };

  const removePlayer = async (playerId: string) => {
    const success = await deletePlayer(playerId);
    if (success) {
      setPlayers(players.filter(p => p.id !== playerId));
    }
  };


  // Session management
  const startNewSession = (playerIds: string[], chips: Chip[], conversionRate: number) => {
    // Chips array now contains per-player counts, so calculate starting chips directly
    const startingChipsPerPlayer = chips.reduce((sum, chip) => sum + (chip.value * chip.count), 0);

    // Initialize chip counts per player (chips array already has per-player counts)
    const initialChipCounts: ChipCounts = {};
    chips.forEach(chip => {
      initialChipCounts[chip.id] = chip.count;
    });

    const newSession: GameSession = {
      id: generateUUID(),
      date: new Date().toISOString(),
      conversionRate,
      startingChips: startingChipsPerPlayer,
      players: playerIds.map(id => ({
        playerId: id,
        startingChips: startingChipsPerPlayer,
        finalChips: startingChipsPerPlayer,
        chipCounts: { ...initialChipCounts }
      })),
      completed: false,
      chips: [...chips] // Store chip configuration for this session
    };
    setCurrentSession(newSession);
  };

  const updateSessionPlayerChips = (playerId: string, finalChips: number) => {
    if (!currentSession) return;

    setCurrentSession(prev => {
      if (!prev) return prev;

      const updatedPlayers = prev.players.map(p =>
        p.playerId === playerId ? { ...p, finalChips } : p
      );

      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  const updateSessionPlayerChipCounts = (playerId: string, chipId: string, count: number) => {
    if (!currentSession || !currentSession.chips) return;

    setCurrentSession(prev => {
      if (!prev || !prev.chips) return prev;

      const updatedPlayers = prev.players.map(p => {
        if (p.playerId === playerId && p.chipCounts) {
          const newChipCounts = { ...p.chipCounts, [chipId]: count };
          // Calculate total chips based on chip counts and chip values
          const totalChips = Object.entries(newChipCounts).reduce((sum, [id, chipCount]) => {
            const chip = prev.chips!.find(c => c.id === id);
            return sum + (chip ? chipCount * chip.value : 0);
          }, 0);

          return { ...p, chipCounts: newChipCounts, finalChips: totalChips };
        }
        return p;
      });

      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  const updateSessionTransactions = (transactions: BorrowTransaction[]) => {
    if (!currentSession) return;

    setCurrentSession(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        borrowTransactions: transactions
      };
    });
  };

  const updateSettingsState = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  const completeSession = async (finalChipsOverride?: Record<string, number>) => {
    if (!currentSession) return;

    // If finalChipsOverride is provided, use those values instead of currentSession
    let sessionToComplete = currentSession;
    if (finalChipsOverride) {
      sessionToComplete = {
        ...currentSession,
        players: currentSession.players.map(p => ({
          ...p,
          finalChips: finalChipsOverride[p.playerId] ?? p.finalChips
        }))
      };
    }

    // Calculate session results (including borrow transaction corrections)
    const results = calculateSessionResults(
      sessionToComplete.startingChips,
      sessionToComplete.conversionRate,
      sessionToComplete.players,
      sessionToComplete.borrowTransactions || []
    );

    // Update player balances
    const updatedPlayers = await Promise.all(
      players.map(async (player) => {
        const sessionResult = results.get(player.id);
        if (sessionResult !== undefined) {
          const newPlayer = {
            ...player,
            balance: player.balance + sessionResult
          };
          await updatePlayer(newPlayer);
          return newPlayer;
        }
        return player;
      })
    );

    setPlayers(updatedPlayers);

    // Mark session as completed and save (use sessionToComplete to preserve finalChips overrides)
    const completedSession = {
      ...sessionToComplete,
      completed: true,
      endTime: new Date().toISOString()
    };
    await saveSession(completedSession);
    setSessions([completedSession, ...sessions]);
    setCurrentSession(null);
  };

  const cancelSession = () => {
    setCurrentSession(null);
  };

  const deleteSessionById = async (sessionId: string) => {
    // Find the session to delete
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    // Reverse the balance changes (including borrow transaction corrections)
    const results = calculateSessionResults(
      sessionToDelete.startingChips,
      sessionToDelete.conversionRate,
      sessionToDelete.players,
      sessionToDelete.borrowTransactions || []
    );

    const updatedPlayers = await Promise.all(
      players.map(async (player) => {
        const sessionResult = results.get(player.id);
        if (sessionResult !== undefined) {
          const newPlayer = {
            ...player,
            balance: player.balance - sessionResult // Subtract to reverse
          };
          await updatePlayer(newPlayer);
          return newPlayer;
        }
        return player;
      })
    );

    setPlayers(updatedPlayers);

    await deleteSession(sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  return {
    players,
    sessions,
    currentSession,
    settings,
    loading,
    addPlayer,
    removePlayer,
    startNewSession,
    updateSessionPlayerChips,
    updateSessionPlayerChipCounts,
    updateSessionTransactions,
    completeSession,
    cancelSession,
    deleteSession: deleteSessionById,
    updateSettings: updateSettingsState
  };
}
