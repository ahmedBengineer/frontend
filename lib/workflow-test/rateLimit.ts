const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const buckets = new Map<string, number[]>();

export function consumeWorkflowTokenQuota(
  key: string,
  now = Date.now(),
): boolean {
  const recent = (buckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 1_000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS))
        buckets.delete(bucketKey);
    }
  }
  return true;
}

export function resetWorkflowTokenRateLimit(): void {
  buckets.clear();
}
