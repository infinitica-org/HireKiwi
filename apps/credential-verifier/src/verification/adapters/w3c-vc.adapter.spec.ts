import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { base58Decode } from '../base58.util.js';
import { canonicalizeJcs } from '../jcs-canonicalize.util.js';
import { W3cVcAdapter } from './w3c-vc.adapter.js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = '';
  while (num > 0n) {
    out = BASE58_ALPHABET[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = '1' + out;
  }
  return out || '1';
}

/** Builds a real did:key:z6Mk... identifier from a raw 32-byte Ed25519 public key. */
function didKeyFromRawPublicKey(raw: Buffer): string {
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), raw]);
  return `did:key:z${base58Encode(prefixed)}`;
}

describe('base58', () => {
  it('round-trips through encode/decode', () => {
    const original = Buffer.from('hello hirekiwi', 'utf8');
    const decoded = base58Decode(base58Encode(original));
    expect(Buffer.from(decoded).equals(original)).toBe(true);
  });
});

describe('W3cVcAdapter — eddsa-jcs-2022 signature verification', () => {
  it('cryptographically verifies a credential signed with a real Ed25519 key', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const rawPublicKey = publicKey.export({ format: 'jwk' }).x as string;
    const rawPublicKeyBytes = Buffer.from(rawPublicKey, 'base64url');
    const verificationMethod = `${didKeyFromRawPublicKey(rawPublicKeyBytes)}#key-1`;

    const credentialWithoutProof = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: 'did:example:issuer123',
      credentialSubject: { id: 'did:example:subject456', achievement: { name: 'Test Credential' } },
      validFrom: '2026-01-01T00:00:00Z',
    };

    const message = Buffer.from(canonicalizeJcs(credentialWithoutProof), 'utf8');
    const signature = cryptoSign(null, message, privateKey);

    const credential = {
      ...credentialWithoutProof,
      proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        verificationMethod,
        proofValue: `z${base58Encode(signature)}`,
      },
    };

    const adapter = new W3cVcAdapter();
    const input = { type: 'JSON_CREDENTIAL' as const, value: JSON.stringify(credential) };
    expect(adapter.canHandle(input)).toBe(true);

    const normalized = await adapter.normalize(input);
    const result = await adapter.verify(normalized);

    expect(result.status).toBe('VERIFIED');
    expect(result.verificationLevel).toBe('CRYPTOGRAPHICALLY_VERIFIED');
    expect(result.checks.find((c) => c.checkName === 'issuer')?.result).toBe('PASS');
  });

  it('reports INVALID when the signature does not match (tampered credential)', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const rawPublicKey = publicKey.export({ format: 'jwk' }).x as string;
    const rawPublicKeyBytes = Buffer.from(rawPublicKey, 'base64url');
    const verificationMethod = `${didKeyFromRawPublicKey(rawPublicKeyBytes)}#key-1`;

    const original = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: 'did:example:issuer123',
      credentialSubject: { id: 'did:example:subject456', achievement: { name: 'Test Credential' } },
      validFrom: '2026-01-01T00:00:00Z',
    };
    const message = Buffer.from(canonicalizeJcs(original), 'utf8');
    const signature = cryptoSign(null, message, privateKey);

    // Tamper with the credential AFTER signing — the signature no longer matches.
    const tampered = {
      ...original,
      credentialSubject: {
        ...original.credentialSubject,
        achievement: { name: 'Forged Credential' },
      },
    };
    const credential = {
      ...tampered,
      proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        verificationMethod,
        proofValue: `z${base58Encode(signature)}`,
      },
    };

    const adapter = new W3cVcAdapter();
    const input = { type: 'JSON_CREDENTIAL' as const, value: JSON.stringify(credential) };
    const normalized = await adapter.normalize(input);
    const result = await adapter.verify(normalized);

    expect(result.status).toBe('INVALID');
    expect(result.checks.find((c) => c.checkName === 'issuer')?.result).toBe('FAIL');
  });

  it('falls back to DOCUMENT_PARSED, never a fake pass, for an unsupported proof suite', async () => {
    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: 'did:example:issuer123',
      credentialSubject: { id: 'did:example:subject456' },
      proof: {
        type: 'Ed25519Signature2020',
        verificationMethod: 'did:key:z6Mkabc#key-1',
        proofValue: 'zSomeSignature',
      },
    };

    const adapter = new W3cVcAdapter();
    const input = { type: 'JSON_CREDENTIAL' as const, value: JSON.stringify(credential) };
    const normalized = await adapter.normalize(input);
    const result = await adapter.verify(normalized);

    expect(result.status).toBe('DOCUMENT_ONLY');
    expect(result.verificationLevel).toBe('DOCUMENT_PARSED');
  });
});
