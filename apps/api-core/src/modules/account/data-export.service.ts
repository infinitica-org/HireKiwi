import { createHmac } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { DataExportDownload } from '@hirekiwi/contracts';
import {
  TextReader,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipWriter,
  configure as configureZip,
} from '@zip.js/zip.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { env } from '../../platform/config/env.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

/** How long a finished export bundle can be downloaded (the object itself is swept later). */
export const EXPORT_AVAILABLE_DAYS = 7;
/** Matches StorageService's signed-URL lifetime. */
const LINK_TTL_SECONDS = 15 * 60;
/** Uploaded files go inside the ZIP up to this total; past it they are listed in README.txt. */
export const EXPORT_ZIP_MAX_FILE_BYTES = 100 * 1024 * 1024;

// Node has no web workers; zip.js compresses and encrypts on the main thread of the job worker.
configureZip({ useWebWorkers: false });

/**
 * S6-VV-152 (#621): the ZIP password. Derived, not stored: HMAC of the request id under the server
 * secret, so the database never holds it and the student gets it only through the authenticated
 * download call. 96 bits, shown as six groups of four hex characters.
 */
export function exportPassword(requestId: string): string {
  const hex = createHmac('sha256', env.JWT_SECRET)
    .update(`dsr-export-password:${requestId}`)
    .digest('hex')
    .slice(0, 24);
  return hex.match(/.{4}/g)?.join('-') ?? hex;
}

/**
 * The student's own records. Rows that mainly describe other people (profile views by employers,
 * reviews they received, trust cases opened by admins) are left out.
 */
export const STUDENT_OWNED = {
  attempts: true,
  certificates: true,
  placements: true,
  savedJobs: true,
  hiddenJobs: true,
  skillClaims: true,
  projects: true,
  applications: true,
  notifications: true,
  workExperiences: true,
  candidateCertificates: true,
  candidateEducations: true,
  candidateLanguages: true,
  evidenceRecords: true,
  professionalCredentials: true,
  studentCapabilities: true,
  dataSubjectRequests: true,
  sentMessages: true,
  cognitiveProfile: true,
  communicationProfile: true,
  evidenceProfile: true,
  trustAppeals: true,
} as const;

/** Field names that hold a key in our object storage (full URLs are external and skipped). */
const STORAGE_KEY_FIELD =
  /^(storageKey|\w*ObjectKey|\w*StorageKey|supportingDocKeys|\w*[fF]ileUrl)$/;

/**
 * S6-VV-115 (#554) — builds a student's data export: every student-owned row as JSON, plus the
 * files they uploaded. S6-VV-152 (#621): packaged as one AES-256 encrypted ZIP (`data.json`,
 * `files/…`, `README.txt`); the password comes only from the authenticated download call.
 */
