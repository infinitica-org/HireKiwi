'use client';

import type { AdminCutScoreDto, AdminItemDto } from '@hirekiwi/contracts';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { Award, FileQuestion, Send } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@hirekiwi/ui/button';
import { Badge } from '@hirekiwi/ui/badge';
import { PageHeader } from '@/components/page-header';
import {
  AdminInput,
  DataTable,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  InlineAlert,
  NativeSelect,
  PageStack,
  TableCell,
  TableRow,
} from '@/components/admin-ui';
import { api } from '@/lib/api';

export default function AssessmentItemsPage() {
  const params = useParams<{ id: string }>();
  const levelId = params.id;
  const [items, setItems] = useState<AdminItemDto[]>([]);
  const [cutScores, setCutScores] = useState<AdminCutScoreDto[]>([]);
  const [competencies, setCompetencies] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Item creation form
  const [form, setForm] = useState({
    competencyId: '',
    itemType: 'MCQ_SINGLE',
    stem: '',
    modelAnswer: '',
    optionA: '',
    optionB: '',
    correctOption: 'A',
  });

  // Cut score upsert form
  const [cutScoreForm, setCutScoreForm] = useState({
    tier: 'GOLD',
    mean: '80',
    sd: '5',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ items: rows }, cutScoreRes] = await Promise.all([
        api.onboarding.listAdminItems(levelId),
        api.onboarding.listAdminCutScores(levelId),
      ]);
      setItems(rows);
      setCutScores(cutScoreRes.cutScores);

      const levels = await api.onboarding.listAdminLevels();
      const level = levels.levels.find((row) => row.levelId === levelId);
      if (level) {
        const track = await api.catalog.track(level.trackCode);
        setCompetencies(
          track.competencies.map((comp) => ({
            id: comp.competencyId,
            name: comp.name,
          })),
        );
        const firstComp = track.competencies[0];
        if (!form.competencyId && firstComp) {
          setForm((prev) => ({ ...prev, competencyId: firstComp.competencyId }));
        }
      }
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Failed to load items or cut scores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [levelId]);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const options = form.itemType.startsWith('MCQ')
        ? [
            { label: 'A', text: form.optionA, isCorrect: form.correctOption === 'A' },
            { label: 'B', text: form.optionB, isCorrect: form.correctOption === 'B' },
          ]
        : [];
      await api.onboarding.createAdminItem(levelId, {
        competencyId: form.competencyId,
        itemType: form.itemType,
        stem: form.stem,
        modelAnswer: form.modelAnswer || undefined,
        options,
      });
      setSuccess('Item created.');
      setForm((prev) => ({ ...prev, stem: '', modelAnswer: '', optionA: '', optionB: '' }));
      await load();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not create item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpsertCutScore() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.onboarding.upsertAdminCutScore(levelId, {
        tier: cutScoreForm.tier,
        mean: parseFloat(cutScoreForm.mean),
        sd: parseFloat(cutScoreForm.sd),
      });
      setSuccess(`Cut score for tier ${cutScoreForm.tier} saved.`);
      await load();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not save cut score.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishCutScores() {
    if (
      !confirm(
        'Publishing cut scores will lock them for this level, invalidate downstream evaluation and catalog Redis caches, and emit a hirekiwi.track.updated event. Proceed?',
      )
    ) {
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.onboarding.publishCutScores(levelId);
      setCutScores(res.cutScores);
      setSuccess('Cut scores successfully published and cache invalidation event emitted.');
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not publish cut scores.');
    } finally {
      setPublishing(false);
    }
  }

  const allTiersDefined =
    cutScores.some((c) => c.tier === 'GOLD') &&
    cutScores.some((c) => c.tier === 'SILVER') &&
    cutScores.some((c) => c.tier === 'BRONZE');

  const allPublished = cutScores.length > 0 && cutScores.every((c) => c.published);

  return (
    <PageStack>
      <PageHeader
        icon={FileQuestion}
        tone="inverse"
        title="Level items &amp; Cut Scores"
        description="Author questions, options, model answers, and calibrate criterion-referenced cut scores (T11)."
      />
      {error ? <InlineAlert tone="danger" title={error} /> : null}
      {success ? <InlineAlert tone="info" title={success} /> : null}

      {/* -------------------- Cut Scores Section -------------------- */}
      <div className="space-y-4 rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              Criterion-Referenced Cut Scores
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Calibrated tier thresholds (GOLD, SILVER, BRONZE) required for automated grade
              determination.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allPublished ? (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                Published &amp; Active
              </Badge>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!allTiersDefined || publishing}
                onClick={() => void handlePublishCutScores()}
                className="gap-1.5"
              >
                <Send className="size-3.5" />
                {publishing ? 'Publishing...' : 'Publish Cut Scores'}
              </Button>
            )}
          </div>
        </div>

        {cutScores.length > 0 ? (
          <DataTable headers={['Tier', 'Mean (μ)', 'Std Dev (σ)', 'Status', 'Created']}>
            {cutScores.map((cs) => (
              <TableRow key={cs.cutScoreId}>
                <TableCell className="font-bold">
                  <span
                    className={
                      cs.tier === 'GOLD'
                        ? 'text-amber-600 dark:text-amber-400'
                        : cs.tier === 'SILVER'
                          ? 'text-zinc-500 dark:text-zinc-300'
                          : 'text-amber-800 dark:text-amber-600'
                    }
                  >
                    {cs.tier}
                  </span>
                </TableCell>
                <TableCell>{cs.mean}</TableCell>
                <TableCell>{cs.sd}</TableCell>
                <TableCell>
                  {cs.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Draft
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-500 text-[11px]">
                  {new Date(cs.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        ) : (
          <p className="text-xs text-zinc-500 italic">No cut scores defined for this level yet.</p>
        )}

        {!allPublished && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold mb-2">Upsert Draft Cut Score</h3>
            <FormGrid>
              <Field label="Tier">
                <NativeSelect
                  value={cutScoreForm.tier}
                  onChange={(e) => setCutScoreForm((prev) => ({ ...prev, tier: e.target.value }))}
                >
                  <option value="GOLD">GOLD</option>
                  <option value="SILVER">SILVER</option>
                  <option value="BRONZE">BRONZE</option>
                </NativeSelect>
              </Field>
              <Field label="Mean Score (μ)">
                <AdminInput
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cutScoreForm.mean}
                  onChange={(e) => setCutScoreForm((prev) => ({ ...prev, mean: e.target.value }))}
                />
              </Field>
              <Field label="Standard Deviation (σ)">
                <AdminInput
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={cutScoreForm.sd}
                  onChange={(e) => setCutScoreForm((prev) => ({ ...prev, sd: e.target.value }))}
                />
              </Field>
              <FormActions>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleUpsertCutScore()}
                >
                  Save Cut Score
                </Button>
              </FormActions>
            </FormGrid>
          </div>
        )}
      </div>

      {/* -------------------- Items Section -------------------- */}
      <h2 className="text-sm font-semibold pt-4">Create item</h2>
      <FormGrid>
        <Field label="Competency">
          <NativeSelect
            value={form.competencyId}
            onChange={(e) => setForm((prev) => ({ ...prev, competencyId: e.target.value }))}
          >
            {competencies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Item type">
          <NativeSelect
            value={form.itemType}
            onChange={(e) => setForm((prev) => ({ ...prev, itemType: e.target.value }))}
          >
            {['MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_ANSWER', 'SCENARIO_RESPONSE'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Stem" className="col-span-full">
          <AdminInput
            value={form.stem}
            onChange={(e) => setForm((prev) => ({ ...prev, stem: e.target.value }))}
          />
        </Field>
        {form.itemType.startsWith('MCQ') ? (
          <>
            <Field label="Option A">
              <AdminInput
                value={form.optionA}
                onChange={(e) => setForm((prev) => ({ ...prev, optionA: e.target.value }))}
              />
            </Field>
            <Field label="Option B">
              <AdminInput
                value={form.optionB}
                onChange={(e) => setForm((prev) => ({ ...prev, optionB: e.target.value }))}
              />
            </Field>
            <Field label="Correct option">
              <NativeSelect
                value={form.correctOption}
                onChange={(e) => setForm((prev) => ({ ...prev, correctOption: e.target.value }))}
              >
                <option value="A">A</option>
                <option value="B">B</option>
              </NativeSelect>
            </Field>
          </>
        ) : (
          <Field label="Model answer" className="col-span-full">
            <AdminInput
              value={form.modelAnswer}
              onChange={(e) => setForm((prev) => ({ ...prev, modelAnswer: e.target.value }))}
            />
          </Field>
        )}
        <FormActions>
          <Button type="button" disabled={submitting} onClick={() => void handleCreate()}>
            Create item
          </Button>
        </FormActions>
      </FormGrid>

      {loading ? (
        <EmptyState icon={FileQuestion}>Loading items…</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState icon={FileQuestion}>No items for this level yet.</EmptyState>
      ) : (
        <DataTable headers={['Type', 'Competency', 'Stem', 'Active', 'Options']}>
          {items.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell>{item.itemType}</TableCell>
              <TableCell>{item.competencyName}</TableCell>
              <TableCell className="max-w-md truncate">{item.stem}</TableCell>
              <TableCell>{item.active ? 'Yes' : 'No'}</TableCell>
              <TableCell>{item.options.length}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </PageStack>
  );
}
