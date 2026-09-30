import { test, expect } from '@playwright/test';
import { e2eEnv } from '../helpers/env.js';
import {
  createWorkExperience,
  deleteWorkExperience,
  getOpsDashboard,
  getVerificationByToken,
  listWorkExperiences,
  login,
  restartVerification,
  sendManagerEndorsement,
  sendVerification,
} from '../helpers/api.js';
import { waitForManagerSurveyUrl, waitForVerificationUrl } from '../helpers/mailpit.js';
import { signInViaAuthApp } from '../helpers/auth.js';

test.describe.configure({ mode: 'serial' });

test.describe('Work experience verification (S6-VB-01)', () => {
  let verifierEmail = '';
  const companyWebsite = 'https://acme.com';
  const companyLinkedinUrl = 'https://linkedin.com/company/acme';

  let studentToken = '';
  let experienceId = '';
  let verifyUrl = '';
  let companyName = '';

  test.afterAll(async ({ request }) => {
    if (studentToken && experienceId) {
      await deleteWorkExperience(request, studentToken, experienceId).catch(() => undefined);
    }
  });

  test('student creates claim and dispatches employer verification', async ({ request }) => {
    const session = await login(request, e2eEnv.studentEmail, e2eEnv.password);
    studentToken = session.accessToken;
    companyName = `Acme E2E ${Date.now()}`;
    verifierEmail = `e2e-manager-${Date.now()}@acme.com`;

    const created = await createWorkExperience(request, studentToken, {
      companyName,
      role: 'Software Engineer',
      companyWebsite,
      companyLinkedinUrl,
      verifierEmail,
    });
    experienceId = created.id;
    expect(created.status).toBe('SUBMITTED');

    const sent = await sendVerification(request, studentToken, experienceId);
    expect(sent.status).toBe('PENDING_EMPLOYER');

    verifyUrl = await waitForVerificationUrl(request, verifierEmail, {
      mustInclude: companyName,
    });
    expect(verifyUrl).toContain('/work-experience/');
  });

  test('TPO ops dashboard shows pending verification before employer response', async ({
    request,
  }) => {
    const tpoSession = await login(request, e2eEnv.tpoEmail, e2eEnv.password);
    const rows = await getOpsDashboard(request, tpoSession.accessToken);
    const row = rows.find((item) => item.experienceId === experienceId);

    expect(row).toBeDefined();
    expect(row?.status).toBe('PENDING_EMPLOYER');
    expect(row?.companyName).toBe(companyName);
    expect(row?.nextAction).toMatch(/Awaiting employer response/i);
  });

  test('employer confirms claim on web-verify', async ({ page, request }) => {
    await page.goto(verifyUrl);
    await expect(
      page.getByRole('heading', { name: /Work Experience Verification Request/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Confirm fully/i }).click();
    await page.getByRole('button', { name: /Submit verification response/i }).click();

    await expect(page.getByText(/successfully verified|Response already recorded/i)).toBeVisible();

    const token = verifyUrl.split('/work-experience/')[1] ?? '';
    const refreshed = await getVerificationByToken(request, token);
    expect(refreshed.status).toBe('VERIFIED');
    expect(refreshed.isExpired).toBe(false);
  });

  test('TPO ops dashboard reflects verified status', async ({ page, request }) => {
    const tpoSession = await login(request, e2eEnv.tpoEmail, e2eEnv.password);
    const rows = await getOpsDashboard(request, tpoSession.accessToken);
    const row = rows.find((item) => item.experienceId === experienceId);

    expect(row?.status).toBe('VERIFIED');
    expect(row?.nextAction).toMatch(/fully verified/i);

    await signInViaAuthApp(
      page,
      e2eEnv.tpoEmail,
      e2eEnv.password,
      `${e2eEnv.tpoAppUrl}/work-experience-verification`,
    );
    await expect(
      page.getByRole('heading', { name: /Work Experience Verification/i }),
    ).toBeVisible();
    await expect(page.getByText(companyName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('VERIFIED', { exact: true }).first()).toBeVisible();
  });

  test('student profile shows verified work experience', async ({ page, request }) => {
    const experiences = await listWorkExperiences(request, studentToken);
    const row = experiences.find((item) => item.id === experienceId);
    expect(row?.status).toBe('VERIFIED');

    await signInViaAuthApp(
      page,
      e2eEnv.studentEmail,
      e2eEnv.password,
      `${e2eEnv.studentAppUrl}/profile?section=experience`,
    );
    const expTab = page.getByRole('button', { name: 'Work Experience' });
    if (await expTab.isVisible()) {
      await expTab.click();
    }
    await expect(page.getByRole('heading', { name: /Work Experience/i })).toBeVisible();
    await expect(page.getByText(companyName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/VERIFIED|Verified/i).first()).toBeVisible();
  });
});

test.describe('Work experience verification — failure modes', () => {
  test('invalid employer token shows error state', async ({ page }) => {
    await page.goto(`${e2eEnv.verifyAppUrl}/work-experience/invalid-token-for-e2e`);
    await expect(page.getByRole('heading', { name: /Verification Link Invalid/i })).toBeVisible();
  });

  test('PARTIAL decision requires comments', async ({ page }) => {
    await page.goto(`${e2eEnv.verifyAppUrl}/work-experience/preview-token-not-used`);
    await page.route('**/api/v1/users/work-experiences/verify-token/**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            experienceId: '00000000-0000-4000-8000-000000000001',
            candidateName: 'Jane Candidate',
            companyName: 'Acme Corp',
            role: 'Engineer',
            employmentType: 'FULL_TIME',
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            responsibilities: 'Built APIs',
            verifierName: 'Manager',
            verifierEmail: 'manager@acme.com',
            verifierDesignation: 'Lead',
            status: 'PENDING_EMPLOYER',
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
            isExpired: false,
            isAlreadyResponded: false,
          }),
        });
        return;
      }
      await route.continue();
    });

    await expect(
      page.getByRole('heading', { name: /Work Experience Verification Request/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Partially confirm/i }).click();
    await page.getByRole('button', { name: /Submit verification response/i }).click();
    await expect(page.getByText(/Comments of at least 8 characters are required/i)).toBeVisible();
  });

  test('NEED_CLARIFICATION decision requires comments', async ({ page }) => {
    await page.goto(`${e2eEnv.verifyAppUrl}/work-experience/preview-token-not-used`);
    await page.route('**/api/v1/users/work-experiences/verify-token/**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            experienceId: '00000000-0000-4000-8000-000000000002',
            candidateName: 'Jane Candidate',
            companyName: 'Acme Corp',
            role: 'Engineer',
            employmentType: 'FULL_TIME',
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            responsibilities: 'Built APIs',
            verifierName: 'Manager',
            verifierEmail: 'manager@acme.com',
            verifierDesignation: 'Lead',
            status: 'PENDING_EMPLOYER',
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
            isExpired: false,
            isAlreadyResponded: false,
          }),
        });
        return;
      }
      await route.continue();
    });

    await expect(
      page.getByRole('heading', { name: /Work Experience Verification Request/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Need clarification/i }).click();
    await page.getByRole('button', { name: /Submit verification response/i }).click();
    await expect(page.getByText(/Comments of at least 8 characters are required/i)).toBeVisible();
  });
});

