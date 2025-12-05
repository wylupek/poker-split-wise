import { Chip, ChipCounts } from '../types';
import './ChipCounter.css';

interface Props {
  chipCounts: ChipCounts;
  chips: Chip[];
  onChipCountChange: (chipId: string, count: number) => void;
  totalValue: number;
}

function getTextColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000' : '#fff';
}

function shouldShowBorder(hexColor: string): boolean {
  // Show border for very light colors
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85;
}

export function ChipCounter({ chipCounts, chips, onChipCountChange, totalValue }: Props) {
  return (
    <div className="chip-counter">
      <div className="chips-grid">
        {chips.map((chip) => (
          <div key={chip.id} className="chip-item">
            <div
              className="chip-circle"
              style={{
                backgroundColor: chip.color,
                border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none'
              }}
            >
              <div className="chip-value" style={{ color: getTextColor(chip.color) }}>
                {chip.value}
              </div>
            </div>
            <div className="chip-controls">
              <label className="chip-label">{chip.label}</label>
              <input
                type="number"
                value={chipCounts[chip.id] || 0}
                onChange={(e) => onChipCountChange(chip.id, Math.max(0, Number(e.target.value)))}
                className="chip-input"
                min="0"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="chip-total">
        <strong>Total chips:</strong> {totalValue}
      </div>
    </div>
  );
}
