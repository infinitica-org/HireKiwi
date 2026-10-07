/**
 * S6-VV-131 (#586): named, individually-thresholded requests for every portal's "dashboard
 * home" read — admin, TPO roster and the company portal home. The student dashboard already
 * rides along in the main traffic mix (scenarios/api.js, as `dashboard_student`); these three
 * have no student-mix equivalent (different login, different role), so they get their own
 * small standalone scenario instead of inflating the shared mix with three extra logins per
 * iteration.
 *
 * Run alongside (or after) the main load test against the same target:
 *   k6 run src/scenarios/dashboards.js
 *
 * Thresholds come from config/thresholds.js buildDashboardThresholds() — the same
 * INTERACTIVE p95 < 500ms budget used for dashboard_student.
 */
import { sleep } from 'k6';
import {
  API_PREFIX,
  urls,
  adminCredentials,
  tpoCredentials,
  companyCredentials,
} from '../config/index.js';
import { buildDashboardThresholds } from '../config/thresholds.js';
import { login } from '../helpers/auth.js';
import { timedGet, authHeaders, thinkTime } from '../helpers/http.js';
import { apiLatency } from '../helpers/metrics.js';

export const options = {
  scenarios: {
    dashboards: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 20, duration: '30s' },
        { target: 20, duration: '2m' },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: buildDashboardThresholds(),
};

/** One VU in three, round-robin, so admin/TPO/company each get a steady share of load. */
function pickRole(vuId) {
  const roles = ['admin', 'tpo', 'company'];
  return roles[vuId % roles.length];
}

export default function () {
  const role = pickRole(__VU);

  if (role === 'admin') {
    const session = login(adminCredentials.username, adminCredentials.password);
    if (!session) return;
    const headers = authHeaders(session.accessToken);
    timedGet(`${urls.api}${API_PREFIX}/admin/dashboard`, apiLatency, 'dashboard_admin', {
      headers,
    });
  } else if (role === 'tpo') {
    const session = login(tpoCredentials.username, tpoCredentials.password);
    if (!session) return;
    const headers = authHeaders(session.accessToken);
    // The TPO portal's landing view is the student roster — there is no separate
    // "/tpo/dashboard" endpoint today.
    timedGet(`${urls.api}${API_PREFIX}/tpo/students`, apiLatency, 'dashboard_tpo_roster', {
      headers,
    });
  } else {
    const session = login(companyCredentials.username, companyCredentials.password);
    if (!session) return;
    const headers = authHeaders(session.accessToken);
    timedGet(`${urls.api}${API_PREFIX}/employer/company`, apiLatency, 'dashboard_company_home', {
      headers,
    });
  }

  sleep(thinkTime(1, 3));
}
