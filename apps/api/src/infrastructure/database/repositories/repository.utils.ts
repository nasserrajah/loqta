export function toBoolean(value: number | bigint): boolean {
  return Number(value) === 1;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return String((error as { code: unknown }).code).startsWith('SQLITE_CONSTRAINT');
}
