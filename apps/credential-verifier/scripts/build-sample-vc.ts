import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { canonicalizeJcs } from '../src/verification/jcs-canonicalize.util.js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes: Buffer): string {
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

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const rawPublicKey = Buffer.from(publicKey.export({ format: 'jwk' }).x as string, 'base64url');
const didKey = `did:key:z${base58Encode(Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]))}`;
const verificationMethod = `${didKey}#key-1`;

const credentialWithoutProof = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  issuer: 'did:example:hirekiwi-demo-issuer',
  credentialSubject: {
    id: 'did:example:demo-candidate',
    achievement: { name: 'Demo Cloud Practitioner' },
  },
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

console.log(JSON.stringify(credential));
