export function stripCodeFence(input: string) {
  return input
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function extractJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;

  const cleaned = stripCodeFence(raw);
  const firstObject = cleaned.indexOf("{");
  const firstArray = cleaned.indexOf("[");
  const starts = [firstObject, firstArray].filter((index) => index >= 0);
  const start = starts.length ? Math.min(...starts) : 0;
  const endObject = cleaned.lastIndexOf("}");
  const endArray = cleaned.lastIndexOf("]");
  const end = Math.max(endObject, endArray);
  const candidate = end >= start ? cleaned.slice(start, end + 1) : cleaned;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return fallback;
  }
}
