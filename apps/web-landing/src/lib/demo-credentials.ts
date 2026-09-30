export interface DemoCredential {
  id: string;
  holderName: string;
  roleTitle: string;
  issuer: string;
  issuedDate: string;
  headlineTier: 'Gold' | 'Silver' | 'Bronze';
  tierTrail: {
    level: string;
    label: string;
    tier: 'Gold' | 'Silver' | 'Bronze' | 'None';
    isCurrent?: boolean;
  }[];
  signature: {
    algorithm: string;
    keyId: string;
    hash: string;
    valid: boolean;
  };
}

export const DEMO_CREDENTIAL_DATA: Record<string, DemoCredential> = {
  'CERT-DEMO-2026': {
    id: 'CERT-DEMO-2026',
    holderName: 'Alex Chen',
    roleTitle: 'Full-Stack Software Engineering (L3)',
    issuer: 'SMART Autonomous Verification Engine',
    issuedDate: 'September 15, 2026',
    headlineTier: 'Gold',
    tierTrail: [
      { level: 'L1', label: 'Foundational', tier: 'Gold' },
      { level: 'L2', label: 'Intermediate', tier: 'Gold' },
      { level: 'L3', label: 'Advanced', tier: 'Gold', isCurrent: true },
      { level: 'L4', label: 'Professional', tier: 'Silver' },
    ],
    signature: {
      algorithm: 'Ed25519 / SHA-256',
      keyId: 'ed25519-smart-node-04',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      valid: true,
    },
  },
};

export function lookupDemoCredential(rawId: string): {
  success: boolean;
  data?: DemoCredential;
  error?: string;
} {
  const clean = rawId.trim().toUpperCase();
  if (!clean) {
    return { success: false, error: 'Enter a certificate ID' };
  }
  const match = DEMO_CREDENTIAL_DATA[clean];
  if (match) {
    return { success: true, data: match };
  }
  return {
    success: false,
    error: 'No credential found for this ID. Try CERT-DEMO-2026.',
  };
}
