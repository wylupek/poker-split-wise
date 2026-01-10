import { Chip, ChipCounts } from '../types';
import { getTextColor, shouldShowBorder } from '../utils/colors';

interface Props {
  chipCounts: ChipCounts;
  chips: Chip[];
  onChipCountChange: (chipId: string, count: number) => void;
  totalValue: number;
  startingChips?: number;
}

export function ChipCounter({ chipCounts, chips, onChipCountChange, totalValue, startingChips = 0 }: Props) {
  // Smart grid: adapt columns based on number of chips
  const getGridCols = () => {
    const chipCount = chips.length;
    if (chipCount <= 3) return 'grid-cols-2 sm:grid-cols-3'; // 2 mobile, 3 desktop
    if (chipCount === 4) return 'grid-cols-2 sm:grid-cols-4'; // 2 mobile, 4 desktop
    if (chipCount === 5) return 'grid-cols-2 sm:grid-cols-5'; // 2 mobile, 5 desktop
    if (chipCount === 6) return 'grid-cols-2 sm:grid-cols-3'; // 2 mobile, 3 desktop (2 rows)
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'; // default
  };

  // Determine color based on profit/loss
  const getTotalColor = () => {
    if (totalValue > startingChips) return 'text-poker-400'; // green for profit
    if (totalValue < startingChips) return 'text-red-400'; // red for loss
    return 'text-foreground'; // neutral for break even
  };

  return (
    <div className="space-y-4">
      <div className={`grid ${getGridCols()} gap-3`}>
        {chips.map((chip) => {
          const count = chipCounts[chip.id] || 0;
          return (
            <div
              key={chip.id}
              className="bg-background/50 rounded-lg p-4 border border-background-lightest hover:border-poker-700/50 transition-all flex flex-col items-center"
            >
              {/* Chip Visual - BIGGER */}
              <div className="mb-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
                  style={{
                    backgroundColor: chip.color,
                    color: getTextColor(chip.color),
                    border: shouldShowBorder(chip.color) ? '3px solid #333' : 'none'
                  }}
                >
                  {chip.value}
                </div>
              </div>

              {/* Counter Controls - BIGGER */}
              <div className="flex items-center gap-2 mb-3 w-full justify-center">
                <button
                  onClick={() => onChipCountChange(chip.id, Math.max(0, count - 1))}
                  className="w-10 h-10 rounded bg-background-lightest hover:bg-poker-900/30 text-foreground font-bold text-lg transition-all flex items-center justify-center"
                >
                  −
                </button>
                <div className="w-14 h-10 bg-background border-2 border-poker-600/50 rounded flex items-center justify-center">
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => onChipCountChange(chip.id, Math.max(0, Number(e.target.value)))}
                    className="w-full bg-transparent text-center text-foreground font-bold text-lg focus:outline-none"
                    min="0"
                  />
                </div>
                <button
                  onClick={() => onChipCountChange(chip.id, count + 1)}
                  className="w-10 h-10 rounded bg-background-lightest hover:bg-poker-900/30 text-foreground font-bold text-lg transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-center text-sm text-foreground-muted">
                {count} × {chip.value} = <span className="text-poker-400 font-bold">{count * chip.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-poker-900/20 rounded-lg p-4 border border-poker-700/50">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted font-medium">Total Chips:</span>
          <span className="text-2xl font-bold text-foreground">{totalValue}</span>
        </div>
      </div>
    </div>
  );
}