@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  /** Idempotent: a redelivered job for a finished request does nothing. */
  async build(requestId: string): Promise<void> {
    const request = await this.prisma.dataSubjectRequest.findUnique({ where: { id: requestId } });
    if (!request || request.type !== 'EXPORT' || request.status === 'COMPLETED') return;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.userId },
      omit: { passwordHash: true },
      include: STUDENT_OWNED,
    });
    const files = collectStorageKeys(user);
    const bundle = {
      exportedAt: new Date().toISOString(),
      requestId,
      data: user,
      files,
    };
    const { zip, included, notIncluded } = await this.buildZip(requestId, bundle, files);
    const exportKey = `dsr-exports/${request.userId}/${requestId}.zip`;
    await this.storage.putObjectBuffer({
      objectKey: exportKey,
      buffer: Buffer.from(zip),
      contentType: 'application/zip',
    });

    await this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED', resolvedAt: new Date(), exportKey },
    });
    await this.auditPublisher.record({
      actorId: null,
      action: 'data_request.export_completed',
      resourceType: 'data_subject_request',
      resourceId: requestId,
      reasonCode: null,
      metadata: {
        userId: request.userId,
        fileCount: files.length,
        filesIncluded: included,
        filesNotIncluded: notIncluded.length,
        format: 'zip-aes256',
      },
    });
    await this.notifications.notify({
      userId: request.userId,
      kind: 'ACCOUNT',
      title: 'Your data export is ready',
      body: `Download it from Settings within ${EXPORT_AVAILABLE_DAYS} days.`,
      linkUrl: `${env.STUDENT_APP_URL}/settings`,
      dedupeKey: `dsr-export:${requestId}`,
    });
    this.logger.log(
      `Data export ${requestId} ready (${included}/${files.length} files in the ZIP)`,
    );
  }

  private async buildZip(
    requestId: string,
    bundle: unknown,
    files: string[],
  ): Promise<{ zip: Uint8Array; included: number; notIncluded: string[] }> {
    const writer = new ZipWriter(new Uint8ArrayWriter(), {
      password: exportPassword(requestId),
      encryptionStrength: 3, // AES-256
    });
    await writer.add('data.json', new TextReader(JSON.stringify(bundle, jsonReplacer, 2)));
    let bytes = 0;
    let included = 0;
    const notIncluded: string[] = [];
    for (const objectKey of files) {
      const buffer = await this.storage.getObjectBuffer(objectKey).catch(() => null);
      if (!buffer || bytes + buffer.length > EXPORT_ZIP_MAX_FILE_BYTES) {
        notIncluded.push(objectKey);
        continue;
      }
      bytes += buffer.length;
      included += 1;
      await writer.add(`files/${objectKey}`, new Uint8ArrayReader(new Uint8Array(buffer)));
    }
    await writer.add('README.txt', new TextReader(exportReadme(notIncluded)));
    return { zip: await writer.close(), included, notIncluded };
  }

  async download(userId: string, requestId: string): Promise<DataExportDownload> {
    const request = await this.prisma.dataSubjectRequest.findFirst({
      where: { id: requestId, userId, type: 'EXPORT', status: 'COMPLETED' },
    });
    const until = exportAvailableUntil(request);
    if (!request?.exportKey || !until || until.getTime() < Date.now()) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'This export is not available. Request a new one from Settings.',
        statusCode: 404,
      });
    }
    const isZip = request.exportKey.endsWith('.zip');
    // Exports built before S6-VV-152 are plain JSON with the files handed out as links.
    const legacyFiles = isZip
      ? []
      : ((
          JSON.parse((await this.storage.getObjectBuffer(request.exportKey)).toString()) as {
            files?: string[];
          }
        ).files ?? []);
    const files = await Promise.all(
      legacyFiles.map(async (objectKey) => ({
        objectKey,
        url: await this.storage.getSignedDownloadUrl(objectKey),
      })),
    );
    await this.auditPublisher.record({
      actorId: userId,
      action: 'data_request.export_downloaded',
      resourceType: 'data_subject_request',
      resourceId: requestId,
      reasonCode: null,
    });
    return {
      bundleUrl: await this.storage.getSignedDownloadUrl(request.exportKey),
      files,
      linksExpireInSeconds: LINK_TTL_SECONDS,
      password: isZip ? exportPassword(requestId) : null,
    };
  }
}

export function exportAvailableUntil(
  request: { type: string; status: string; resolvedAt: Date | null } | null,
): Date | null {
  if (!request || request.type !== 'EXPORT' || request.status !== 'COMPLETED') return null;
  if (!request.resolvedAt) return null;
  return new Date(request.resolvedAt.getTime() + EXPORT_AVAILABLE_DAYS * 86_400_000);
}

/** Every storage key anywhere in the export, once. */
export function collectStorageKeys(value: unknown, found = new Set<string>()): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStorageKeys(item, found));
  } else if (value && typeof value === 'object' && !(value instanceof Date)) {
    for (const [key, child] of Object.entries(value)) {
      if (STORAGE_KEY_FIELD.test(key)) {
        for (const candidate of Array.isArray(child) ? child : [child]) {
          if (typeof candidate === 'string' && candidate && !/^https?:\/\//.test(candidate)) {
            found.add(candidate);
          }
        }
      } else {
        collectStorageKeys(child, found);
      }
    }
  }
  return [...found];
}

function exportReadme(notIncluded: string[]): string {
  const lines = [
    'Your SMART data export',
    '',
    'data.json  every record we hold about you (profile, claims, assessment attempts, certificates,',
    '           applications, messages you sent, and your data requests).',
    'files/     the files you uploaded, in the same folders we store them in.',
  ];
  if (notIncluded.length > 0) {
    lines.push(
      '',
      'These files were too large to include or could not be read. Ask support for a copy:',
      ...notIncluded.map((key) => `  ${key}`),
    );
  }
  return `${lines.join('\n')}\n`;
}

function jsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
