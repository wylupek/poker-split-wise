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
      color: '#FF5722',
      value: defaultValue,
      count: 50
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
    <div className="settings">
      <h2>Settings</h2>

      <div className="settings-section">
        <div className="section-header">
          <h3>Chip Configuration</h3>
          <button onClick={handleAddChip} className="btn btn-primary btn-sm">
            + Add Chip
          </button>
        </div>
        <p className="settings-description">
          Configure your chip types. These settings will apply to all new sessions.
          Existing sessions will keep their original chip configurations.
        </p>

        <div className="chip-list">
          {chips.map((chip, index) => (
            <div key={chip.id} className="chip-config-item">
              <div className="chip-visual">
                <div
                  className="chip-circle-large"
                  style={{
                    backgroundColor: chip.color,
                    border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none'
                  }}
                >
                  <div className="chip-value-large" style={{ color: getTextColor(chip.color) }}>
                    {chip.value}
                  </div>
                </div>
              </div>

              <div className="chip-config-inputs">
                <div className="input-row">
                  <div className="form-field">
                    <label>Value:</label>
                    <input
                      type="number"
                      value={chip.value}
                      onChange={(e) => handleUpdateChip(chip.id, { value: Math.max(1, Number(e.target.value)) })}
                      className="input input-sm"
                      min="1"
                    />
                  </div>

                  <div className="form-field">
                    <label>Count:</label>
                    <input
                      type="number"
                      value={chip.count}
                      onChange={(e) => handleUpdateChip(chip.id, { count: Math.max(1, Number(e.target.value)) })}
                      className="input input-sm"
                      min="1"
                    />
                  </div>

                  <div className="form-field">
                    <label>Color:</label>
                    <input
                      type="color"
                      value={chip.color}
                      onChange={(e) => handleUpdateChip(chip.id, { color: e.target.value })}
                      className="color-input"
                    />
                  </div>
                </div>
              </div>

              <div className="chip-config-actions">
                <button
                  onClick={() => handleMoveUp(index)}
                  className="btn btn-secondary btn-icon"
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  className="btn btn-secondary btn-icon"
                  disabled={index === chips.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDeleteChip(chip.id)}
                  className="btn btn-danger btn-icon"
                  disabled={chips.length <= 1}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="settings-actions">
            <button onClick={handleSave} className="btn btn-success">
              Save Chip Configuration
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Cancel Changes
            </button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Default Session Settings</h3>
        <div className="form-group">
          <label>
            Default conversion rate (1 chip = $):
            <input
              type="number"
              value={settings.defaultConversionRate}
              onChange={(e) => onUpdateSettings({ defaultConversionRate: Number(e.target.value) })}
              className="input"
              step="0.01"
              min="0.01"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
