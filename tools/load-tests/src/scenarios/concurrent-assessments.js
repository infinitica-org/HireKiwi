/**
 * S6-VV-134 (#591): 500 candidates taking a skill-verify form at the same time — the real
 * concurrency shape of "everyone sits the exam in the same window", scoped to the surviving
 * assessment path.
 *
 * Deliberately targets `skill-verify` (POST /assessment/skill-claims -> .../verify/start ->
 * .../save -> .../complete), NOT the legacy `/assessment/start` -> `submit-l1` -> `complete`
 * chain that scenarios/business-flow.js and scenarios/cache-stampede.js exercise. That whole
 * Track/Level/Attempt chain is scheduled for removal by the cleanup plan's B2 tier; skill-verify
 * (ASM-01, claim-driven) is what actually ships. Confirmed with the project owner before
 * scoping this way (same reasoning as S6-VV-130's reference-data cache).
 *
 *   login -> declare a skill claim (POST /assessment/skill-claims)
 *         -> start verify (POST .../verify/start) -> N items, server-timed session
 *         -> every ~20s: save a partial draft (POST .../save) + a proctoring ping
 *            (POST /proctoring/ping — a lightweight stand-in for a snapshot upload; the real
 *            upload is a two-step signed-URL + object-storage PUT, out of scope for a load
 *            script measuring API-side concurrency, not storage throughput)
 *         -> complete (POST .../complete), called TWICE for a sample of VUs to check the
 *            "zero duplicate scores" requirement: a replayed complete must return the exact
 *            same grade, not re-score (idempotent settle, not a second scoring run).
 *
 * Run standalone:
 *   k6 run src/scenarios/concurrent-assessments.js
 *
 * Needs TEST_DATA_USERS >= CONCURRENT_VUS seeded accounts, each with a completed profile
 * (assertCompleteForSkillVerification gates /verify/start) — see db:seed:load-test.
 *
 * Watch smart_kafka_consumer_lag_messages and the VV-127 queue panels during the run and
 * record peak lag + drain time in tools/load-tests/CAPACITY_REPORT.md, per the ticket.
 */
import { sleep } from 'k6';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { API_PREFIX, urls } from '../config/index.js';
import { THRESHOLD_VALUES } from '../config/thresholds.js';
import { login } from '../helpers/auth.js';
import { authHeaders, timedPost } from '../helpers/http.js';
import { businessFlowDuration } from '../helpers/metrics.js';
import { pickUser } from '../helpers/data.js';

const CONCURRENT_VUS = Number(__ENV.CONCURRENT_VUS || '500');
const RAMP_DURATION = __ENV.CONCURRENT_RAMP_DURATION || '2m';
const SAVE_INTERVAL_SECONDS = Number(__ENV.CONCURRENT_SAVE_INTERVAL_SECONDS || '20');
const SAVE_COUNT = Number(__ENV.CONCURRENT_SAVE_COUNT || '3');
const DUPLICATE_CHECK_SAMPLE_PCT = Number(__ENV.CONCURRENT_DUPLICATE_CHECK_PCT || '10');
const SKILL_CODE = __ENV.CONCURRENT_SKILL_CODE || 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT';

const lostDrafts = new Counter('concurrent_assessments_lost_drafts');
const duplicateScores = new Counter('concurrent_assessments_duplicate_scores');

export const options = {
  scenarios: {
    concurrent_assessments: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [{ target: CONCURRENT_VUS, duration: RAMP_DURATION }],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // CANDIDATE_CRITICAL budget (packages/contracts/src/http/routes.ts) on both the draft
    // save and the answer submit — this is the one flow in the whole suite held to 200ms,
    // not the 500ms INTERACTIVE default.
    'http_req_duration{name:concurrent_save_draft}': [`p(95)<${THRESHOLD_VALUES.writesP95}`],
    'http_req_duration{name:concurrent_complete}': [`p(95)<${THRESHOLD_VALUES.writesP95}`],
    concurrent_assessments_lost_drafts: ['count==0'],
    concurrent_assessments_duplicate_scores: ['count==0'],
  },
};

function answerFor(item) {
  if (item.options) return { index: item.index, selectedKey: 'A' };
  return { index: item.index, text: 'Load-test answer.' };
}

export default function () {
  const user = pickUser(__VU);
  const session = login(user.email, user.password);
  if (!session) return;
  const headers = authHeaders(session.accessToken);

  const claimRes = timedPost(
    `${urls.api}${API_PREFIX}/assessment/skill-claims`,
    JSON.stringify({ skillCode: SKILL_CODE, proficiency: 'INTERMEDIATE' }),
    businessFlowDuration,
    'concurrent_declare_claim',
    { headers },
  );
  let claimId;
  try {
    claimId = JSON.parse(claimRes.body).claimId;
  } catch {
    return;
  }
  if (!claimId) return;

  const startRes = timedPost(
    `${urls.api}${API_PREFIX}/assessment/skill-claims/${claimId}/verify/start`,
    JSON.stringify({}),
    businessFlowDuration,
    'concurrent_start_verify',
    { headers },
  );
  let sessionBody;
  try {
    sessionBody = JSON.parse(startRes.body);
  } catch {
    return;
  }
  const sessionId = sessionBody.sessionId;
  const items = sessionBody.items;
  if (!sessionId || !items || items.length === 0) return;

  const responses = items.map(answerFor);

  for (let round = 0; round < SAVE_COUNT; round += 1) {
    sleep(SAVE_INTERVAL_SECONDS);

    const saveRes = timedPost(
      `${urls.api}${API_PREFIX}/assessment/skill-verify/${sessionId}/save`,
      JSON.stringify({ responses: responses.slice(0, round + 1) }),
      businessFlowDuration,
      'concurrent_save_draft',
      { headers },
    );
    const saved = check(saveRes, { 'concurrent: draft saved': (r) => r.status === 200 });
    if (!saved) lostDrafts.add(1);

    timedPost(
      `${urls.api}${API_PREFIX}/proctoring/ping`,
      JSON.stringify({ attemptId: sessionId }),
      businessFlowDuration,
      'concurrent_proctoring_ping',
      { headers },
    );
  }

  const completeRes = timedPost(
    `${urls.api}${API_PREFIX}/assessment/skill-verify/${sessionId}/complete`,
    JSON.stringify({ responses }),
    businessFlowDuration,
    'concurrent_complete',
    { headers },
  );
  check(completeRes, { 'concurrent: completed': (r) => r.status === 200 });

  // Zero-duplicate-scores check, on a sample: a replayed complete must settle to the exact
  // same grade, not re-score the claim a second time.
  if (Math.random() * 100 < DUPLICATE_CHECK_SAMPLE_PCT) {
    const replayRes = timedPost(
      `${urls.api}${API_PREFIX}/assessment/skill-verify/${sessionId}/complete`,
      JSON.stringify({ responses }),
      businessFlowDuration,
      'concurrent_complete_replay',
      { headers },
    );
    try {
      const first = JSON.parse(completeRes.body).grade;
      const replay = JSON.parse(replayRes.body).grade;
      if (JSON.stringify(first) !== JSON.stringify(replay)) {
        duplicateScores.add(1);
      }
    } catch {
      // Either call failed to parse — not a duplicate-scoring signal, leave uncounted.
    }
  }
}
