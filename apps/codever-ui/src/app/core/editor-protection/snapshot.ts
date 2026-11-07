/**
 * Deterministic serialization used to compare editor snapshots. Object keys
 * are sorted, `undefined` becomes `null`, and array order is preserved.
 */
export function snapshotKey(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalize(source[key]);
        return result;
      }, {});
  }
  return value;
}
