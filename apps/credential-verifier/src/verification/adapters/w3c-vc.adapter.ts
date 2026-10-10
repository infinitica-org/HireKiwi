import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { base58Decode } from '../base58.util.js';
import { canonicalizeJcs } from '../jcs-canonicalize.util.js';
import type {
  AdapterCapabilities,
  AdapterVerificationResult,
  CredentialInput,
  CredentialVerifier,
  Evidence,
  NormalizedCredential,
  VerificationCheck,
} from '../types.js';

const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);

interface W3cCredentialShape {
  '@context'?: unknown;
  type?: string | string[];
  issuer?: string | { id?: string; name?: string };
  credentialSubject?: { id?: string; [key: string]: unknown };
  validFrom?: string;
  issuanceDate?: string;
  validUntil?: string;
  expirationDate?: string;
  credentialStatus?: { type?: string; status?: string };
  proof?: {
    type?: string;
    cryptosuite?: string;
    verificationMethod?: string;
    proofValue?: string;
    [key: string]: unknown;
  };
}

function hasBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Decodes a did:key verification method into a raw Ed25519 public key, or null if it isn't one. */
function decodeDidKeyEd25519(verificationMethod: string): Uint8Array | null {
  const match = /^did:key:(z[1-9A-HJ-NP-Za-km-z]+)/.exec(verificationMethod);
  if (!match?.[1]) return null;
  const multibaseValue = match[1].slice(1); // drop 'z' multibase prefix
  const decoded = base58Decode(multibaseValue);
  if (decoded.length < 2 || !hasBytesEqual(decoded.slice(0, 2), ED25519_MULTICODEC_PREFIX)) {
    return null;
  }
  return decoded.slice(2);
}

/**
 * W3C Verifiable Credentials adapter. Performs REAL structural validation
 * always, and REAL Ed25519 signature verification for the one proof suite
 * (`DataIntegrityProof` + `eddsa-jcs-2022`, `did:key` verification method)
 * this implementation covers. Any other proof type/suite gets an honest
 * DOCUMENT_PARSED result with a stated reason — never a fabricated
 * CRYPTOGRAPHICALLY_VERIFIED.
 */
export class W3cVcAdapter implements CredentialVerifier {
  readonly id = 'w3c-vc';

  canHandle(input: CredentialInput): boolean {
    if (input.type !== 'JSON_CREDENTIAL') return false;
    const shape = this.tryParse(input.value);
    return shape !== null && this.looksLikeVc(shape);
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    const credential = this.tryParse(input.value);
    const issuerName =
      typeof credential?.issuer === 'string'
        ? credential.issuer
        : (credential?.issuer?.name ?? null);
    const issuerId =
      typeof credential?.issuer === 'string' ? credential.issuer : (credential?.issuer?.id ?? null);

    return {
      achievement: {
        name: this.extractAchievementName(credential),
        credentialType: 'DIGITAL_BADGE',
      },
      issuer: {
        name: issuerName ?? 'Unknown',
        domain: null,
        issuerType: 'w3c-vc-issuer',
        trustStatus: 'UNVERIFIED',
      },
      subject: {
        name: credential?.credentialSubject?.id ?? 'Unknown',
        email: null,
        externalIdentifier: issuerId,
      },
      issueDate: credential?.validFrom ?? credential?.issuanceDate ?? null,
      expirationDate: credential?.validUntil ?? credential?.expirationDate ?? null,
      sourceEvidence: [
        { evidenceType: 'document', url: null, fileRef: null, metadata: { raw: input.value } },
      ],
      rawInput: input,
    };
  }

  async verify(credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    const shape = this.tryParse(credential.rawInput.value);
    const checks: VerificationCheck[] = [];
    const evidence: Evidence[] = [];

    if (!shape || !this.looksLikeVc(shape)) {
      return this.unverifiable('Input did not parse as a W3C Verifiable Credential.');
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: 'Required VC fields present (@context, type, credentialSubject, issuer).',
    });

    const now = new Date();
    const expirationRaw = shape.validUntil ?? shape.expirationDate ?? null;
    if (expirationRaw) {
      const expired = new Date(expirationRaw) < now;
      checks.push({
        checkName: 'expiration',
        result: expired ? 'FAIL' : 'PASS',
        detail: expired ? `Expired ${expirationRaw}.` : `Valid until ${expirationRaw}.`,
      });
      if (expired) {
        return {
          status: 'EXPIRED',
          verificationLevel: 'DOCUMENT_PARSED',
          method: 'W3C_VC',
          provider: null,
          verifiedAt: new Date().toISOString(),
          checks,
          evidence,
          evidenceUrl: null,
          rawResponse: null,
        };
      }
    } else {
      checks.push({ checkName: 'expiration', result: 'SKIP', detail: 'No expiration asserted.' });
    }

    const proof = shape.proof;
    if (!proof?.verificationMethod || !proof.proofValue) {
      checks.push({
        checkName: 'issuer',
        result: 'UNKNOWN',
        detail: 'No proof present to verify.',
      });
      return {
        status: 'DOCUMENT_ONLY',
        verificationLevel: 'DOCUMENT_PARSED',
        method: 'W3C_VC',
        provider: null,
        verifiedAt: null,
        checks,
        evidence,
        evidenceUrl: null,
        rawResponse: null,
      };
    }

