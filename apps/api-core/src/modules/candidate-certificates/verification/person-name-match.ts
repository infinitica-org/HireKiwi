/** Lowercase, accent-free word tokens: "VISHAL V." and "Vishal V" both become ["vishal", "v"]. */
function nameTokens(name: string): string[] {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function tokensCompatible(a: string, b: string): boolean {
  if (a === b) return true;
  // An initial matches the word it abbreviates ("v" ~ "venkatesan").
  return (a.length === 1 && b.startsWith(a)) || (b.length === 1 && a.startsWith(b));
}

/**
 * Whether the name on a credential plausibly refers to the account holder. Order-insensitive,
 * tolerates initials and extra middle names on either side, but every word of the shorter name
 * must pair with a distinct word of the longer one, and at least one paired word must be spelled
 * out in full on both sides, so "V V" never matches "Vishal Venkatesan".
 * A one-word name only matches a one-word name.
 */
export function personNamesMatch(credentialName: string, accountName: string): boolean {
  const a = nameTokens(credentialName);
  const b = nameTokens(accountName);
  if (a.length === 0 || b.length === 0) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.length === 1 && longer.length > 1) return false;

  const unused = [...longer];
  let fullWordPairs = 0;
  // Pair exact words first so an initial can't steal the word a full name needed.
  const ordered = [...shorter].sort((x, y) => y.length - x.length);
  for (const token of ordered) {
    let index = unused.indexOf(token);
    if (index === -1) index = unused.findIndex((other) => tokensCompatible(token, other));
    if (index === -1) return false;
    const [other] = unused.splice(index, 1);
    if (token === other && token.length > 1) fullWordPairs++;
  }
  return fullWordPairs > 0;
}
