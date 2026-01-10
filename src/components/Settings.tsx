import { useState, useEffect } from 'react';
import { Chip, ChipPreset } from '../types';
import { Settings as SettingsType } from '../utils/storage';
import { api } from '../utils/api';
import { getTextColor, shouldShowBorder } from '../utils/colors';
import { handleNumberInput, enforceMinimum } from '../utils/forms';

interface Props {
  settings: SettingsType;
  onUpdateSettings: (settings: Partial<SettingsType>) => void;
}

export function Settings({ settings, onUpdateSettings }: Props) {
  const [presets, setPresets] = useState<ChipPreset[]>([]);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingChips, setEditingChips] = useState<Chip[]>([]);
  const [editingName, setEditingName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await api.get<ChipPreset[]>('/presets');
      setPresets(response.data);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const startEditing = (preset: ChipPreset) => {
    setEditingPresetId(preset.id);
    setEditingChips([...preset.chips]);
    setEditingName(preset.name);
  };

  const cancelEditing = () => {
    setEditingPresetId(null);
    setEditingChips([]);
    setEditingName('');
  };

  const savePreset = async (presetId: string) => {
    try {
      const response = await api.put<ChipPreset>(`/presets/${presetId}`, {
        name: editingName,
        chips: editingChips
      });
      setPresets(presets.map(p => (p.id === presetId ? response.data : p)));
      setEditingPresetId(null);
    } catch (error) {
      console.error('Error updating preset:', error);
    }
  };

  const createPreset = async () => {
    if (!newPresetName.trim()) return;

    const defaultChips: Chip[] = [
      { id: `chip-${Date.now()}-1`, label: '5', color: '#FFFFFF', value: 5, count: 20 },
      { id: `chip-${Date.now()}-2`, label: '25', color: '#2E7D32', value: 25, count: 20 },
      { id: `chip-${Date.now()}-3`, label: '100', color: '#FBC02D', value: 100, count: 20 }
    ];

    try {
      const response = await api.post<ChipPreset>('/presets', {
        name: newPresetName.trim(),
        chips: defaultChips
      });
      setPresets([...presets, response.data]);
      setNewPresetName('');
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Error creating preset:', error);
    }
  };

  const deletePreset = async (presetId: string) => {
    try {
      await api.delete(`/presets/${presetId}`);
      setPresets(presets.filter(p => p.id !== presetId));
    } catch (error: any) {
      console.error('Error deleting preset:', error);
    }
  };

  const setDefaultPreset = async (presetId: string) => {
    try {
      await api.put(`/presets/${presetId}/set-default`);
      setPresets(presets.map(p => ({ ...p, isDefault: p.id === presetId })));
    } catch (error) {
      console.error('Error setting default preset:', error);
    }
  };

  const handleAddChip = () => {
    const defaultValue = (editingChips.length + 1) * 10;
    const newChip: Chip = {
      id: `chip-${Date.now()}`,
      label: `${defaultValue}`,
      color: '#FFFFFF',
      value: defaultValue,
      count: 20
    };
    setEditingChips([...editingChips, newChip]);
  };

  const handleDeleteChip = (chipId: string) => {
    if (editingChips.length <= 1) return;
    setEditingChips(editingChips.filter(c => c.id !== chipId));
  };

  const handleUpdateChip = (chipId: string, updates: Partial<Chip>) => {
    setEditingChips(
      editingChips.map(c => {
        if (c.id === chipId) {
          const updated = { ...c, ...updates };
          if (updates.value !== undefined) {
            updated.label = `${updates.value}`;
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newChips = [...editingChips];
    [newChips[index - 1], newChips[index]] = [newChips[index], newChips[index - 1]];
    setEditingChips(newChips);
  };

  const handleMoveDown = (index: number) => {
    if (index === editingChips.length - 1) return;
    const newChips = [...editingChips];
    [newChips[index], newChips[index + 1]] = [newChips[index + 1], newChips[index]];
    setEditingChips(newChips);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-poker-400 mb-6 flex items-center gap-2">
        <span className="text-3xl">⚙️</span>
        Settings
      </h2>

      {/* Chip Presets Management */}
      <div className="bg-background-lightest rounded-lg p-6 border border-poker-800/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Chip Presets</h3>
            <p className="text-sm text-foreground-muted mt-1">
              Manage your chip set configurations. Select a preset when starting a new session.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 rounded-lg font-medium bg-poker-500 hover:bg-poker-600 text-white shadow-glow-sm hover:shadow-glow transition-all"
          >
            + New Preset
          </button>
        </div>

        {/* Create New Preset Form */}
        {isCreatingNew && (
          <div className="bg-background/50 rounded-lg p-4 border border-poker-500 space-y-3">
            <input
              type="text"
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createPreset();
                if (e.key === 'Escape') {
                  setIsCreatingNew(false);
                  setNewPresetName('');
                }
              }}
              placeholder="Enter preset name..."
              className="w-full bg-background border border-background-lightest rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createPreset}
                className="px-4 py-2 bg-poker-500 hover:bg-poker-600 text-white rounded-lg font-medium transition-all"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewPresetName('');
                }}
                className="px-4 py-2 bg-background-lightest hover:bg-background text-foreground rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Presets List */}
        <div className="space-y-3">
          {presets.map(preset => (
            <div
              key={preset.id}
              className="bg-background/50 rounded-lg border border-background-lightest overflow-hidden"
            >
              {editingPresetId === preset.id ? (
                /* Edit Mode */
                <div className="p-4 space-y-4">
                  {/* Preset Name Input */}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="flex-1 bg-background border border-poker-500 rounded-lg px-4 py-2 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-poker-500"
                    />
                    <button
                      onClick={handleAddChip}
                      className="px-3 py-2 rounded-lg font-medium bg-poker-500 hover:bg-poker-600 text-white transition-all"
                    >
                      + Add Chip
                    </button>
                  </div>

                  {/* Chips Editor */}
                  <div className="space-y-2">
                    {editingChips.map((chip, index) => (
                      <div
                        key={chip.id}
                        className="flex items-center gap-4 p-3 bg-background rounded-lg border border-background-lightest"
                      >
                        {/* Chip Visual */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0"
                          style={{
                            backgroundColor: chip.color,
                            border: shouldShowBorder(chip.color) ? '2px solid #333' : 'none',
                            color: getTextColor(chip.color)
                          }}
                        >
                          {chip.value}
                        </div>

                        {/* Inputs */}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-foreground-muted mb-1 block">Value</label>
                            <input
                              type="number"
                              value={chip.value || ''}
                              onChange={e => handleUpdateChip(chip.id, { value: handleNumberInput(e.target.value, 1) })}
                              onBlur={() => handleUpdateChip(chip.id, { value: enforceMinimum(chip.value, 1) })}
                              className="w-full bg-background border border-background-lightest rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-foreground-muted mb-1 block">Count</label>
                            <input
                              type="number"
                              value={chip.count || ''}
                              onChange={e => handleUpdateChip(chip.id, { count: handleNumberInput(e.target.value, 1) })}
                              onBlur={() => handleUpdateChip(chip.id, { count: enforceMinimum(chip.count, 1) })}
                              className="w-full bg-background border border-background-lightest rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-poker-500"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-foreground-muted mb-1 block">Color</label>
                            <input
                              type="color"
                              value={chip.color}
                              onChange={e => handleUpdateChip(chip.id, { color: e.target.value })}
                              className="w-full h-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              index === 0
                                ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                                : 'bg-background-lightest text-foreground hover:bg-poker-500/20'
                            }`}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === editingChips.length - 1}
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              index === editingChips.length - 1
                                ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                                : 'bg-background-lightest text-foreground hover:bg-poker-500/20'
                            }`}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleDeleteChip(chip.id)}
                            disabled={editingChips.length <= 1}
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              editingChips.length <= 1
                                ? 'bg-background-lightest text-foreground-muted cursor-not-allowed opacity-50'
                                : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            }`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-background-lightest">
                    <button
                      onClick={() => savePreset(preset.id)}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold bg-poker-500 hover:bg-poker-600 text-white transition-all"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 rounded-lg font-medium bg-background-lightest hover:bg-background text-foreground transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">{preset.name}</h4>
                        {preset.isDefault && (
                          <span className="text-xs bg-poker-600 text-white px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {preset.chips.map(chip => (
                          <div
                            key={chip.id}
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md"
                            style={{
                              backgroundColor: chip.color,
                              border: shouldShowBorder(chip.color) ? '2px solid #333' : 'none',
                              color: getTextColor(chip.color)
                            }}
                            title={`Value: ${chip.value}, Count: ${chip.count}`}
                          >
                            {chip.value}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!preset.isDefault && (
                        <button
                          onClick={() => setDefaultPreset(preset.id)}
                          className="px-3 py-2 bg-background-lightest hover:bg-poker-500/20 text-foreground rounded-lg text-sm transition-all"
                          title="Set as default"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(preset)}
                        className="px-3 py-2 bg-poker-500/20 hover:bg-poker-500/30 text-poker-400 rounded-lg text-sm transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
            onChange={e => {
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
