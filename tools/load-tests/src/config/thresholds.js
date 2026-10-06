/**
 * Per-category k6 thresholds, all configurable via env var. Separate
 * thresholds per traffic category on purpose — a global `http_req_duration`
 * threshold would let a slow write path hide behind a fast browsing average.
 *
 * Defaults mirror packages/contracts/src/http/routes.ts's LATENCY_BUDGET_MS
 * (CANDIDATE_CRITICAL=200ms, INTERACTIVE=500ms, REPORTING=1000ms) so a k6
 * threshold breach and an ARCHITECTURE.md SLA breach mean the same thing.
 */

function ms(name, fallback) {
  const raw = __ENV[name];
  return raw === undefined || raw === '' ? fallback : Number(raw);
}

export const THRESHOLD_VALUES = {
  httpFailedRate: ms('THRESHOLD_HTTP_FAILED_RATE', 0.01),
  frontendP95: ms('THRESHOLD_FRONTEND_P95_MS', 500),
  apiP95: ms('THRESHOLD_API_P95_MS', 500),
  apiP99: ms('THRESHOLD_API_P99_MS', 1000),
  businessFlowP95: ms('THRESHOLD_BUSINESS_FLOW_P95_MS', 1500),
  authP95: ms('THRESHOLD_AUTH_P95_MS', 200),
  searchP95: ms('THRESHOLD_SEARCH_P95_MS', 300),
  writesP95: ms('THRESHOLD_WRITES_P95_MS', 200),
  /** S6-VV-131 (#586): the "dashboard loads within budget" target is INTERACTIVE, same as apiP95. */
  dashboardP95: ms('THRESHOLD_DASHBOARD_P95_MS', 500),
};

/**
 * S6-VV-131 (#586): per-endpoint thresholds for the named dashboard reads, keyed on the
 * `name` tag every `timedGet`/`timedPost` call already sets — k6 scopes a threshold to a tag
 * with `metric{tag:value}` for free, no custom per-tag Trend needed. Student, admin, TPO and
 * company each have their own "dashboard" endpoint (see scenarios/api.js and
 * scenarios/dashboards.js); a slow query behind any one of them must not hide behind the
 * others' averages, so each gets its own threshold line instead of one aggregate.
 */
export const DASHBOARD_ENDPOINT_NAMES = [
  'dashboard_student',
  'dashboard_admin',
  'dashboard_tpo_roster',
  'dashboard_company_home',
];

export function buildDashboardThresholds(opts = {}) {
  const t = THRESHOLD_VALUES;
  const wrap = (exprs) =>
    opts.abortOnFail ? exprs.map((e) => ({ threshold: e, abortOnFail: true })) : exprs;
  const thresholds = {};
  for (const name of DASHBOARD_ENDPOINT_NAMES) {
    thresholds[`http_req_duration{name:${name}}`] = wrap([`p(95)<${t.dashboardP95}`]);
  }
  return thresholds;
}

/**
 * Full `thresholds` block for k6 `options`. Every custom Trend/Rate declared
 * in helpers/metrics.js gets its own line — never rely solely on the global
 * `http_req_duration`/`http_req_failed` k6 already tracks automatically.
 *
 * @param {{ abortOnFail?: boolean }} [opts] abortOnFail=true makes a breach
 *   stop the test immediately (used by smoke — "must fail fast", not after a
 *   30-minute baseline run finishes anyway).
 */
export function buildThresholds(opts = {}) {
  const t = THRESHOLD_VALUES;
  const wrap = (exprs) =>
    opts.abortOnFail ? exprs.map((e) => ({ threshold: e, abortOnFail: true })) : exprs;

  return {
    http_req_failed: wrap([`rate<${t.httpFailedRate}`]),
    frontend_latency: wrap([`p(95)<${t.frontendP95}`]),
    api_latency: wrap([`p(95)<${t.apiP95}`, `p(99)<${t.apiP99}`]),
    login_latency: wrap([`p(95)<${t.authP95}`]),
    search_latency: wrap([`p(95)<${t.searchP95}`]),
    write_latency: wrap([`p(95)<${t.writesP95}`]),
    business_flow_duration: wrap([`p(95)<${t.businessFlowP95}`]),
    business_flow_errors: wrap(['rate<0.02']),
    ...buildDashboardThresholds(opts),
  };
}
