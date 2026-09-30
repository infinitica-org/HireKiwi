'use client';

import { useEffect, useState } from 'react';
import { Bot, Cpu, ShieldAlert, CheckCircle, Edit3, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  DataTable,
  PageStack,
  TableCell,
  TableRow,
  AdminInput,
  NativeSelect,
  Field,
  controlButtonClassName,
} from '@/components/admin-ui';
import { Button } from '@smart/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smart/ui/card';
import { api } from '@/lib/api';

const PROFICIENCY_OPTIONS = [
  'BEGINNER',
  'INTERMEDIATE',
  'PROFICIENT',
  'ADVANCED',
  'PROFESSIONAL',
] as const;

interface RegisteredPrompt {
  promptRef: string;
  purpose: string;
  modelRole: string;
  temperature: number;
  status: 'ACTIVE' | 'DISABLED';
}

interface AuditLog {
  id: string;
  promptRef: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  createdAt: string;
}

interface AdverseImpactGroup {
  group: string;
  totalAssessed: number;
  clearedCount: number;
  selectionRate: number;
  impactRatio: number;
  adverseImpactDetected: boolean;
}

interface CapabilityReviewItem {
  capabilityId: string;
  studentId: string;
  skillCode: string | null;
  capabilityLabel: string;
  proficiency: string;
  confidenceScore: number;
  modelVersion: string;
  inferredAt: string;
}

