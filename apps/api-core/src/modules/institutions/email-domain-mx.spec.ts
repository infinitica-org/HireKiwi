import { describe, expect, it, vi } from 'vitest';
import { assertEmailDomainReceivesMail } from './email-domain-mx.js';

const dnsError = (code: string) => Object.assign(new Error(code), { code });

describe('assertEmailDomainReceivesMail (S6-VV-155, #609)', () => {
  it('accepts a domain with a mail exchanger', async () => {
    const resolver = vi.fn().mockResolvedValue([{ exchange: 'mx.acme.com', priority: 10 }]);
    await expect(assertEmailDomainReceivesMail('hr@acme.com', resolver)).resolves.toBeUndefined();
    expect(resolver).toHaveBeenCalledWith('acme.com');
  });

  it.each([
    ['no such domain', () => Promise.reject(dnsError('ENOTFOUND'))],
    ['no MX records', () => Promise.reject(dnsError('ENODATA'))],
    ['a null MX (RFC 7505)', () => Promise.resolve([{ exchange: '.' }])],
    ['an empty answer', () => Promise.resolve([])],
  ])('refuses %s with 422 email_domain_unreachable', async (_label, answer) => {
    await expect(assertEmailDomainReceivesMail('hr@acme.con', vi.fn(answer))).rejects.toMatchObject(
      {
        status: 422,
        response: expect.objectContaining({ error: 'email_domain_unreachable' }),
      },
    );
  });

  it('fails open when DNS itself is failing', async () => {
    for (const code of ['ETIMEOUT', 'ESERVFAIL', 'ECONNREFUSED']) {
      await expect(
        assertEmailDomainReceivesMail('hr@acme.com', () => Promise.reject(dnsError(code))),
      ).resolves.toBeUndefined();
    }
  });

  it('skips reserved test domains outside production', async () => {
    const resolver = vi.fn();
    await assertEmailDomainReceivesMail('owner@acme.test', resolver);
    await assertEmailDomainReceivesMail('admin@hirekiwi.local', resolver);
    await assertEmailDomainReceivesMail('hr@e2e-1234.example.com', resolver);
    expect(resolver).not.toHaveBeenCalled();
  });
});
