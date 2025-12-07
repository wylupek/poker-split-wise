import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { PlayerManagement } from './components/PlayerManagement';
import { SessionManager } from './components/SessionManager';
import { BalanceView } from './components/BalanceView';
import { SessionHistory } from './components/SessionHistory';
import { Settings } from './components/Settings';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-poker-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
            <p className="text-foreground-muted">Initializing local database...</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'session' as Tab,
      label: currentSession ? 'Active Session' : 'New Session',
      icon: '🎰'
    },
    {
      id: 'balances' as Tab,
      label: 'Balances',
      icon: '💰'
    },
    {
      id: 'history' as Tab,
      label: 'History',
      icon: '📊'
    },
    {
      id: 'players' as Tab,
      label: 'Players',
      icon: '👥'
    },
    {
      id: 'settings' as Tab,
      label: 'Settings',
      icon: '⚙️'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-lighter border-b border-poker-800/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-poker-500 to-poker-700 rounded-lg flex items-center justify-center text-2xl shadow-glow-sm">
              ♠️
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-poker-400 to-poker-600 bg-clip-text text-transparent">
                Poker Split-Wise
              </h1>
              <p className="text-foreground-muted text-sm mt-1">
                Track poker games and settle balances
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-background-lighter border-b border-background-lightest overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-4 font-medium text-sm
                  transition-all duration-200 whitespace-nowrap
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'border-poker-500 text-poker-400 bg-background-lightest/50'
                    : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-background-lightest/30'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-background-lighter rounded-lg shadow-xl border border-background-lightest p-6 min-h-[600px]">
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
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background-lighter border-t border-background-lightest mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-poker-500 rounded-full animate-pulse"></span>
                <span>Total players: <span className="text-foreground font-medium">{players.length}</span></span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Completed sessions: <span className="text-foreground font-medium">{sessions.length}</span></span>
              </span>
            </div>
            <div className="text-xs text-foreground-muted/60">
              Local SQLite Database • All data stored securely
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
