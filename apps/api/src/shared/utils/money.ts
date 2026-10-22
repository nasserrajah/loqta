export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
