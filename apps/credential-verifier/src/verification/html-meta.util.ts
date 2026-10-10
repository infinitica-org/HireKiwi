/** Reads a `<meta property|name="…" content="…">` value, in either attribute order, entity-decoded. */
export function readMetaContent(html: string, property: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    const name = /\b(?:property|name)=["']([^"']+)["']/iu.exec(tag)?.[1];
    if (name?.toLowerCase() !== property) continue;
    const content = /\bcontent=(?:"([^"]*)"|'([^']*)')/iu.exec(tag);
    const value = content?.[1] ?? content?.[2];
    if (value) return decodeEntities(value);
  }
  return null;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/gu, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_m, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}

/** Turns an epoch-millis or ISO value into an ISO date string, or null. */
export function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