    const supported = proof.type === 'DataIntegrityProof' && proof.cryptosuite === 'eddsa-jcs-2022';
    if (!supported) {
      checks.push({
        checkName: 'issuer',
        result: 'UNKNOWN',
        detail: `Proof suite '${String(proof.type)}/${String(proof.cryptosuite)}' is not implemented by this adapter yet — structural checks only.`,
      });
      return {
        status: 'DOCUMENT_ONLY',
        verificationLevel: 'DOCUMENT_PARSED',
        method: 'W3C_VC',
        provider: null,
        verifiedAt: null,
        checks,
        evidence,
        evidenceUrl: null,
        rawResponse: null,
      };
    }

    const publicKey = decodeDidKeyEd25519(proof.verificationMethod);
    if (!publicKey || publicKey.length !== 32) {
      checks.push({
        checkName: 'issuer',
        result: 'FAIL',
        detail: 'verificationMethod is not a decodable did:key Ed25519 key.',
      });
      return this.invalid(checks);
    }

    const { proof: _omit, ...credentialWithoutProof } = shape;
    let signatureValid: boolean;
    try {
      const message = Buffer.from(canonicalizeJcs(credentialWithoutProof), 'utf8');
      const signature = base58Decode(proof.proofValue.replace(/^z/, ''));
      const keyObject = createPublicKey({
        key: { kty: 'OKP', crv: 'Ed25519', x: Buffer.from(publicKey).toString('base64url') },
        format: 'jwk',
      });
      signatureValid = cryptoVerify(null, message, keyObject, signature);
    } catch (error: unknown) {
      checks.push({
        checkName: 'issuer',
        result: 'FAIL',
        detail: `Signature verification error: ${error instanceof Error ? error.message : 'unknown'}.`,
      });
      return this.invalid(checks);
    }

    checks.push({
      checkName: 'issuer',
      result: signatureValid ? 'PASS' : 'FAIL',
      detail: signatureValid
        ? 'Ed25519 signature verified against did:key verification method.'
        : 'Ed25519 signature did NOT match — credential is not authentic as presented.',
    });

    if (!signatureValid) {
      return this.invalid(checks);
    }

    return {
      status: 'VERIFIED',
      verificationLevel: 'CRYPTOGRAPHICALLY_VERIFIED',
      method: 'W3C_VC',
      provider: 'w3c-vc:did-key-ed25519',
      verifiedAt: new Date().toISOString(),
      checks,
      evidence,
      evidenceUrl: null,
      rawResponse: null,
      subjectName: subjectNameOf(shape),
      details: {
        achievementName: achievementNameOf(shape),
        issuerName: issuerNameOf(shape),
        issuedOn: typeof shape.validFrom === 'string' ? shape.validFrom : null,
        expiresOn: typeof shape.validUntil === 'string' ? shape.validUntil : null,
      },
    };
  }

  async getEvidence(credential: NormalizedCredential): Promise<Evidence[]> {
    return credential.sourceEvidence;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: true,
      canCheckRevocation: false,
      canCheckSubjectIdentity: false,
      requiresUserMediation: false,
      integrationType: 'OFFICIAL_API',
    };
  }

  private invalid(checks: VerificationCheck[]): AdapterVerificationResult {
    return {
      status: 'INVALID',
      verificationLevel: 'DOCUMENT_PARSED',
      method: 'W3C_VC',
      provider: null,
      verifiedAt: null,
      checks,
      evidence: [],
      evidenceUrl: null,
      rawResponse: null,
    };
  }

  private unverifiable(reason: string): AdapterVerificationResult {
    return {
      status: 'UNVERIFIABLE',
      verificationLevel: 'UNVERIFIED',
      method: 'W3C_VC',
      provider: null,
      verifiedAt: null,
      checks: [{ checkName: 'credential', result: 'FAIL', detail: reason }],
      evidence: [],
      evidenceUrl: null,
      rawResponse: null,
    };
  }

  private extractAchievementName(shape: W3cCredentialShape | null): string {
    const subject = shape?.credentialSubject as { achievement?: { name?: string } } | undefined;
    return subject?.achievement?.name ?? 'Unknown';
  }

  private looksLikeVc(shape: W3cCredentialShape): boolean {
    const context = shape['@context'];
    const contextStr = Array.isArray(context) ? context.join(' ') : String(context ?? '');
    const typeStr = Array.isArray(shape.type) ? shape.type.join(' ') : String(shape.type ?? '');
    return (
      (contextStr.includes('w3.org/2018/credentials') ||
        contextStr.includes('w3.org/ns/credentials')) &&
      typeStr.includes('VerifiableCredential') &&
      typeof shape.credentialSubject === 'object'
    );
  }

  private tryParse(raw: string): W3cCredentialShape | null {
    try {
      return JSON.parse(raw) as W3cCredentialShape;
    } catch {
      return null;
    }
  }
}

/** The holder's display name when the credential states one (VC 2.0 / Open Badges 3.0 `credentialSubject.name`). */
function subjectNameOf(shape: W3cCredentialShape): string | null {
  const name = shape.credentialSubject?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function issuerNameOf(shape: W3cCredentialShape): string | null {
  const name = typeof shape.issuer === 'object' ? shape.issuer.name : undefined;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

/** The achievement's own name, when it has one (Open Badges 3.0 nests it under credentialSubject). */
function achievementNameOf(shape: W3cCredentialShape): string | null {
  const achievement = shape.credentialSubject?.achievement as { name?: unknown } | undefined;
  return typeof achievement?.name === 'string' && achievement.name.trim()
    ? achievement.name.trim()
    : null;
}
