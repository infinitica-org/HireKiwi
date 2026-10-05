import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationsService } from './notifications.service.js';

type Row = { kind: string; channel: string; enabled: boolean };

/** In-memory notification_preferences for one user. */
function preferencesDb(initial: Row[] = []) {
  const rows = new Map(initial.map((r) => [`${r.kind}:${r.channel}`, r]));
  const prisma = {
    notificationPreference: {
      findMany: vi.fn(async ({ where }: { where: { kind?: string; enabled?: boolean } }) =>
        [...rows.values()].filter(
          (r) =>
            (where.kind === undefined || r.kind === where.kind) &&
            (where.enabled === undefined || r.enabled === where.enabled),
        ),
      ),
      upsert: vi.fn(async ({ create }: { create: Row }) => {
        rows.set(`${create.kind}:${create.channel}`, { ...create });
        return create;
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return { service: new NotificationPreferencesService(prisma as never), prisma, rows };
}

const find = (
  prefs: { kind: string; channel: string; enabled: boolean; mandatory: boolean }[],
  kind: string,
  channel: string,
) => prefs.find((p) => p.kind === kind && p.channel === channel);

describe('NotificationPreferencesService (S6-VV-121)', () => {
  it('reports every kind and channel, enabled unless the user turned it off', async () => {
    const { service } = preferencesDb([{ kind: 'OPPORTUNITY', channel: 'EMAIL', enabled: false }]);
    const { preferences } = await service.get('u-1');

    expect(preferences).toHaveLength(20);
    expect(find(preferences, 'OPPORTUNITY', 'EMAIL')?.enabled).toBe(false);
    expect(find(preferences, 'OPPORTUNITY', 'IN_APP')?.enabled).toBe(true);
    expect(find(preferences, 'ACCOUNT', 'EMAIL')).toMatchObject({ enabled: true, mandatory: true });
  });

  it('stores a change and returns the new matrix', async () => {
    const { service } = preferencesDb();
    const { preferences } = await service.update('u-1', {
      preferences: [{ kind: 'STAGE_CHANGE', channel: 'EMAIL', enabled: false }],
    });
    expect(find(preferences, 'STAGE_CHANGE', 'EMAIL')?.enabled).toBe(false);
  });

  it('refuses to turn off a mandatory kind and changes nothing', async () => {
    const { service, prisma } = preferencesDb();
    await expect(
      service.update('u-1', {
        preferences: [
          { kind: 'MESSAGE', channel: 'EMAIL', enabled: false },
          { kind: 'TRUST_ENFORCEMENT', channel: 'EMAIL', enabled: false },
        ],
      }),
    ).rejects.toMatchObject({ response: { error: 'notification_kind_mandatory' } });
    expect(prisma.notificationPreference.upsert).not.toHaveBeenCalled();
  });

  it('never mutes a mandatory kind, even with a stale stored row', async () => {
    const { service } = preferencesDb([{ kind: 'ACCOUNT', channel: 'EMAIL', enabled: false }]);
    expect((await service.mutedChannels('u-1', 'ACCOUNT')).size).toBe(0);
  });
});

describe('NotificationsService.notify with preferences (S6-VV-121)', () => {
  function setup(muted: string[]) {
    const prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: randomUUID(),
          ...data,
          readAt: data.readAt ?? null,
          createdAt: new Date(),
        })),
      },
    };
    const emailQueue = { add: vi.fn().mockResolvedValue(undefined) };
    const preferences = { mutedChannels: vi.fn().mockResolvedValue(new Set(muted)) };
    const service = new NotificationsService(
      prisma as never,
      emailQueue as never,
      preferences as never,
    );
    const send = () =>
      service.notify({
        userId: 'u-1',
        email: 'student@smart.local',
        kind: 'OPPORTUNITY',
        title: 'Shortlisted',
        body: 'You have been shortlisted.',
        emailTemplate: 'opportunity-shortlisted',
        emailData: {} as never,
      });
    return { prisma, emailQueue, send };
  }

  it('email off: writes the in-app notification and enqueues no email', async () => {
    const { prisma, emailQueue, send } = setup(['EMAIL']);
    const dto = await send();
    expect(prisma.notification.create).toHaveBeenCalledOnce();
    expect(dto.readAt).toBeNull();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('in-app off: keeps the history row but already read, and still emails', async () => {
    const { emailQueue, send } = setup(['IN_APP']);
    const dto = await send();
    expect(dto.readAt).not.toBeNull();
    expect(emailQueue.add).toHaveBeenCalledOnce();
  });

  it('nothing muted: unread in-app plus email, as before', async () => {
    const { emailQueue, send } = setup([]);
    expect((await send()).readAt).toBeNull();
    expect(emailQueue.add).toHaveBeenCalledOnce();
  });
});
