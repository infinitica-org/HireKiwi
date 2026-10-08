'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import {
  API_PREFIX,
  BatchImportMappingSchema,
  BatchImportResultDtoSchema,
  BulkWhitelistProgressDtoSchema,
  z,
  type BatchImportMapping,
  type BatchImportResultDto,
  type BulkWhitelistProgressDto,
} from '@hirekiwi/contracts';
import { Alert, Button } from '@hirekiwi/ui';
import { api, apiClient } from '../lib/api';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FIELDS = [
  { key: 'fullName', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'groupLabel', label: 'Group', required: false },
] as const;

type MappingState = Record<keyof BatchImportMapping, string>;
const EMPTY: MappingState = { fullName: '', email: '', groupLabel: '' };
const HINTS: Record<keyof MappingState, string[]> = {
  fullName: ['name', 'fullname', 'studentname', 'candidatename'],
  email: ['email', 'emailaddress', 'mail'],
  groupLabel: ['group', 'department', 'section', 'class', 'division'],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export function suggestBatchImportMapping(headers: string[]): MappingState {
  const find = (field: keyof MappingState) =>
    headers.find((header) => HINTS[field].includes(normalize(header))) ?? '';
  return { fullName: find('fullName'), email: find('email'), groupLabel: find('groupLabel') };
}

export function validateBatchImportFile(file: File): string | null {
  const extension = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1];
  if (!extension || !['csv', 'xlsx'].includes(extension)) {
    return 'Unsupported file type. Choose a CSV or XLSX file.';
  }
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'The selected file exceeds the 5 MB limit.';
  return null;
}

export function toBatchImportMapping(mapping: MappingState): BatchImportMapping {
  return BatchImportMappingSchema.parse({
    fullName: mapping.fullName,
    email: mapping.email,
    ...(mapping.groupLabel ? { groupLabel: mapping.groupLabel } : {}),
  });
}

function safeMessage(caught: unknown, fallback: string) {
  if (isHireKiwiApiError(caught)) return caught.message;
  if (caught instanceof Error) return caught.message;
  return fallback;
}

