import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { PlayerManagement } from './components/PlayerManagement';
import { SessionManager } from './components/SessionManager';
import { BalanceView } from './components/BalanceView';
import { SessionHistory } from './components/SessionHistory';
import { Settings } from './components/Settings';
import './App.css';

type Tab = 'session' | 'balances' | 'history' | 'players' | 'settings';

function App() {
  const {
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
    completeSession,
    cancelSession,
    deleteSession,
    updateSettings
  } = useAppState();

  const [activeTab, setActiveTab] = useState<Tab>('session');

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <h1>Loading...</h1>
          <p>Initializing local database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Poker Split-Wise</h1>
        <p className="subtitle">Track poker games and settle balances</p>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          {currentSession ? 'Active Session' : 'New Session'}
        </button>
        <button
          className={`tab ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          Players
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'session' && (
          <SessionManager
            players={players}
            currentSession={currentSession}
            defaultChips={settings.chips}
            defaultConversionRate={settings.defaultConversionRate}
            onStartSession={startNewSession}
            onUpdateChips={updateSessionPlayerChips}
            onUpdateChipCounts={updateSessionPlayerChipCounts}
            onCompleteSession={completeSession}
            onCancelSession={cancelSession}
          />
        )}

        {activeTab === 'balances' && (
          <BalanceView players={players} />
        )}

        {activeTab === 'history' && (
          <SessionHistory
            sessions={sessions}
            players={players}
            onDeleteSession={deleteSession}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManagement
            players={players}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Total players: {players.length} |
          Completed sessions: {sessions.length}
        </p>
      </footer>
    </div>
  );
}

export default App;
