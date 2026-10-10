import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseraAdapter, parseCourseraPage } from './coursera.adapter.js';
import { HackerRankAdapter, parseHackerRankPage } from './hackerrank.adapter.js';
import { NptelAdapter } from './nptel.adapter.js';
import { safeFetch } from '../safe-fetch.util.js';
import type { CredentialInput, CredentialVerifier } from '../types.js';

vi.mock('../safe-fetch.util.js', () => ({
  safeFetch: vi.fn(),
  UnsafeUrlError: class UnsafeUrlError extends Error {},
}));

/*
 * Fixtures are trimmed from live public pages (2026-10-10) with the holder's name replaced: only
 * the parts each adapter reads are kept, in the same shape and order the page serves them.
 */

const COURSERA_CODE = 'JJ6KNU4CKGFZ';
function courseraPage(code = COURSERA_CODE, profile = true): string {
  const signature = profile
    ? '{"__typename":"AccomplishmentsSignatureTrackProfile","firstName":"Test","lastName":"Learner","middleName":null}'
    : '';
  return `<html><head><meta data-rh="true" property="og:title" content="Completion Certificate for Introduction to Front-End Development"/></head>
<body><script>window.__APOLLO_STATE__={"ROOT_QUERY":{"MembershipsV1Resource({\\"code\\":\\"${code}\\"})":{"linked@type({\\"name\\":\\"LinkedAccomplishmentData\\"})":{"signatureTrackProfilesV1@type({\\"name\\":\\"AccomplishmentsSignatureTrackProfile\\"})":[${signature}],"vcMembershipsV1@type({\\"name\\":\\"AccomplishmentsVCMembership\\"})":[{"__typename":"AccomplishmentsVCMembership","certificateCode":"${code}","grade@type({\\"name\\":\\"AccomplishmentsVCGrade\\"})":{"__typename":"AccomplishmentsVCGrade","distinctionLevel":"NORMAL","score":0.99},"grantedAt":1676387254568}]}}}};</script></body></html>`;
}

const HACKERRANK_ID = '188709874733';
function hackerRankPage(record: Record<string, unknown> = {}): string {
  const state = {
    app: { clientInitialLoading: false },
    community: {
      skillsVerification: {
        certificates: {
          [HACKERRANK_ID]: {
            status: 'test_passed',
            username: 'test_learner',
            certificates: ['C (Intermediate)'],
            hacker_name: 'Test Learner',
            kind: 'awarded',
            completed_at: null,
            type: 'skill',
            certificateId: HACKERRANK_ID,
            ...record,
          },
        },
      },
    },
  };
  return `<html><body><script type="application/json" id="initialData">
  ${encodeURIComponent(JSON.stringify(state))}
</script></body></html>`;
}

const NPTEL_ROLL = 'NPTEL21GE15S4336322203133020';

function respond(status: number, text: string) {
  return { status, ok: status >= 200 && status < 300, text, finalUrl: 'https://example.test' };
}

async function run(
  adapter: CredentialVerifier,
  value: string,
  type: CredentialInput['type'] = 'URL',
) {
  const input = { type, value };
  return adapter.verify(await adapter.normalize(input));
}

afterEach(() => vi.mocked(safeFetch).mockReset());

