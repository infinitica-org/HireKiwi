import { resolveMx } from 'node:dns/promises';
import { UnprocessableEntityException } from '@nestjs/common';
import { env } from '../../platform/config/env.js';

/** RFC 2606/6761 names used by local seeds and e2e fixtures (never valid on the real internet). */
const RESERVED_SUFFIXES = [
  '.test',
  '.local',
  '.localhost',
  '.example',
  '.invalid',
  'example.com',
  'example.net',
  'example.org',
];

/** DNS answers that prove the domain has no mail exchanger; anything else is a lookup failure. */
const NO_MAIL_CODES = new Set(['ENOTFOUND', 'ENODATA']);

const LOOKUP_TIMEOUT_MS = 3_000;

type MxResolver = (domain: string) => Promise<{ exchange: string }[]>;

/**
 * S6-VV-155 (#609): a corporate email must be on a domain that can receive mail. Checked before an
 * onboarding session starts, so a typo like `acme.con` is caught at once instead of after the
 * verification code silently never arrives.
 *
 * Fails open: a DNS timeout or server error lets the signup continue (the emailed code still
 * proves the mailbox). Only a definite "no MX" answer (or a null MX, RFC 7505) is refused.
 */
export async function assertEmailDomainReceivesMail(
  email: string,
  resolver: MxResolver = resolveMx,
): Promise<void> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return;
  if (env.NODE_ENV !== 'production' && RESERVED_SUFFIXES.some((s) => domain.endsWith(s))) return;

  let records: { exchange: string }[];
  let timer: NodeJS.Timeout | undefined;
  try {
    records = await Promise.race([
      resolver(domain),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })),
          LOOKUP_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    if (!NO_MAIL_CODES.has((error as { code?: string }).code ?? '')) return;
    records = [];
  } finally {
    clearTimeout(timer);
  }
  const accepting = records.filter((record) => record.exchange && record.exchange !== '.');
  if (accepting.length === 0) {
    throw new UnprocessableEntityException({
      error: 'email_domain_unreachable',
      message: `We can't deliver email to ${domain}. Check the spelling of your work email.`,
      statusCode: 422,
    });
  }
}
