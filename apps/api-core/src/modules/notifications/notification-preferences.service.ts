import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MANDATORY_NOTIFICATION_KINDS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_KINDS,
  type NotificationChannel,
  type NotificationKind,
  type NotificationPreferencesResponse,
  type UpdateNotificationPreferencesRequest,
} from '@hirekiwi/contracts';
import { PrismaService } from '../../platform/prisma/prisma.service.js';

const isMandatory = (kind: NotificationKind) => MANDATORY_NOTIFICATION_KINDS.includes(kind);

/**
 * S6-VV-121 (#434): per-kind, per-channel opt-outs. Only changed channels are stored; no row
 * means enabled, so a new notification kind is on for everyone without a backfill.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<NotificationPreferencesResponse> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { userId } });
    const stored = new Map(rows.map((row) => [`${row.kind}:${row.channel}`, row.enabled]));
    return {
      preferences: NOTIFICATION_KINDS.flatMap((kind) =>
        NOTIFICATION_CHANNELS.map((channel) => {
          const mandatory = isMandatory(kind);
          return {
            kind,
            channel,
            mandatory,
            enabled: mandatory || (stored.get(`${kind}:${channel}`) ?? true),
          };
        }),
      ),
    };
  }

  async update(
    userId: string,
    body: UpdateNotificationPreferencesRequest,
  ): Promise<NotificationPreferencesResponse> {
    const locked = body.preferences.find((p) => isMandatory(p.kind) && !p.enabled);
    if (locked) {
      throw new BadRequestException({
        error: 'notification_kind_mandatory',
        message: `${locked.kind} notifications can't be turned off: they carry account and safety notices.`,
        statusCode: 400,
      });
    }
    await this.prisma.$transaction(
      body.preferences
        .filter((p) => !isMandatory(p.kind))
        .map(({ kind, channel, enabled }) =>
          this.prisma.notificationPreference.upsert({
            where: { userId_kind_channel: { userId, kind, channel } },
            create: { userId, kind, channel, enabled },
            update: { enabled },
          }),
        ),
    );
    return this.get(userId);
  }

  /** Channels this user turned off for `kind`; always empty for mandatory kinds. */
  async mutedChannels(userId: string, kind: NotificationKind): Promise<Set<NotificationChannel>> {
    if (isMandatory(kind)) return new Set();
    const rows = await this.prisma.notificationPreference.findMany({
      where: { userId, kind, enabled: false },
      select: { channel: true },
    });
    return new Set(rows.map((row) => row.channel));
  }
}
