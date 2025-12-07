import { useState, useEffect } from 'react';
import { Chip } from '../types';
import { Settings as SettingsType } from '../utils/storage';

interface Props {
  settings: SettingsType;
  onUpdateSettings: (settings: Partial<SettingsType>) => void;
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
function handleNumberInput(value: string, min: number = 1): number {
  // Allow empty to be treated as 0 temporarily
  if (value === '') return 0;
  const num = parseFloat(value);
  // Only allow valid positive numbers
  if (isNaN(num) || num < 0) return min;
  return num;
}

function enforceMinimum(value: number, min: number = 1): number {
  return value < min ? min : value;
}

export function Settings({ settings, onUpdateSettings }: Props) {
  const [chips, setChips] = useState<Chip[]>(settings.chips || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with settings prop
  useEffect(() => {
    if (settings.chips && !hasChanges) {
      setChips(settings.chips);
    }
  }, [settings.chips, hasChanges]);

  const handleAddChip = () => {
    const defaultValue = (chips.length + 1) * 10;
    const newChip: Chip = {
      id: `chip-${Date.now()}`,
      label: `${defaultValue}`,
      color: '#FFFFFF',
      value: defaultValue,
      count: 20
    };
    setChips([...chips, newChip]);
    setHasChanges(true);
  };

  const handleDeleteChip = (chipId: string) => {
    if (chips.length <= 1) {
      alert('You must have at least one chip type');
      return;
    }
    setChips(chips.filter(c => c.id !== chipId));
    setHasChanges(true);
  };

  const handleUpdateChip = (chipId: string, updates: Partial<Chip>) => {
    setChips(chips.map(c => {
      if (c.id === chipId) {
        const updated = { ...c, ...updates };
        // Auto-update label when value changes
        if (updates.value !== undefined) {
          updated.label = `${updates.value}`;
        }
        return updated;
      }
      return c;
    }));
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newChips = [...chips];
    [newChips[index - 1], newChips[index]] = [newChips[index], newChips[index - 1]];
    setChips(newChips);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === chips.length - 1) return;
    const newChips = [...chips];
    [newChips[index], newChips[index + 1]] = [newChips[index + 1], newChips[index]];
    setChips(newChips);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateSettings({ chips });
    setHasChanges(false);
  };

  const handleReset = () => {
    setChips(settings.chips);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">⚙️</span>
        Settings
      </h2>

      {/* Chip Configuration Section */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Chip Configuration</h3>
            <p className="text-sm text-foreground-muted mt-1">
              Configure your chip types. These settings will apply to all new sessions.
            </p>
          </div>
          <button
            onClick={handleAddChip}
            className="px-4 py-2 rounded-lg font-medium bg-poker-500 hover:bg-poker-600 text-white shadow-glow-sm hover:shadow-glow transition-all"
          >
            + Add Chip
          </button>
        </div>

        {/* Chip List */}
        <div className="space-y-3 mt-6">
          {chips.map((chip, index) => (
            <div
              key={chip.id}
              className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-background-lightest hover:border-poker-700/50 transition-all"
            >
              {/* Chip Visual */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: chip.color,
                  border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none',
                  color: getTextColor(chip.color)
                }}
              >
                {chip.value}
              </div>

              {/* Inputs */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Value</label>
                  <input
                    type="number"
                    value={chip.value || ''}
                    onChange={(e) => {
                      handleUpdateChip(chip.id, { value: handleNumberInput(e.target.value, 1) });
                    }}
                    onBlur={() => {
                      handleUpdateChip(chip.id, { value: enforceMinimum(chip.value, 1) });
                    }}
                    className="w-full bg-background border border-background-lightest rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500 focus:border-poker-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Count</label>
                  <input
                    type="number"
                    value={chip.count || ''}
                    onChange={(e) => {
                      handleUpdateChip(chip.id, { count: handleNumberInput(e.target.value, 1) });
                    }}
                    onBlur={() => {
                      handleUpdateChip(chip.id, { count: enforceMinimum(chip.count, 1) });
                    }}
                    className="w-full bg-background border border-background-lightest rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500 focus:border-poker-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Color</label>
                  <div className="relative w-full h-[42px] rounded-lg overflow-hidden">
                    <input
                      type="color"
                      value={chip.color}
                      onChange={(e) => handleUpdateChip(chip.id, { color: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      style={{ padding: 0, border: 'none', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    index === 0
                      ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                      : 'bg-background-lightest text-foreground hover:bg-poker-500/20 hover:text-poker-400 border border-poker-700/50'
                  }`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === chips.length - 1}
                  title="Move down"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    index === chips.length - 1
                      ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                      : 'bg-background-lightest text-foreground hover:bg-poker-500/20 hover:text-poker-400 border border-poker-700/50'
                  }`}
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDeleteChip(chip.id)}
                  disabled={chips.length <= 1}
                  title="Delete"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all text-lg ${
                    chips.length <= 1
                      ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                      : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-700/50'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save/Cancel Buttons */}
        {hasChanges && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-background-lightest">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 rounded-lg font-semibold bg-poker-500 hover:bg-poker-600 text-white shadow-glow-sm hover:shadow-glow transition-all"
            >
              Save Chip Configuration
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg font-medium bg-background-lightest hover:bg-background text-foreground border border-background-lightest transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Default Session Settings Section */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Default Session Settings</h3>
        <div>
          <label className="text-sm text-foreground-muted mb-2 block">
            Default conversion rate (1 chip = $)
          </label>
          <input
            type="number"
            value={settings.defaultConversionRate || ''}
            onChange={(e) => {
              const val = handleNumberInput(e.target.value, 0.01);
              onUpdateSettings({ defaultConversionRate: val });
            }}
            onBlur={() => {
              onUpdateSettings({ defaultConversionRate: enforceMinimum(settings.defaultConversionRate, 0.01) });
            }}
            className="w-full sm:w-64 bg-background border border-background-lightest rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500 focus:border-poker-500"
            step="0.01"
            min="0.01"
          />
        </div>
      </div>
    </div>
  );
}
