import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

/**
 * SSRF-safe outbound fetch for adapter use. Every adapter that follows a
 * candidate-supplied URL (QR/verification link/badge URL) MUST go through
 * this, never a bare `fetch`. Blocks loopback/private/link-local targets,
 * disallows redirects to those ranges, caps body size, and times out.
 */

export class UnsafeUrlError extends Error {}

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);
const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const a = parts[0] ?? -1;
  const b = parts[1] ?? -1;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true;
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice('::ffff:'.length));
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new UnsafeUrlError(`Blocked hostname: ${hostname}`);
  }
  const ipVersion = isIP(hostname);
  if (ipVersion === 4 && isPrivateIpv4(hostname)) {
    throw new UnsafeUrlError(`Blocked private IPv4 target: ${hostname}`);
  }
  if (ipVersion === 6 && isPrivateIpv6(hostname)) {
    throw new UnsafeUrlError(`Blocked private IPv6 target: ${hostname}`);
  }
  if (ipVersion === 0) {
    const resolved = await lookup(hostname, { all: true });
    for (const { address, family } of resolved) {
      if (family === 4 && isPrivateIpv4(address)) {
        throw new UnsafeUrlError(`Hostname ${hostname} resolves to a private IPv4 address.`);
      }
      if (family === 6 && isPrivateIpv6(address)) {
        throw new UnsafeUrlError(`Hostname ${hostname} resolves to a private IPv6 address.`);
      }
    }
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  status: number;
  ok: boolean;
  text: string;
  finalUrl: string;
}

/** Fetches a candidate-supplied URL with SSRF protection. Throws UnsafeUrlError if the target (or any redirect hop) resolves to a private/loopback/link-local address. */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  let current = new URL(url);
  if (current.protocol !== 'https:' && current.protocol !== 'http:') {
    throw new UnsafeUrlError(`Unsupported protocol: ${current.protocol}`);
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(current.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'HireKiwi-CredentialVerifier/0.1', ...options.headers },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return { status: response.status, ok: false, text: '', finalUrl: current.toString() };
      }
      current = new URL(location, current);
      continue;
    }

    const reader = response.body?.getReader();
    let bytes = 0;
    let text = '';
    if (reader) {
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BODY_BYTES) {
          await reader.cancel();
          throw new UnsafeUrlError('Response exceeded maximum allowed size.');
        }
        text += decoder.decode(value, { stream: true });
      }
    }

    return { status: response.status, ok: response.ok, text, finalUrl: current.toString() };
  }

  throw new UnsafeUrlError('Too many redirects.');
}
