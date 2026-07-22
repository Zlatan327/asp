/**
 * Safely parses a value that may be a JSON string, a raw object/array (from Prisma Json fields), or undefined/null.
 */
export function safeParseJson<T = any>(val: any, fallback: T = [] as unknown as T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}
