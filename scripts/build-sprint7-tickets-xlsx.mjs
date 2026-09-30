/**
 * Generates SMART_Sprint7_Enterprise_Hardening_Tickets.xlsx
 * Pure Node.js (zlib + OpenXML) — zero external dependencies.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'SMART_Sprint7_Enterprise_Hardening_Tickets.xlsx');

function colLetter(n) {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sheetXml(rows) {
  const built = rows
    .map((row, rIdx) => {
      const r = String(rIdx + 1);
      const inner = row
        .map((value, cIdx) => {
          const ref = `${colLetter(cIdx + 1)}${r}`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r}">${inner}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${built}</sheetData>
</worksheet>`;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let j = 0; j < 8; j += 1) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function zipStore(entries) {
  const chunks = [];
  const centrals = [];
  let offset = 0;
  for (const [name, body] of entries) {
    const data = Buffer.from(body, 'utf8');
    const compressed = deflateSync(data, { level: 9 });
    const crc = crc32(data);
    const nameBuf = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    const localFull = Buffer.concat([local, nameBuf, compressed]);
    chunks.push(localFull);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, nameBuf]));
    offset += localFull.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, centralDir, end]);
}

// ----------------------------------------------------
// Data Sheets
// ----------------------------------------------------

const sheetSummary = [
  ['SMART Platform — Sprint 7 Enterprise Hardening & Review Defense'],
  [
    'Version: v2.1.0-prod | Lead Architect: Tino (@brittytino) | Review Target: Day 2 Review Meeting',
  ],
  [''],
  ['Core Governance Directives', 'Architectural Specification'],
  [
    'Target Infrastructure',
    'Single Dedicated High-End Linux VPS (Ubuntu 24.04) hosting both Dev and Prod with Blue-Green Zero-Downtime Deployment. AWS-ready 12-factor architecture.',
  ],
  [
    'Regulatory Privacy & DPDP',
    'Strict Indian DPDP Act 2023 compliance. No Aadhaar or PAN is collected or stored. Telemetry purged at 30 days.',
  ],
  [
    'AI Validation Methodology',
    'Criterion-Referenced BARS rubrics + Modified Angoff cutoffs + 500-sample Golden Dataset benchmark (r > 0.85).',
  ],
  [
    'Assessment Anti-Cheating',
    'Server-authoritative BullMQ delayed timer (ADR-0016) + Python MediaPipe CV sidecar (ADR-0014).',
  ],
  [
    'Placement Matching Engine',
    'PostgreSQL pgvector cosine similarity matching with deterministic regex fallback (ADR-0017).',
  ],
  [
    'Documentation Portal',
    'Interactive Fumadocs portal in @smart/web-docs (port 3006) + Production Release Notes v2.1.0.',
  ],
  [
    'Quality Gates',
    'Max 400 LOC per PR; contract-first in packages/contracts; zero any types; all routes rate-limited.',
  ],
];

const sheetStories = [
  [
    'Ticket ID',
    'Epic',
    'User Story (Story-Based Format)',
    'Owner',
    'Priority',
    'Est Pts',
    'Target Modules',
  ],
  [
    'S7-VV-01',
    'Platform & Auth',
    'As a University Placement Officer (TPO), I want candidates to authenticate via our campus Active Directory / Azure AD SAML/OIDC, so that onboarding is instant and zero student credentials are compromised.',
    'Vishal V',
    'P0',
    '8 pts (32h)',
    'apps/api-core/src/modules/auth',
  ],
  [
    'S7-VV-02',
    'Infrastructure',
    'As the System Architect, I want our services deployed on a single dedicated High-End Linux VPS with Blue-Green zero-downtime deployment, Caddy reverse proxy, and internal-only localhost bindings, so that releases have zero downtime and external attacks cannot reach our databases.',
    'Vishal V',
    'P0',
    '5 pts (20h)',
    'infra/vps, scripts/blue-green-deploy.sh, infra/docker',
  ],
  [
    'S7-VV-03',
    'Platform Core',
    'As an Enterprise Reviewer, I want documented k6/JMeter load test results simulating 50,000 concurrent test-takers, so that we have mathematical proof the system withstands peak university placement season.',
    'Vishal V',
    'P0',
    '5 pts (20h)',
    'tools/load-tests, packages/observability',
  ],
  [
    'S7-SV-01',
    'Student Portal',
    'As a Student Candidate, I want dates formatted consistently as DD/MM/YY and navigation logically organized with clear statuses, so that I can track my assessment journey without confusion.',
    'Satheswaran V',
    'P1',
    '3 pts (12h)',
    'apps/web-student, packages/ui',
  ],
  [
    'S7-SV-02',
    'Student Portal',
    'As a Platform Operator, I want resume uploads restricted strictly to verified PDFs under 5MB with only one active resume allowed, so that storage costs are minimized and security vulnerabilities are prevented.',
    'Satheswaran V',
    'P0',
    '3 pts (12h)',
    'apps/web-student, apps/api-core/modules/users',
  ],
  [
    'S7-SV-03',
    'Experience Layer',
    'As a Candidate, I want hover tooltips on all skill badges explaining what each competency tests, so that I understand why the platform certifies my readiness before taking tests.',
    'Satheswaran V',
    'P1',
    '2 pts (8h)',
    'apps/web-student, packages/ui',
  ],
  [
    'S7-VB-01',
    'Trust & Assessment',
    'As a Legal & Compliance Officer, I want explicit DPDP Section 6 statutory consent displayed before camera access with clear 30-day retention limits, so that the platform complies with Indian data protection laws.',
    'Vishal Bharath R',
    'P0',
    '3 pts (12h)',
    'apps/web-student, apps/api-core/modules/proctoring',
  ],
  [
    'S7-VB-02',
    'Trust & Assessment',
    'As an Assessment Evaluator, I want student proctoring telemetry logged in an audit table with severity scores and warning limits, so that impersonation and cheating are detected without manual proctor fatigue.',
    'Vishal Bharath R',
    'P0',
    '5 pts (20h)',
    'apps/api-core/modules/proctoring, apps/proctoring-cv',
  ],
  [
    'S7-VB-03',
    'Trust Chain',
    'As a Hiring Manager, I want to scan a candidate QR code and view an instant public verification page displaying cryptographic tamper status, so that I know the candidate certificate has not been altered.',
    'Vishal Bharath R',
    'P0',
    '3 pts (12h)',
    'apps/web-verify, apps/api-core/modules/certificate',
  ],
  [
    'S7-RM-01',
    'AI Gateway',
    'As Finance & Ops Director, I want strict token budgets per assessment attempt and hard monthly spend caps on OpenRouter/Anthropic, so that runaway LLM inference costs are impossible.',
    'Ramansh',
    'P0',
    '3 pts (12h)',
    'apps/api-core/src/modules/ai-gateway, rate-limit',
  ],
  [
    'S7-RM-02',
    'AI Intelligence',
    'As an Academic Reviewer, I want psychometric validation reports showing Spearman rank correlation (r > 0.85) against a 500-sample human-annotated Golden Dataset, so that AI grading is statistically proven.',
    'Ramansh',
    'P0',
    '5 pts (20h)',
    'apps/api-core/modules/evaluation, packages/prompts',
  ],
  [
    'S7-RM-03',
    'AI Gateway',
    'As the System Architect, I want the AI gateway to automatically switch from Claude 5 Sonnet to Google Gemini 2.5 on HTTP 429/timeout, so that candidate assessments never fail due to Anthropic outages.',
    'Ramansh',
    'P0',
    '3 pts (12h)',
    'apps/api-core/src/modules/ai-gateway (ADR-0005)',
  ],
  [
    'S7-VG-01',
    'Content & Catalog',
    'As an Examination Controller, I want quantitative and code questions parameterized dynamically with algorithmic seeds, so that answer keys cannot be leaked or shared among student test-takers.',
    'Vedika G',
    'P0',
    '5 pts (20h)',
    'apps/api-core/modules/catalog, tools/content-pipeline',
  ],
  [
    'S7-VG-02',
    'Market Positioning',
    'As our Sales & Executive Team, I want an authoritative Competitor Comparison Matrix contrasting SMART against legacy test vendors (AMCAT, Mettl, HackerEarth), so that our unique value proposition is indisputable.',
    'Vedika G',
    'P1',
    '3 pts (12h)',
    'docs/product, apps/web-docs/content/docs',
  ],
  [
    'S7-VG-03',
    'Content Taxonomy',
    'As an Employer Partner, I want published domain blueprints and observable BARS rubrics across all 10 specialization tracks (5 IT, 5 MBA), so that candidate scores reflect true industry readiness.',
    'Vedika G',
    'P0',
    '5 pts (20h)',
    'docs/blueprints, packages/scoring-engine',
  ],
];

const sheetAcceptance = [
  ['Ticket ID', 'Acceptance Criteria Checklist (Definition of Done)'],
  [
    'S7-VV-01',
    '1. SAML 2.0 / OIDC strategy implemented in Passport.\n2. College email domain routes to correct institutional IdP.\n3. Stateless JWT returned with correct RBAC claims.\n4. Zero plaintext student passwords stored.',
  ],
  [
    'S7-VV-02',
    '1. Caddy reverse proxy terminates TLS 1.3 with Blue-Green dynamic upstream switching.\n2. PostgreSQL (5432), Redis (6379), Redpanda (19092) bound strictly to 127.0.0.1.\n3. SSH tunnel access verified for administrative operations.\n4. Deploy script runs automated health/ready checks and zero-downtime traffic shift.',
  ],
  [
    'S7-VV-03',
    '1. k6 load test executed up to 50k virtual users.\n2. p95 response time for next-item is under 50ms.\n3. p95 for answer submission is under 30ms.\n4. Prometheus scrapers report zero Redis connection pool leaks.',
  ],
  [
    'S7-SV-01',
    '1. All date columns formatted as DD/MM/YY in student portal.\n2. Sidebar grouped under collapsible submenus (Academics, Tests, Jobs).\n3. Ambiguous "Not Verified" replaced with user-friendly tags.\n4. Universal Outfit/Inter font applied with WCAG AA compliance.',
  ],
  [
    'S7-SV-02',
    '1. Upload form rejects any file that is not application/pdf.\n2. Magic byte %PDF- verified on client and backend.\n3. File size capped at 5.0 MB with clean error toast.\n4. Uploading a new resume soft-archives previous uploads.',
  ],
  [
    'S7-SV-03',
    '1. Hovering over a skill badge renders a popover tooltip.\n2. Tooltip displays competency definition and evaluation anchor.\n3. Responsive and touch-friendly on mobile viewport.',
  ],
  [
    'S7-VB-01',
    '1. Pre-assessment modal pops up before navigator.mediaDevices.getUserMedia.\n2. Explains data captured (periodic snapshots), purpose, and 30-day retention.\n3. Assessment cannot start without explicit un-checked checkbox click.\n4. Timestamp recorded in ProctoringSession.consentAt.',
  ],
  [
    'S7-VB-02',
    '1. Python sidecar emits violations (multi-face, absent face, gaze angle).\n2. api-core writes to IntegrityEvent table with timestamp and severity.\n3. Warning counter updates in Redis.\n4. Attempts exceeding 15 warnings flagged for review.',
  ],
  [
    'S7-VB-03',
    '1. Public verify page loads certificate by ID in < 50ms.\n2. Server-side HMAC-SHA256 signature verified.\n3. If hash mismatch, [SECURITY_EVENT] tamper banner rendered.\n4. QR code resolves correctly on mobile browser.',
  ],
  [
    'S7-RM-01',
    '1. Max token limit enforced per attempt (8k prompt, 2k completion).\n2. Redis token usage counter rejects requests exceeding budget.\n3. Monthly hard cap set in OpenRouter console.\n4. Prompt cache returns cached response for identical rubrics.',
  ],
  [
    'S7-RM-02',
    '1. Curated golden test set of 500 candidate submissions annotated by SMEs.\n2. Evaluation model scores benchmarked against human ratings.\n3. Spearman rank correlation r > 0.85 achieved.\n4. Cronbach alpha reliability > 0.80 documented in report.',
  ],
  [
    'S7-RM-03',
    '1. Mocking HTTP 429 on Claude API immediately routes to Gemini 2.5.\n2. Output format validated against same Zod contract.\n3. Failover event logged with metric counter.\n4. Zero assessment dropouts during simulated Claude outage.',
  ],
  [
    'S7-VG-01',
    '1. Algorithmic variable generator seeds numbers per candidate attempt.\n2. Expected answers computed dynamically from formula.\n3. Prevents memorization and answer sharing across campus batches.',
  ],
  [
    'S7-VG-02',
    '1. Matrix created comparing SMART against AMCAT, Mettl, HackerEarth.\n2. Dimensions covered: evidence-backed proof, 5-level depth, HMAC certs, vector matching.\n3. Published to docs and ready for pitch deck inclusion.',
  ],
  [
    'S7-VG-03',
    '1. Blueprints for 5 IT tracks and 5 MBA tracks fully documented.\n2. BARS rubrics anchored from Level 0 to Level 4.\n3. Cut scores validated via SME Angoff panel estimates.',
  ],
];

const sheetDelegation = [
  ['Engineer', 'Role Title', 'Assigned Tickets', 'Total Points', 'Primary Focus Area'],
  [
    'Vishal V',
    'Senior Backend Engineer',
    'S7-VV-01, S7-VV-02, S7-VV-03',
    '18 pts',
    'Platform Core, AD SSO, VPS Hardening, JMeter Benchmark',
  ],
  [
    'Satheswaran V',
    'Frontend Lead',
    'S7-SV-01, S7-SV-02, S7-SV-03',
    '8 pts',
    'Dashboard UX, DD/MM/YY, PDF Resume Gate, Tooltips',
  ],
  [
    'Vishal Bharath R',
    'Trust & Assessment Lead',
    'S7-VB-01, S7-VB-02, S7-VB-03',
    '11 pts',
    'Consent Modal, Proctoring Audit Log, Public QR Verify',
  ],
  [
    'Ramansh',
    'AI Engineer',
    'S7-RM-01, S7-RM-02, S7-RM-03',
    '11 pts',
    'Token Caps, Psychometric Benchmark Dataset, Gemini Failover',
  ],
  [
    'Vedika G',
    'Data & Content Engineer',
    'S7-VG-01, S7-VG-02, S7-VG-03',
    '13 pts',
    'Item Parameterization, Competitor Matrix, Track Blueprints',
  ],
  [
    'Tino',
    'System Architect & Reviewer',
    'Architecture Review, Quality Gates, PR Sign-off',
    'Governance',
    'Contract Authority, Zero-downtime Release Gate, Reviewer Defense',
  ],
];

// ----------------------------------------------------
// OpenXML Packaging
// ----------------------------------------------------

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
</Relationships>`;

const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Executive Summary" sheetId="1" r:id="rId1"/>
    <sheet name="Story-Based Tickets" sheetId="2" r:id="rId2"/>
    <sheet name="Acceptance Criteria" sheetId="3" r:id="rId3"/>
    <sheet name="Team Delegation" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>`;

writeFileSync(
  outPath,
  zipStore([
    ['[Content_Types].xml', contentTypes],
    ['_rels/.rels', rels],
    ['xl/workbook.xml', workbook],
    ['xl/_rels/workbook.xml.rels', wbRels],
    ['xl/worksheets/sheet1.xml', sheetXml(sheetSummary)],
    ['xl/worksheets/sheet2.xml', sheetXml(sheetStories)],
    ['xl/worksheets/sheet3.xml', sheetXml(sheetAcceptance)],
    ['xl/worksheets/sheet4.xml', sheetXml(sheetDelegation)],
  ]),
);

console.log(`Generated: ${outPath}`);
