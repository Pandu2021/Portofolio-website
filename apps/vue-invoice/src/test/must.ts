/**
 * @file must.ts
 * Test helper: returns a value that must exist, or fails the test with a clear
 * message (instead of a non-null assertion that hides the cause).
 */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist`);
  return value;
}
