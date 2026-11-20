export function withWmtsDimensions(url, source) {
  const dimensions = source.getDimensions?.() || source.get?.('timelineDimensions') || {};
  const result = new URL(url, window.location.href);
  for (const [key, value] of Object.entries(dimensions)) {
    if (value == null) continue;
    for (const existing of [...result.searchParams.keys()]) {
      if (existing.toLowerCase() === key.toLowerCase()) result.searchParams.delete(existing);
    }
    result.searchParams.set(key, String(value));
  }
  return result.href;
}