export function BatchImportWizard({
  batchId,
  onComplete,
  heading = 'Bulk candidate provisioning',
  autoSendInvites = false,
}: {
  batchId: string;
  onComplete?: () => void;
  heading?: string;
  /** When true, queue batch invitations immediately after a successful import. */
  autoSendInvites?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<MappingState>(EMPTY);
  const [busy, setBusy] = useState(false);
  // One key per "send" the TPO means: a double click emails the batch once (S6-VV-124).
  const sendKey = useRef(crypto.randomUUID());
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState<BatchImportMapping | null>(null);
  const [result, setResult] = useState<BatchImportResultDto | null>(null);
  const [inviteOk, setInviteOk] = useState(false);
  const [enqueued, setEnqueued] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);
  const [asyncProgress, setAsyncProgress] = useState<BulkWhitelistProgressDto | null>(null);
  const [, setAsyncPolling] = useState(false);

  const importPath = `${API_PREFIX}/tpo/batches/${batchId}/members/import`;
  const asyncImportPath = `${API_PREFIX}/tpo/batches/${batchId}/members/import-async`;

  function reset() {
    setFile(null);
    setHeaders([]);
    setMapping(EMPTY);
    setConfirmed(null);
    setResult(null);
    setInviteOk(false);
    setEnqueued(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function chooseFile(selectedFile: File) {
    const invalid = validateBatchImportFile(selectedFile);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    setConfirmed(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', selectedFile);
      const probe = await apiClient.postForm(importPath, body, {
        query: { dryRun: true },
        schema: BatchImportResultDtoSchema,
      });
      const detected = probe.headers ?? [];
      if (detected.length === 0) throw new Error('No column headers were found in row 1.');
      setFile(selectedFile);
      setHeaders(detected);
      setMapping(suggestBatchImportMapping(detected));
    } catch (caught) {
      setFile(null);
      setError(safeMessage(caught, 'The file could not be read.'));
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    setBusy(true);
    setError(null);
    try {
      const blob = await apiClient.getBlob(`${API_PREFIX}/tpo/batches/${batchId}/import-template`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hirekiwi-student-import-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('The import template could not be downloaded. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmAndImport() {
    if (!file || !mappingReady) return;
    const payload = toBatchImportMapping(mapping);
    setConfirmed(payload);
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('mapping', JSON.stringify(payload));
      const imported = await apiClient.postForm(importPath, body, {
        schema: BatchImportResultDtoSchema,
      });
      setResult(imported);
      setInviteOk(false);
      setEnqueued(null);
      onComplete?.();
      const pendingAfterImport = imported.pendingInvitations ?? 0;
      if (autoSendInvites && pendingAfterImport > 0) {
        try {
          setEnqueued((await api.onboarding.sendBatchInvites(batchId)).enqueued);
          setInviteOk(true);
          onComplete?.();
        } catch {
          setError('Import succeeded but invitation emails could not be queued.');
        }
      }
    } catch (caught) {
      setError(safeMessage(caught, 'Import could not be completed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function sendInvites() {
    const pending = result?.pendingInvitations ?? 0;
    if (!inviteOk || pending === 0) return;
    setBusy(true);
    setError(null);
    try {
      setEnqueued((await api.onboarding.sendBatchInvites(batchId, sendKey.current)).enqueued);
      sendKey.current = crypto.randomUUID();
      onComplete?.();
    } catch {
      setError('Invitations could not be queued. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const pollAsyncStatus = useCallback(
    async (jobId: string) => {
      setAsyncPolling(true);
      const poll = async () => {
        try {
          const status = await apiClient.get(
            `${API_PREFIX}/tpo/batches/${batchId}/members/import-status/${jobId}`,
            { schema: BulkWhitelistProgressDtoSchema },
          );
          setAsyncProgress(status);
          if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            setAsyncPolling(false);
            if (status.status === 'COMPLETED') {
              onComplete?.();
            } else {
              setError('Import failed. Please try again.');
            }
            return;
          }
          setTimeout(poll, 2000);
        } catch {
          setAsyncPolling(false);
          setError('Could not check import status. Please refresh the page.');
        }
      };
      await poll();
    },
    [batchId, onComplete],
  );

  async function confirmAndImportAsync() {
    if (!file || !mappingReady) return;
    const payload = toBatchImportMapping(mapping);
    setConfirmed(payload);
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('mapping', JSON.stringify(payload));
      const { jobId } = (await apiClient.postForm(asyncImportPath, body, {
        schema: z.object({ jobId: z.string() }),
      })) as { jobId: string };
      setAsyncJobId(jobId);
      await pollAsyncStatus(jobId);
    } catch (caught) {
      setError(safeMessage(caught, 'Async import could not be started. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function downloadErrorReport() {
    if (!asyncJobId) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = (await apiClient.get(
        `${API_PREFIX}/tpo/batches/${batchId}/members/import-errors/${asyncJobId}`,
        { schema: z.object({ url: z.string() }) },
      )) as { url: string };
      window.open(url, '_blank');
    } catch (caught) {
      setError(safeMessage(caught, 'Could not download error report.'));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      setAsyncPolling(false);
    };
  }, []);

  const selected = Object.values(mapping).filter(Boolean);
  const duplicate = new Set(selected).size !== selected.length;
  const mappingReady = Boolean(mapping.fullName && mapping.email && !duplicate);
  const zone = dragging
    ? 'border-zinc-950 bg-zinc-100/90'
    : 'border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-400';
  const pending = result?.pendingInvitations ?? 0;
  const step = !file ? 0 : result ? 2 : 1;

  return (
    <section className="space-y-5" aria-labelledby="bulk-provisioning-title">
      <h2 id="bulk-provisioning-title" className="text-xl font-bold text-zinc-950">
        {heading}
      </h2>
      <ol className="grid grid-cols-3 gap-1.5" aria-label="Provisioning progress">
        {['Upload', 'Map columns', 'Preview'].map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined}>
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= index ? 'bg-black' : 'bg-zinc-200'
              }`}
            />
          </li>
        ))}
      </ol>
      <div aria-live="polite" aria-atomic="true">
        {busy ? <p className="text-xs font-semibold text-zinc-500">Processing securely…</p> : null}
        {error ? <Alert tone="danger" title={error} role="alert" /> : null}
      </div>
      {file || result ? null : (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="sr-only"
            aria-label="Choose candidate CSV or XLSX file"
            disabled={busy}
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) void chooseFile(next);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const next = event.dataTransfer.files[0];
              if (next && !busy) void chooseFile(next);
            }}
            className={`group relative min-h-48 w-full overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-60 ${zone}`}
          >
            <span
              aria-hidden="true"
              className="motion-safe:animate-pulse absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-950 to-transparent"
            />
            <span className="block text-base font-bold text-zinc-950">
              {dragging ? 'Drop the file to continue' : 'Drop a roster here or browse'}
            </span>
            <span className="mt-1.5 block text-xs font-medium text-zinc-500">
              CSV or XLSX · maximum 5 MB · row 1 must contain headers
            </span>
          </button>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void downloadTemplate()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-black hover:underline"
            >
              Download XLSX template
            </button>
          </div>
        </div>
      )}
      {file && !result ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            Map uploaded columns
          </h3>
          <div className="mt-4 space-y-4">
            <p className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-muted)] p-3 text-sm text-ink">
              Selected file: <span className="font-medium">{file.name}</span>
              <span className="text-ink-muted">
                {' '}
                · {file.size} bytes · {file.name.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'CSV'}
              </span>
            </p>
            <p className="text-sm text-ink-muted">Detected headers: {headers.join(', ')}</p>
            {FIELDS.map((field) => (
              <div
                key={field.key}
                className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-center"
              >
                <label htmlFor={`mapping-${field.key}`} className="text-sm font-medium text-ink">
                  {field.label}
                  {field.required ? <span aria-hidden="true"> *</span> : ' (optional)'}
                </label>
                <select
                  id={`mapping-${field.key}`}
                  value={mapping[field.key]}
                  aria-required={field.required}
                  disabled={busy}
                  onChange={(event) => {
                    setConfirmed(null);
                    setMapping((current) => ({ ...current, [field.key]: event.target.value }));
                  }}
                  className="h-10 rounded-md border border-zinc-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="">Do not import</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {duplicate ? (
              <Alert
                tone="danger"
                title="Each HireKiwi field must use a different uploaded column."
                role="alert"
              />
            ) : null}
            {!mapping.fullName || !mapping.email ? (
              <p className="text-xs font-medium text-zinc-500" role="status">
                Map both Full Name and Email to continue.
              </p>
            ) : null}
            {confirmed && !result ? (
              <p className="text-xs font-medium text-zinc-800" role="status">
                {`Mapping payload ready: fullName=${confirmed.fullName}; email=${confirmed.email}${
                  confirmed.groupLabel ? `; groupLabel=${confirmed.groupLabel}` : ''
                }`}
              </p>
            ) : null}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="h-9 rounded-md border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
              >
                Replace file
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!mappingReady || busy}
                  onClick={() => void confirmAndImportAsync()}
                  className="h-9 inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  Background import
                </button>
                <button
                  type="button"
                  disabled={!mappingReady || busy}
                  onClick={() => void confirmAndImport()}
                  className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-black px-5 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Confirm mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {result ? (
        <ImportOutcome
          result={result}
          pending={pending}
          inviteOk={inviteOk}
          enqueued={enqueued}
          busy={busy}
          onInviteOk={setInviteOk}
          onSend={() => void sendInvites()}
          onReset={reset}
        />
      ) : null}
      {asyncProgress ? (
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-ink">
            Import progress
          </h3>
          <div className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">
                {asyncProgress.status === 'COMPLETED'
                  ? 'Import completed'
                  : asyncProgress.status === 'FAILED'
                    ? 'Import failed'
                    : 'Processing…'}
              </span>
              <span className="text-ink-muted">
                {asyncProgress.processedRows}/{asyncProgress.totalRows} rows
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{
                  width: `${asyncProgress.totalRows > 0 ? Math.round((asyncProgress.processedRows / asyncProgress.totalRows) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-emerald-700">{asyncProgress.validRows}</p>
                <p className="text-xs text-zinc-500">Valid</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-rose-700">{asyncProgress.invalidRows}</p>
                <p className="text-xs text-zinc-500">Invalid</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-blue-700">{asyncProgress.importedRows}</p>
                <p className="text-xs text-zinc-500">Imported</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-zinc-700">{asyncProgress.totalRows}</p>
                <p className="text-xs text-zinc-500">Total</p>
              </div>
            </div>
            {asyncProgress.status === 'COMPLETED' && asyncProgress.invalidRows > 0 ? (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void downloadErrorReport()}
                  disabled={busy}
                >
                  Download Import-Errors-Report.xlsx
                </Button>
              </div>
            ) : null}
            {asyncProgress.status === 'COMPLETED' ? (
              <div className="mt-4">
                <Button variant="ghost" onClick={reset} disabled={busy}>
                  Import another file
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ImportOutcome({
  result,
  pending,
  inviteOk,
  enqueued,
  busy,
  onInviteOk,
  onSend,
  onReset,
}: {
  result: BatchImportResultDto;
  pending: number;
  inviteOk: boolean;
  enqueued: number | null;
  busy: boolean;
  onInviteOk: (value: boolean) => void;
  onSend: () => void;
  onReset: () => void;
}) {
  const empty = result.imported === 0 && (result.validRows ?? 0) === 0;
  const partial = result.imported > 0 && result.errors.length > 0;
  const counts = [
    ['Valid', result.validRows ?? 0],
    ['Invalid', result.invalidRows ?? 0],
    ['Existing students', result.existingStudents ?? 0],
    ['New accounts', result.newAccounts ?? 0],
    ['Pending invitations', pending],
    ['Imported', result.imported],
  ] as const;
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold tracking-tight text-ink">Data preview</h3>
      {empty ? <Alert tone="info" title="No candidates were imported from this file." /> : null}
      {partial ? (
        <Alert tone="warning" title="Some rows imported successfully. Review the errors below." />
      ) : null}
      {!empty && result.errors.length === 0 ? (
        <Alert tone="success" title="Import completed. Review invitation sending below." />
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Import summary">
        {counts.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-3"
          >
            <p className="text-xl font-semibold text-accent">{value}</p>
            <p className="text-xs text-ink-muted">{label}</p>
          </div>
        ))}
      </div>
      {result.errors.length ? <ErrorTable errors={result.errors} /> : null}
      {enqueued === null ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <h4 className="font-heading text-base font-semibold text-ink">Invitation preview</h4>
          <p className="mt-2 text-sm text-ink-muted">
            This batch currently has {pending} pending invitation{pending === 1 ? '' : 's'}. Sending
            queues every pending invitation for this batch, including invitations that were already
            pending before this upload. Expected emails to queue: {pending}.
          </p>
          {pending > 0 ? (
            <label className="mt-4 flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={inviteOk}
                onChange={(event) => onInviteOk(event.target.checked)}
                className="mt-1 accent-accent"
              />
              <span>
                I confirm that HireKiwi should queue {pending} invitation emails for this batch.
              </span>
            </label>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">There are no pending invitations to send.</p>
          )}
          <div className="mt-4">
            <Button disabled={pending === 0 || !inviteOk || busy} isLoading={busy} onClick={onSend}>
              Send {pending} invitations
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-card)]"
          role="status"
        >
          <span
            aria-hidden="true"
            className="motion-safe:animate-pulse mx-auto grid size-12 place-items-center rounded-full bg-accent text-lg text-ink"
          >
            ✓
          </span>
          <p className="mt-3 text-lg font-semibold text-ink">
            {enqueued} invitation{enqueued === 1 ? '' : 's'} queued successfully
          </p>
        </div>
      )}
      <Button variant="ghost" onClick={onReset} disabled={busy}>
        Replace file
      </Button>
    </div>
  );
}

function ErrorTable({ errors }: { errors: BatchImportResultDto['errors'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[32rem] w-full text-sm" aria-label="Rows requiring attention">
        <caption className="pb-2 text-left font-medium text-ink">
          {errors.length} row{errors.length === 1 ? '' : 's'} requiring attention
        </caption>
        <thead>
          <tr className="text-left text-ink-muted">
            <th scope="col" className="border-b p-2">
              Row
            </th>
            <th scope="col" className="border-b p-2">
              Email
            </th>
            <th scope="col" className="border-b p-2">
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {errors.map((item) => (
            <tr
              key={`${item.row}-${item.email ?? ''}`}
              className="border-b border-[var(--surface-border)]"
            >
              <td className="p-2 font-mono text-xs">{item.row}</td>
              <td className="p-2">{item.email || '—'}</td>
              <td className="p-2">{item.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
