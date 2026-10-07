import { describe, expect, it } from 'vitest';

import { renderEmailTemplate } from './email-templates.js';

const DATA = {
  fullName: 'Kristen Ann Smith',
  institutionName: 'Anna <University>',
  location: 'Chennai, India',
  email: 'kristen@anna.edu',
  phone: '+91 98765 43210',
  role: 'Placement Officer / TPO',
  message: 'We have 1200 students.',
  adminUrl: 'http://localhost:3003/admin/partnership-requests',
};

describe('partnership request emails', () => {
  it('thanks the sender with what they sent, branded as SMART', () => {
    const email = renderEmailTemplate('partnership-request-received', DATA);
    expect(email.subject).toContain('Anna <University>');
    expect(email.html).toContain('Partnership request received');
    expect(email.html).toContain('Kristen');
    expect(email.html).toContain('We have 1200 students.');
    expect(email.html).not.toContain('HireKiwi');
    expect(email.text).toContain('Phone: +91 98765 43210');
  });

  it('escapes free text so a form value cannot inject markup', () => {
    const email = renderEmailTemplate('partnership-request-admin-alert', DATA);
    expect(email.html).toContain('Anna &lt;University&gt;');
    expect(email.html).not.toContain('<University>');
  });

  it('alerts admins with the full details and a link to the admin page', () => {
    const email = renderEmailTemplate('partnership-request-admin-alert', DATA);
    expect(email.subject).toBe('New partnership request: Anna <University>');
    expect(email.html).toContain('kristen@anna.edu');
    expect(email.html).toContain('/admin/partnership-requests');
    expect(email.text).toContain('Open it in the admin portal: http://localhost:3003');
  });
});
