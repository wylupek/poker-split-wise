/**
 * Safely converts string input to number with minimum validation
 */
export function handleNumberInput(value: string, min: number = 0): number {
  if (value === '') return 0;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return min;
  return num;
}

/**
 * Ensures value doesn't fall below minimum
 */
export function enforceMinimum(value: number, min: number = 0): number {
  return value < min ? min : value;
}
