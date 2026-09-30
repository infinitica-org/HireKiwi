import { NotFoundException } from '@nestjs/common';
import { TextWriter, Uint8ArrayReader, ZipReader } from '@zip.js/zip.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectStorageKeys, DataExportService, exportPassword } from './data-export.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const requestId = '33333333-3333-4333-8333-333333333333';

function exportRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: requestId,
    userId,
    type: 'EXPORT',
    status: 'OPEN',
    details: '',
    createdAt: new Date(),
    resolvedAt: null,
    exportKey: null,
    ...overrides,
  };
}

describe('S6-VV-115 / S6-VV-152 data export', () => {
  let prisma: any;
  let storage: any;
  let audit: any;
  let notifications: any;
  let service: DataExportService;
  let objects: Map<string, Buffer>;

  const zipKey = `dsr-exports/${userId}/${requestId}.zip`;

  /** Opens the stored export the way the student would, with the password. */
  async function openZip(password = exportPassword(requestId)) {
    const bytes = new Uint8Array(objects.get(zipKey) as Buffer);
    const reader = new ZipReader(new Uint8ArrayReader(bytes));
    const entries = await reader.getEntries();
    const text = async (name: string) => {
      const entry = entries.find((e) => e.filename === name);
      if (!entry || entry.directory) throw new Error(`missing ${name}`);
      return entry.getData(new TextWriter(), { password });
    };
    return {
      names: entries.map((e) => e.filename),
      encrypted: entries.every((e) => e.encrypted),
      text,
      close: () => reader.close(),
    };
  }

  beforeEach(() => {
    objects = new Map([
      ['evidence/ada/cv.pdf', Buffer.from('%PDF cv')],
      ['we/ada/offer.pdf', Buffer.from('%PDF offer')],
      ['photos/ada.png', Buffer.from('png')],
      // we/ada/relieving.pdf is missing from storage on purpose
    ]);
    prisma = {
      dataSubjectRequest: {
        findUnique: vi.fn().mockResolvedValue(exportRequest()),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: userId,
          email: 'ada@uni.edu',
          evidenceRecords: [{ id: 'e1', storageKey: 'evidence/ada/cv.pdf' }],
          workExperiences: [
            { id: 'w1', supportingDocKeys: ['we/ada/offer.pdf', 'we/ada/relieving.pdf'] },
          ],
          candidateCertificates: [{ id: 'c1', certificateFileUrl: 'https://issuer.example/c1' }],
          profilePhotoObjectKey: 'photos/ada.png',
        }),
      },
    };
    storage = {
      putObjectBuffer: vi.fn(
        async ({ objectKey, buffer }: { objectKey: string; buffer: Buffer }) => {
          objects.set(objectKey, buffer);
        },
      ),
      getObjectBuffer: vi.fn(async (key: string) => {
        const found = objects.get(key);
        if (!found) throw new Error('NoSuchKey');
        return found;
      }),
      getSignedDownloadUrl: vi.fn(async (key: string) => `https://signed/${key}`),
    };
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    notifications = { notify: vi.fn().mockResolvedValue({}) };
    service = new DataExportService(prisma, storage, audit, notifications);
  });

  it("packs only the requester's own rows, without the password hash, into an encrypted ZIP", async () => {
    await service.build(requestId);

    const query = prisma.user.findUniqueOrThrow.mock.calls[0][0];
    expect(query.where).toEqual({ id: userId });
    expect(query.omit).toEqual({ passwordHash: true });
    expect(query.include).not.toHaveProperty('profileViewsReceived');
    expect(storage.putObjectBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ objectKey: zipKey, contentType: 'application/zip' }),
    );
    const zip = await openZip();
    expect(zip.encrypted).toBe(true);
    const bundle = JSON.parse(await zip.text('data.json'));
    expect(bundle.data.id).toBe(userId);
    expect(JSON.stringify(bundle)).not.toContain(otherUserId);
    await zip.close();
  });

  it('cannot be opened without the password', async () => {
    await service.build(requestId);
    const zip = await openZip('wrong-password');
    await expect(zip.text('data.json')).rejects.toThrow();
    await zip.close();
  });

  it('includes uploaded files, skips external URLs, and lists unreadable ones in README.txt', async () => {
    await service.build(requestId);

    const zip = await openZip();
    expect(zip.names.filter((n) => n.startsWith('files/')).sort()).toEqual(
      ['files/evidence/ada/cv.pdf', 'files/photos/ada.png', 'files/we/ada/offer.pdf'].sort(),
    );
    expect(await zip.text('files/we/ada/offer.pdf')).toBe('%PDF offer');
    expect(await zip.text('README.txt')).toContain('we/ada/relieving.pdf');
    const bundle = JSON.parse(await zip.text('data.json'));
    expect(bundle.files).not.toContain('https://issuer.example/c1');
    await zip.close();
  });

  it('completes the request, audits it and tells the student in-app', async () => {
    await service.build(requestId);

    expect(prisma.dataSubjectRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: expect.objectContaining({ status: 'COMPLETED', exportKey: zipKey }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'data_request.export_completed',
        resourceId: requestId,
        metadata: expect.objectContaining({ filesIncluded: 3, filesNotIncluded: 1 }),
      }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId, kind: 'ACCOUNT', dedupeKey: `dsr-export:${requestId}` }),
    );
    // The password is never emailed or put in a notification.
    expect(JSON.stringify(notifications.notify.mock.calls)).not.toContain(
      exportPassword(requestId),
    );
  });

  it('is idempotent: a redelivered job for a finished export does nothing', async () => {
    prisma.dataSubjectRequest.findUnique.mockResolvedValue(exportRequest({ status: 'COMPLETED' }));

    await service.build(requestId);

    expect(storage.putObjectBuffer).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('hands out the ZIP link with its password, and audits the download', async () => {
    await service.build(requestId);
    prisma.dataSubjectRequest.findFirst.mockResolvedValue(
      exportRequest({ status: 'COMPLETED', resolvedAt: new Date(), exportKey: zipKey }),
    );

    const result = await service.download(userId, requestId);

    expect(prisma.dataSubjectRequest.findFirst.mock.calls[0][0].where).toMatchObject({
      id: requestId,
      userId,
      type: 'EXPORT',
    });
    expect(result.bundleUrl).toBe(`https://signed/${zipKey}`);
    expect(result.files).toEqual([]);
    expect(result.password).toBe(exportPassword(requestId));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: userId, action: 'data_request.export_downloaded' }),
    );
  });

  it('still serves an older plain-JSON export with file links and no password', async () => {
    const legacyKey = `dsr-exports/${userId}/${requestId}.json`;
    objects.set(legacyKey, Buffer.from(JSON.stringify({ files: ['evidence/ada/cv.pdf'] })));
    prisma.dataSubjectRequest.findFirst.mockResolvedValue(
      exportRequest({ status: 'COMPLETED', resolvedAt: new Date(), exportKey: legacyKey }),
    );

    const result = await service.download(userId, requestId);

    expect(result.files).toEqual([
      { objectKey: 'evidence/ada/cv.pdf', url: 'https://signed/evidence/ada/cv.pdf' },
    ]);
    expect(result.password).toBeNull();
  });

  it("404s another user's export and one older than 7 days", async () => {
    prisma.dataSubjectRequest.findFirst.mockResolvedValue(null);
    await expect(service.download(otherUserId, requestId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.dataSubjectRequest.findFirst.mockResolvedValue(
      exportRequest({
        status: 'COMPLETED',
        resolvedAt: new Date(Date.now() - 8 * 86_400_000),
        exportKey: 'dsr-exports/x.zip',
      }),
    );
    await expect(service.download(userId, requestId)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('exportPassword', () => {
  it('is stable for a request, differs between requests, and has 96 bits', () => {
    const a = exportPassword(requestId);
    expect(exportPassword(requestId)).toBe(a);
    expect(exportPassword(otherUserId)).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{4}(-[0-9a-f]{4}){5}$/);
  });
});

describe('collectStorageKeys', () => {
  it('walks nested rows and de-duplicates', () => {
    expect(
      collectStorageKeys({
        a: [{ storageKey: 'k1' }, { documentObjectKey: 'k1' }],
        b: { logoStorageKey: 'k2' },
      }),
    ).toEqual(['k1', 'k2']);
  });
});