test.describe('Work experience verification — rejection and restart flow', () => {
  let studentToken = '';
  let rejectExpId = '';
  let companyName = '';
  let verifierEmail = '';
  let verifyUrl = '';

  test.afterAll(async ({ request }) => {
    if (studentToken && rejectExpId) {
      await deleteWorkExperience(request, studentToken, rejectExpId).catch(() => undefined);
    }
  });

  test('employer rejects claim and candidate restarts verification', async ({ page, request }) => {
    const session = await login(request, e2eEnv.studentEmail, e2eEnv.password);
    studentToken = session.accessToken;
    companyName = `Reject Acme E2E ${Date.now()}`;
    verifierEmail = `e2e-reject-manager-${Date.now()}@acme.com`;

    const created = await createWorkExperience(request, studentToken, {
      companyName,
      role: 'Backend Engineer',
      companyWebsite: 'https://acme.com',
      companyLinkedinUrl: 'https://linkedin.com/company/acme',
      verifierEmail,
    });
    rejectExpId = created.id;

    await sendVerification(request, studentToken, rejectExpId);
    verifyUrl = await waitForVerificationUrl(request, verifierEmail, {
      mustInclude: companyName,
    });

    await page.goto(verifyUrl);
    await expect(
      page.getByRole('heading', { name: /Work Experience Verification Request/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Cannot confirm/i }).click();
    await page.locator('textarea').fill('Candidate did not work at our organization.');
    await page.getByRole('button', { name: /Submit verification response/i }).click();
    await expect(
      page.getByText(/Work experience rejected|Response already recorded/i),
    ).toBeVisible();

    const token = verifyUrl.split('/work-experience/')[1] ?? '';
    const statusAfterReject = await getVerificationByToken(request, token);
    expect(statusAfterReject.status).toBe('REJECTED');

    // Candidate restarts verification
    const restartResult = await restartVerification(request, studentToken, rejectExpId);
    expect(restartResult.status).toBe('PENDING_EMPLOYER');

    // A new verification email is dispatched
    const newVerifyUrl = await waitForVerificationUrl(request, verifierEmail, {
      mustInclude: companyName,
      notUrl: verifyUrl,
    });
    expect(newVerifyUrl).toContain('/work-experience/');
    expect(newVerifyUrl).not.toBe(verifyUrl);
  });
});

test.describe('Work experience manager endorsement (WE-T03)', () => {
  let studentToken = '';
  let surveyExpId = '';
  let companyName = '';
  let managerEmail = '';

  test.afterAll(async ({ request }) => {
    if (studentToken && surveyExpId) {
      await deleteWorkExperience(request, studentToken, surveyExpId).catch(() => undefined);
    }
  });

  test('manager endorses work experience via magic link survey', async ({ page, request }) => {
    const session = await login(request, e2eEnv.studentEmail, e2eEnv.password);
    studentToken = session.accessToken;
    companyName = `Survey Acme E2E ${Date.now()}`;
    managerEmail = `e2e-manager-endorse-${Date.now()}@acme.com`;

    const created = await createWorkExperience(request, studentToken, {
      companyName,
      role: 'Full Stack Engineer',
      companyWebsite: 'https://acme.com',
      companyLinkedinUrl: 'https://linkedin.com/company/acme',
      verifierEmail: managerEmail,
    });
    surveyExpId = created.id;

    // Send manager endorsement
    const endorseResult = await sendManagerEndorsement(request, studentToken, surveyExpId, {
      managerEmail,
      managerName: 'Alex Manager',
      managerDesignation: 'Engineering Lead',
      skillsToRate: ['PYTHON_APPLICATION_BACKEND_DEVELOPMENT'],
    });
    expect(endorseResult.success).toBe(true);
    expect(endorseResult.endorsementId).toBeTruthy();

    const surveyUrl = await waitForManagerSurveyUrl(request, managerEmail, {
      mustInclude: companyName,
    });
    expect(surveyUrl).toContain('/work-experience/manager-survey/');

    await page.goto(surveyUrl);
    await expect(page.getByRole('heading', { name: /Manager Endorsement Request/i })).toBeVisible();
    await page.getByRole('button', { name: /Confirm & Endorse Claim/i }).click();

    await expect(page.getByText(/endorsement has been recorded|already recorded/i)).toBeVisible();
  });
});