export default function AiGovernanceAdminPage() {
  const [prompts, setPrompts] = useState<RegisteredPrompt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [capabilityQueue, setCapabilityQueue] = useState<CapabilityReviewItem[]>([]);
  const [adverseGroups, setAdverseGroups] = useState<AdverseImpactGroup[]>([]);
  const [fourFifthsRuleMet, setFourFifthsRuleMet] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [promptRes, auditRes, adverseRes, capRes] = await Promise.all([
          api.evaluation.listRegisteredPrompts(),
          api.evaluation.listAiAuditLogs(),
          api.evaluation.getAdverseImpact(),
          api.evaluation.listCapabilityReviewQueue(20).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setPrompts(promptRes.prompts);
        setCapabilityQueue(capRes.items);
        setAuditLogs(
          auditRes.logs.map((log) => ({
            id: log.id,
            promptRef: log.promptRef,
            provider: log.provider,
            model: log.model,
            promptTokens: log.promptTokens,
            completionTokens: log.completionTokens,
            latencyMs: log.latencyMs,
            estimatedCostUsd: log.estimatedCostUsd,
            createdAt: log.createdAt,
          })),
        );
        setAdverseGroups(adverseRes.groupRates);
        setFourFifthsRuleMet(adverseRes.fourFifthsRuleMet);
      } catch {
        if (!cancelled) {
          setStatusMessage('Could not load AI governance data from the backend.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedReviewItem, setSelectedReviewItem] = useState<CapabilityReviewItem | null>(null);
  const [reviewProficiency, setReviewProficiency] = useState<string>('');
  const [reviewConfidence, setReviewConfidence] = useState<string>('0.75');
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function reloadCapabilityQueue() {
    try {
      const res = await api.evaluation.listCapabilityReviewQueue(20);
      setCapabilityQueue(res.items);
    } catch {
      // ignore
    }
  }

  function openReview(item: CapabilityReviewItem) {
    setSelectedReviewItem(item);
    setReviewProficiency(item.proficiency);
    setReviewConfidence('0.75');
    setReviewerNote('');
    setReviewError(null);
  }

  async function handleSubmitReview() {
    if (!selectedReviewItem) return;
    if (!reviewerNote.trim() || reviewerNote.trim().length < 5) {
      setReviewError('Reviewer rationale note must be at least 5 characters.');
      return;
    }

    const conf = parseFloat(reviewConfidence);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      setReviewError('Confidence score must be a number between 0 and 1.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await api.evaluation.correctCapability(selectedReviewItem.capabilityId, {
        proficiency: reviewProficiency as (typeof PROFICIENCY_OPTIONS)[number],
        confidenceScore: conf,
        reviewerNote: reviewerNote.trim(),
      });
      setStatusMessage(
        `Capability "${selectedReviewItem.capabilityLabel}" successfully reviewed and adjudicated.`,
      );
      setSelectedReviewItem(null);
      await reloadCapabilityQueue();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : 'Failed to submit capability correction.',
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleToggleModel(
    provider: 'ANTHROPIC' | 'GOOGLE' | 'OPENROUTER',
    model: string,
    currentActive: boolean,
  ) {
    setToggling(true);
    try {
      await api.evaluation.toggleModelVersion({
        provider,
        model,
        active: !currentActive,
        reason: currentActive
          ? 'Disabled via Super Admin AI Governance console'
          : 'Restored by Super Admin',
      });
      setStatusMessage(
        currentActive
          ? `Model ${model} (${provider}) has been disabled via circuit breaker.`
          : `Model ${model} (${provider}) has been restored.`,
      );
    } catch {
      setStatusMessage(`Failed to toggle model version ${model} on backend.`);
    } finally {
      setToggling(false);
    }
  }

  return (
    <PageStack>
      <PageHeader
        title="Responsible AI Governance & Audit"
        description="Versioned prompt registry, LLM call audit trail, and targeted model version controls (I560, I562, I567)."
      />

      {statusMessage && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          {statusMessage}
        </div>
      )}

      {/* Model Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="size-4 text-blue-600" /> Active Model Deployments
            </CardTitle>
            <CardDescription className="text-xs">
              Disable a faulty or drifting model version without taking down the full provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2 text-xs">
              <div>
                <span className="font-semibold text-zinc-900 block">gemini-1.5-pro</span>
                <span className="text-zinc-500 font-mono text-[11px]">Provider: GOOGLE</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={toggling}
                onClick={() => handleToggleModel('GOOGLE', 'gemini-1.5-pro', true)}
              >
                Disable Model
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-zinc-900 block">
                  claude-3-5-sonnet-20241022
                </span>
                <span className="text-zinc-500 font-mono text-[11px]">Provider: ANTHROPIC</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={toggling}
                onClick={() => handleToggleModel('ANTHROPIC', 'claude-3-5-sonnet', true)}
              >
                Disable Model
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4 text-emerald-600" /> Responsible AI Guardrails
            </CardTitle>
            <CardDescription className="text-xs">
              Enforced across all inference gateways and proctoring sidecars.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600 shrink-0" />
              <span>Emotion & personality inference strictly prohibited in CV streams (I565)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600 shrink-0" />
              <span>
                Prompt citation constraint active: strictly stored evidence IDs only (I321)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600 shrink-0" />
              <span>
                Human hiring decision gate enforced on all match & candidate readouts (I568)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Versioned Prompts Registry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bot className="size-4 text-zinc-700" /> Versioned Prompts Registry (I560)
          </CardTitle>
          <CardDescription className="text-xs">
            Immutable prompt templates cited in audit records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable headers={['Prompt Ref', 'Purpose', 'Role', 'Temperature', 'Status']}>
            {prompts.map((p) => (
              <TableRow key={p.promptRef}>
                <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                  {p.promptRef}
                </TableCell>
                <TableCell className="text-xs text-zinc-600 max-w-md">{p.purpose}</TableCell>
                <TableCell className="text-xs text-zinc-700">{p.modelRole}</TableCell>
                <TableCell className="text-xs font-mono">{p.temperature}</TableCell>
                <TableCell>
                  <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                    {p.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </CardContent>
      </Card>

      {/* Low-Confidence Capability Review Queue (I563) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-600" /> Low-Confidence Capability Review Queue
            (I563)
          </CardTitle>
          <CardDescription className="text-xs">
            Review and adjudicate inferred candidate capabilities scoring below the 0.55 confidence
            threshold before publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capabilityQueue.length > 0 ? (
            <DataTable
              headers={[
                'Capability ID',
                'Student',
                'Skill / Label',
                'Proficiency',
                'Confidence',
                'Model Version',
                'Action',
              ]}
            >
              {capabilityQueue.map((item) => (
                <TableRow key={item.capabilityId}>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {item.capabilityId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-700">
                    {item.studentId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-semibold text-zinc-900 block">
                      {item.capabilityLabel}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {item.skillCode || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-800">
                    {item.proficiency}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold">
                      {(item.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-500">
                    {item.modelVersion}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReview(item)}
                      className="h-7 text-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="size-3" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          ) : (
            <p className="text-xs text-zinc-500">
              No low-confidence capability inferences awaiting review.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Adjudication Modal for Low-Confidence Decisions (I563) */}
      {selectedReviewItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-md border border-zinc-200/90 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-zinc-950 dark:text-zinc-100">
                  Adjudicate Low-Confidence Capability Inference
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Verify evidence or correct proficiency/confidence before publishing this
                  capability to the candidate profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewItem(null)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {reviewError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                  {reviewError}
                </div>
              )}

              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 space-y-1">
                <div>
                  <span className="font-semibold text-zinc-700">Capability: </span>
                  <span className="text-zinc-900 font-medium">
                    {selectedReviewItem.capabilityLabel}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700">Skill Code: </span>
                  <span className="font-mono text-zinc-800">
                    {selectedReviewItem.skillCode || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700">Inferred Confidence: </span>
                  <span className="font-mono text-amber-700 font-bold">
                    {(selectedReviewItem.confidenceScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <Field label="Proficiency Level">
                <NativeSelect
                  value={reviewProficiency}
                  onChange={(e) => setReviewProficiency(e.target.value)}
                >
                  {PROFICIENCY_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Adjusted Confidence Score (0.00 - 1.00)">
                <AdminInput
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={reviewConfidence}
                  onChange={(e) => setReviewConfidence(e.target.value)}
                  placeholder="0.75"
                />
              </Field>

              <Field label="Reviewer Rationale Note (Required, min 5 chars)">
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-zinc-300 bg-white p-2 text-xs text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="e.g. Validated project repository artifact commits and interview transcript."
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReviewItem(null)}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <button
                type="button"
                className={controlButtonClassName}
                onClick={() => void handleSubmitReview()}
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Approve & Save Correction'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI Evaluation Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">AI Evaluation Audit Log (I562)</CardTitle>
          <CardDescription className="text-xs">
            Persistent audit trail of tokens, model executions, and response identifiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={[
              'Audit ID',
              'Prompt Ref',
              'Provider / Model',
              'Tokens (In/Out)',
              'Latency',
              'Cost',
            ]}
          >
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-zinc-500">
                  {log.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-mono text-xs font-medium text-zinc-800">
                  {log.promptRef}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="font-semibold text-zinc-900">{log.model}</span>
                  <span className="block text-[11px] text-zinc-500 font-mono">{log.provider}</span>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {log.promptTokens} / {log.completionTokens}
                </TableCell>
                <TableCell className="text-xs font-mono">{log.latencyMs} ms</TableCell>
                <TableCell className="text-xs font-mono text-zinc-700">
                  ${log.estimatedCostUsd.toFixed(5)}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </CardContent>
      </Card>
      {/* Adverse Impact / Bias Testing Pipeline (I566) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="size-4 text-emerald-600" /> Adverse Impact & 4/5ths Rule
            Pipeline (I566)
          </CardTitle>
          <CardDescription className="text-xs">
            Automated monitoring of assessment clearance rates against EEOC 4/5ths rule (80% impact
            threshold).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Rule Status
              </span>
              <span
                className={[
                  'mt-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold',
                  fourFifthsRuleMet
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800',
                ].join(' ')}
              >
                <CheckCircle className="size-3.5" />
                {fourFifthsRuleMet ? '4/5ths Rule Compliant' : 'Adverse Impact Detected'}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Lowest Impact Ratio
              </span>
              <span className="mt-1 text-sm font-bold text-zinc-900 font-mono">
                {adverseGroups.length > 0
                  ? Math.min(...adverseGroups.map((g) => g.impactRatio)).toFixed(2)
                  : '1.00'}
              </span>
              <span className="text-[11px] text-zinc-500 block">Threshold: &ge; 0.80</span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Groups Evaluated
              </span>
              <span className="mt-1 text-sm font-semibold text-zinc-900">
                {adverseGroups.length}
              </span>
              <span className="text-[11px] text-zinc-500 block">Selection-rate cohorts</span>
            </div>
          </div>

          {adverseGroups.length > 0 ? (
            <DataTable
              headers={['Group', 'Assessed', 'Cleared', 'Selection rate', 'Impact ratio', 'Status']}
            >
              {adverseGroups.map((group) => (
                <TableRow key={group.group}>
                  <TableCell className="text-xs font-medium text-zinc-800">{group.group}</TableCell>
                  <TableCell className="text-xs font-mono">{group.totalAssessed}</TableCell>
                  <TableCell className="text-xs font-mono">{group.clearedCount}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {(group.selectionRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {group.impactRatio.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={[
                        'rounded px-2 py-0.5 text-[10px] font-bold',
                        group.adverseImpactDetected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800',
                      ].join(' ')}
                    >
                      {group.adverseImpactDetected ? 'Adverse' : 'Compliant'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          ) : (
            <p className="text-xs text-zinc-500">
              {loading
                ? 'Loading adverse-impact report…'
                : 'No assessment attempts recorded for the baseline cohort yet.'}
            </p>
          )}

          <div className="rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
            <p className="font-semibold text-zinc-900 mb-1">Adverse Impact Methodology:</p>
            <p>
              Selection rate is evaluated as the proportion of candidates clearing skill
              verification attempts without technical failure. Per privacy-by-design guidelines,
              sensitive demographic data is never gathered or stored on candidate profiles; bias
              monitoring is continuously executed on cohort clearance baseline rates.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageStack>
  );
}
