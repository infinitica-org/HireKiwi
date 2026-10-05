'use client';

import { useEffect, useState } from 'react';
import { describeApiError } from '@hirekiwi/api-client';
import type { CompanyMember } from '@hirekiwi/contracts';
import { Button } from '@hirekiwi/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hirekiwi/ui/card';
import {
  AdminInput,
  DataTable,
  Field,
  InlineAlert,
  StatusBadge,
  TableCell,
  TableRow,
} from '@/components/admin-ui';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<CompanyMember['status'], string> = {
  ACTIVE: 'Active',
  INVITED: 'Invited',
  DEACTIVATED: 'Deactivated',
};

/**
 * S6-VV-109 (#167): the company's team, and the platform override that makes an active member an
 * owner when the only owner has left. Owners hand over among themselves in web-company.
 */
export function CompanyTeamCard({ companyId }: { companyId: string }) {
  const [members, setMembers] = useState<CompanyMember[] | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await api.onboarding.listCompanyMembers(companyId);
    setMembers(res.members);
  }

  useEffect(() => {
    load().catch((err) => setError(describeApiError(err, 'Could not load the team.')));
  }, [companyId]);

  async function makeOwner(member: CompanyMember) {
    setMessage(null);
    if (reason.trim().length < 8) {
      setError('Enter a reason of at least 8 characters before assigning an owner.');
      return;
    }
    if (!window.confirm(`Make ${member.fullName} an owner of this company?`)) return;
    setBusyId(member.id);
    setError(null);
    try {
      await api.onboarding.assignCompanyOwner(companyId, {
        memberId: member.id,
        reason: reason.trim(),
      });
      setReason('');
      setMessage(`${member.fullName} is now an owner.`);
      await load();
    } catch (err) {
      setError(describeApiError(err, 'Could not assign the owner.'));
    } finally {
      setBusyId(null);
    }
  }

  const activeOwners = members?.filter((m) => m.role === 'OWNER' && m.status === 'ACTIVE') ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team and ownership</CardTitle>
        <CardDescription>
          Use this only when the company has no owner who can still sign in. The change is audited.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <InlineAlert tone="danger" title={error} /> : null}
        {message ? <InlineAlert title={message} /> : null}
        {members && activeOwners.length === 0 ? (
          <InlineAlert tone="danger" title="This company has no active owner." />
        ) : null}
        <Field label="Reason for assigning an owner (required, 8+ characters)">
          <AdminInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Previous owner left; confirmed by email with HR"
          />
        </Field>
        {members === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <DataTable headers={['Member', 'Email', 'Role', 'Status', '']}>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.fullName}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role === 'OWNER' ? 'Owner' : 'Recruiter'}</TableCell>
                <TableCell>
                  <StatusBadge status={STATUS_LABELS[member.status]} />
                </TableCell>
                <TableCell className="text-right">
                  {member.role !== 'OWNER' && member.status === 'ACTIVE' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === member.id}
                      onClick={() => void makeOwner(member)}
                    >
                      Make owner
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}