describe('CourseraAdapter', () => {
  const adapter = new CourseraAdapter();

  it.each([
    `https://coursera.org/verify/${COURSERA_CODE}`,
    `https://www.coursera.org/account/accomplishments/verify/${COURSERA_CODE.toLowerCase()}`,
  ])('claims %s', (value) => {
    expect(adapter.canHandle({ type: 'URL', value })).toBe(true);
  });

  it('leaves unchecked link shapes (specializations) and other hosts alone', () => {
    expect(
      adapter.canHandle({
        type: 'URL',
        value: `https://www.coursera.org/account/accomplishments/specialization/${COURSERA_CODE}`,
      }),
    ).toBe(false);
    expect(
      adapter.canHandle({ type: 'URL', value: `https://evil.test/verify/${COURSERA_CODE}` }),
    ).toBe(false);
  });

  it('reads course, learner and grant date for the requested code', () => {
    expect(parseCourseraPage(courseraPage(), COURSERA_CODE)).toEqual({
      courseName: 'Introduction to Front-End Development',
      learnerName: 'Test Learner',
      grantedAt: '2023-02-14T15:07:34.568Z',
    });
  });

  it('verifies via the canonical page and reports the learner as subject', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(200, courseraPage()));
    const result = await run(adapter, `https://coursera.org/verify/${COURSERA_CODE}`);
    expect(vi.mocked(safeFetch).mock.calls[0]?.[0]).toBe(
      `https://www.coursera.org/account/accomplishments/verify/${COURSERA_CODE}`,
    );
    expect(result.status).toBe('VERIFIED');
    expect(result.subjectName).toBe('Test Learner');
    expect(result.details?.achievementName).toBe('Introduction to Front-End Development');
  });

  it('is UNVERIFIABLE (never an auto-reject) when the page lacks a record for the code', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(200, courseraPage('OTHERCODE123')));
    expect((await run(adapter, `https://coursera.org/verify/${COURSERA_CODE}`)).status).toBe(
      'UNVERIFIABLE',
    );
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(200, courseraPage(COURSERA_CODE, false)));
    expect((await run(adapter, `https://coursera.org/verify/${COURSERA_CODE}`)).status).toBe(
      'UNVERIFIABLE',
    );
  });
});

describe('HackerRankAdapter', () => {
  const adapter = new HackerRankAdapter();

  it('reads the record for the requested certificate id', () => {
    expect(parseHackerRankPage(hackerRankPage(), HACKERRANK_ID)).toEqual({
      status: 'test_passed',
      skills: ['C (Intermediate)'],
      holderName: 'Test Learner',
      completedAt: null,
    });
    expect(parseHackerRankPage(hackerRankPage(), '45bb6644925c')).toBeNull();
  });

  it('verifies a passed certificate and reports the printed name', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(200, hackerRankPage()));
    const result = await run(adapter, `https://www.hackerrank.com/certificates/${HACKERRANK_ID}`);
    expect(result.status).toBe('VERIFIED');
    expect(result.subjectName).toBe('Test Learner');
    expect(result.details?.achievementName).toBe('C (Intermediate) certificate');
  });

  it('is INVALID when the record is not a passed test', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(
      respond(200, hackerRankPage({ status: 'test_failed' })),
    );
    expect(
      (await run(adapter, `https://hackerrank.com/certificates/${HACKERRANK_ID}`)).status,
    ).toBe('INVALID');
  });

  it('is NOT_FOUND on a 404', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(404, ''));
    expect(
      (await run(adapter, `https://hackerrank.com/certificates/${HACKERRANK_ID}`)).status,
    ).toBe('NOT_FOUND');
  });
});

describe('NptelAdapter', () => {
  const adapter = new NptelAdapter();
  const lookupUrl = `https://archive.nptel.ac.in/noc/Ecertificate/?q=${NPTEL_ROLL}`;

  it.each([
    [`https://nptel.ac.in/noc/E_Certificate/${NPTEL_ROLL}`, 'URL'],
    [lookupUrl, 'QR_CODE'],
    [NPTEL_ROLL, 'ISSUER_AND_ID'],
  ] as const)('claims %s (%s)', (value, type) => {
    expect(adapter.canHandle({ type, value })).toBe(true);
  });

  it('confirms existence from the certificate image but never names the subject', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(
      respond(200, '<center><img src="data:image/jpg;base64,/9j/4AAQ" /></center>'),
    );
    const result = await run(adapter, `https://nptel.ac.in/noc/E_Certificate/${NPTEL_ROLL}`);
    expect(vi.mocked(safeFetch).mock.calls[0]?.[0]).toBe(lookupUrl);
    expect(result.status).toBe('VERIFIED');
    expect(result.verificationLevel).toBe('ISSUER_RECORD_MATCH');
    expect(result.subjectName).toBeNull();
  });

  it("is NOT_FOUND on NPTEL's own no-certificate answer", async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(
      respond(
        200,
        ' <h2><center>Sorry you dont have a Certificate!.Please contact support@nptel.iitm.ac.in</center></h2>',
      ),
    );
    expect((await run(adapter, NPTEL_ROLL, 'ISSUER_AND_ID')).status).toBe('NOT_FOUND');
  });
});
