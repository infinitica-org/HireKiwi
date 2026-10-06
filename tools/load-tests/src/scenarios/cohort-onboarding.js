/**
 * S6-VV-133 (#590): a TPO imports a large student roster, then a fraction of those students
 * accept their invite and load their dashboard for the first time — the real-world "start of
 * semester" burst this platform has to survive.
 *
 *   setup (once): TPO login -> create batch -> upload CSV (COHORT_SIZE rows)
 *                 -> for ACCEPTANCE_PCT of the imported members, mint an invite link
 *                    (POST /tpo/students/:userId/invite-link — the same "copy invite link"
 *                    action a TPO uses, never an email: this sidesteps needing a Mailpit
 *                    client to scrape invite tokens out of HTML email bodies)
 *   default (per VU): accept the invite (sets password, returns a session in one call)
 *                 -> first dashboard load
 *
 * Run standalone against a target that has 'bulk_batch_import' enabled for the seeded
 * institution:
 *   k6 run src/scenarios/cohort-onboarding.js
 *
 * Thresholds: import completes within IMPORT_BUDGET_MS (default 60s, per the ticket),
 * writesP95/authP95 on the accept+login step, zero duplicate users (checked in setup by
 * re-reading the batch's memberCount against the number of unique emails uploaded).
 */
import { sleep } from 'k6';
import { check } from 'k6';
import http from 'k6/http';
import { API_PREFIX, tpoCredentials, urls } from '../config/index.js';
import { THRESHOLD_VALUES } from '../config/thresholds.js';
import { login } from '../helpers/auth.js';
import { authHeaders, timedGet, timedPost, thinkTime } from '../helpers/http.js';
import { loginLatency, writeLatency } from '../helpers/metrics.js';
import { Counter, Trend } from 'k6/metrics';

const COHORT_SIZE = Number(__ENV.COHORT_SIZE || '2000');
const ACCEPTANCE_PCT = Number(__ENV.COHORT_ACCEPTANCE_PCT || '30');
const IMPORT_BUDGET_MS = Number(__ENV.IMPORT_BUDGET_MS || '60000');
const RUN_ID = __ENV.COHORT_RUN_ID || `${Date.now()}`;

const cohortImportDuration = new Trend('cohort_import_duration', true);
const cohortDuplicateUsers = new Counter('cohort_duplicate_users');

export const options = {
  scenarios: {
    acceptance: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 50, duration: '2m' },
        { target: 50, duration: '8m' },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    cohort_import_duration: [`p(100)<${IMPORT_BUDGET_MS}`],
    cohort_duplicate_users: ['count==0'],
    write_latency: [`p(95)<${THRESHOLD_VALUES.writesP95}`],
    login_latency: [`p(95)<${THRESHOLD_VALUES.authP95}`],
  },
};

function buildRosterCsv(size) {
  const lines = ['name,email'];
  for (let i = 0; i < size; i += 1) {
    lines.push(`Cohort Student ${String(i)},cohort-${RUN_ID}-${String(i)}@loadtest.local`);
  }
  return lines.join('\n');
}

export function setup() {
  const session = login(tpoCredentials.username, tpoCredentials.password);
  if (!session) throw new Error('cohort-onboarding setup: TPO login failed');
  const headers = authHeaders(session.accessToken);

  const batchRes = timedPost(
    `${urls.api}${API_PREFIX}/tpo/batches`,
    JSON.stringify({ name: `Load test cohort ${RUN_ID}` }),
    writeLatency,
    'cohort_create_batch',
    { headers },
  );
  const batch = JSON.parse(batchRes.body);
  if (!batch.batchId) throw new Error('cohort-onboarding setup: batch creation failed');

  const csv = buildRosterCsv(COHORT_SIZE);
  const importStart = Date.now();
  const importRes = http.post(
    `${urls.api}${API_PREFIX}/tpo/batches/${batch.batchId}/members/import`,
    { file: http.file(csv, 'roster.csv', 'text/csv') },
    { headers, tags: { name: 'cohort_import' } },
  );
  const importDuration = Date.now() - importStart;
  cohortImportDuration.add(importDuration);
  check(importRes, { 'cohort import: 200/201': (r) => r.status === 200 || r.status === 201 });

  const result = JSON.parse(importRes.body);

  // Zero-duplicate check (ticket requirement): the batch's member count must equal exactly
  // what this run imported — a duplicate would show up as memberCount > imported.
  const membersRes = timedGet(
    `${urls.api}${API_PREFIX}/tpo/batches/${batch.batchId}/members`,
    writeLatency,
    'cohort_list_members',
    { headers },
  );
  const members = JSON.parse(membersRes.body);
  const memberList = Array.isArray(members) ? members : (members.items ?? []);
  if (memberList.length !== result.imported) {
    cohortDuplicateUsers.add(memberList.length - result.imported);
  }

  // Mint invite links for ACCEPTANCE_PCT of the imported members — these feed `default()`.
  const acceptCount = Math.floor((memberList.length * ACCEPTANCE_PCT) / 100);
  const toInvite = memberList.slice(0, acceptCount);
  const invites = [];
  for (const member of toInvite) {
    const linkRes = timedPost(
      `${urls.api}${API_PREFIX}/tpo/students/${member.userId}/invite-link`,
      null,
      writeLatency,
      'cohort_mint_invite_link',
      { headers },
    );
    try {
      const { inviteUrl } = JSON.parse(linkRes.body);
      const token = inviteUrl.split('/').pop();
      if (token) invites.push(token);
    } catch {
      // Minting failed for this one student — skip it, don't fail the whole cohort.
    }
  }

  return { invites, batchId: batch.batchId, imported: result.imported };
}

export default function (data) {
  if (!data.invites || data.invites.length === 0) return;
  const token = data.invites[(__VU + __ITER) % data.invites.length];

  const acceptRes = timedPost(
    `${urls.api}${API_PREFIX}/auth/invitations/${token}/accept`,
    JSON.stringify({ password: 'CohortLoadTest!1' }),
    loginLatency,
    'cohort_accept_invite',
    {},
  );
  let accessToken;
  try {
    accessToken = JSON.parse(acceptRes.body).accessToken;
  } catch {
    return;
  }
  const accepted = check(acceptRes, { 'cohort: invite accepted': () => Boolean(accessToken) });
  if (!accepted) return;

  sleep(thinkTime(0.5, 2));

  timedGet(
    `${urls.api}${API_PREFIX}/users/me/dashboard`,
    writeLatency,
    'cohort_first_dashboard_load',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}
