import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import {
  BULK_WHITELIST_IMPORT_DLQ,
  BULK_WHITELIST_IMPORT_QUEUE,
} from '../../platform/queue/queue.names.js';
import { InstitutionsService } from './institutions.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';

export interface BulkWhitelistJobData {
  jobId: string;
  batchId: string;
  institutionId: string;
  fileBuffer: string;
  fileName: string;
  mimeType: string;
  mapping?: {
    fullName: string;
    email: string;
    groupLabel?: string;
  };
  actorId: string;
}

export interface BulkWhitelistJobResult {
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  errorReportKey: string | null;
}

@Processor(BULK_WHITELIST_IMPORT_QUEUE)
export class BulkWhitelistImportProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkWhitelistImportProcessor.name);

  constructor(
    @Inject(InstitutionsService) private readonly institutions: InstitutionsService,
    @Inject(StorageService) private readonly storage: StorageService,
    @InjectQueue(BULK_WHITELIST_IMPORT_DLQ) private readonly dlq: Queue,
  ) {
    super();
  }

  async process(
    job: Job<BulkWhitelistJobData, BulkWhitelistJobResult>,
  ): Promise<BulkWhitelistJobResult> {
    const { jobId, batchId, institutionId, fileBuffer, fileName, mimeType, mapping, actorId } =
      job.data;
    this.logger.log(`Processing bulk whitelist import job ${jobId} for batch ${batchId}`);

    try {
      const buffer = Buffer.from(fileBuffer, 'base64');
      const sheet = await this.institutions.readImportSheet(buffer, fileName, mimeType);
      const headers = this.institutions.readImportHeaders(sheet);
      const resolvedMapping =
        mapping ??
        this.institutions.suggestImportMapping(headers) ??
        this.institutions.positionalMapping(headers);

      if (!resolvedMapping) {
        throw new Error('Could not determine column mapping from file headers.');
      }

      const parsed = await this.institutions.parseImportRows(sheet, resolvedMapping, institutionId);
      await job.updateProgress(50);

      const result = await this.institutions.importBatchMembers(
        batchId,
        institutionId,
        buffer,
        fileName,
        mimeType,
        actorId,
        resolvedMapping,
      );

      let errorReportKey: string | null = null;
      if (result.errors.length > 0) {
        const errorBuffer = await this.institutions.buildErrorReport(result.errors, headers);
        errorReportKey = `import-errors/${institutionId}/${jobId}/Import-Errors-Report.xlsx`;
        await this.storage.upload({
          buffer: errorBuffer,
          namespace: 'import-errors',
          fileName: 'Import-Errors-Report.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }

      await job.updateProgress(100);

      const jobResult: BulkWhitelistJobResult = {
        jobId,
        totalRows: result.totalRows ?? parsed.rows.length,
        validRows: result.validRows ?? parsed.rows.filter((r) => r.valid).length,
        invalidRows: result.invalidRows ?? result.errors.length,
        importedRows: result.imported,
        errorReportKey,
      };

      this.logger.log(
        `Bulk whitelist import job ${jobId} completed: ${jobResult.importedRows} imported, ${jobResult.invalidRows} errors`,
      );

      return jobResult;
    } catch (error) {
      this.logger.error(
        `Bulk whitelist import job ${jobId} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    if (!job) return;
    if (job.attemptsMade < 5) return;
    void this.dlq.add('dead', {
      originalQueue: BULK_WHITELIST_IMPORT_QUEUE,
      originalJobId: job.id,
      data: job.data,
      error: error.message,
    });
  }
}
