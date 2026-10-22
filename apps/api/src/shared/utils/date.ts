export function nowIso(): string {
  return new Date().toISOString();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isExpired(isoTimestamp: string, now: Date = new Date()): boolean {
  return new Date(isoTimestamp).getTime() <= now.getTime();
}
