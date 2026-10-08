'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type EmployerApplicantCard,
} from '@hirekiwi/contracts';
import { BOARD_COLUMNS, canDrop, dropTargets, groupByStatus } from '@/lib/pipeline-board';

const BAND_LABEL = { STRONG: 'Strong fit', MODERATE: 'Good fit', STRETCH: 'Stretch' } as const;
const BAND_STYLE = {
  STRONG: 'bg-emerald-50 text-emerald-700',
  MODERATE: 'bg-amber-50 text-amber-700',
  STRETCH: 'bg-zinc-100 text-zinc-600',
} as const;

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || '?'
  );
}

function CandidateCard({
  applicant,
  overlay = false,
}: {
  applicant: EmployerApplicantCard;
  overlay?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-2xs ${overlay ? 'shadow-lg ring-2 ring-emerald-500/40' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {applicant.photoUrl ? (
          // Signed storage URL; not routed through next/image.
          <img
            src={applicant.photoUrl}
            alt=""
            draggable={false}
            className="size-8 shrink-0 rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white"
          >
            {initials(applicant.candidateName)}
          </span>
        )}
        <p className="min-w-0 truncate text-sm font-semibold text-zinc-900">
          {applicant.candidateName}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
        {applicant.fit ? (
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${BAND_STYLE[applicant.fit.band]}`}
          >
            {BAND_LABEL[applicant.fit.band]} · {applicant.fit.matchPercent}%
          </span>
        ) : (
          <span className="text-zinc-400">Not scored</span>
        )}
        <span className="text-zinc-400">
          {new Date(applicant.appliedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ applicant }: { applicant: EmployerApplicantCard }) {
  // A finished application has nowhere to go, so it is not draggable.
  const movable = applicant.allowedNext.length > 0;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: applicant.applicationId,
    disabled: !movable,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-testid={`card-${applicant.applicationId}`}
      aria-label={`${applicant.candidateName}, ${applicant.statusLabel}${movable ? '. Drag to move, or use the status menu in the list view.' : ''}`}
      className={`${isDragging ? 'opacity-40' : ''} ${movable ? 'cursor-grab touch-none' : 'opacity-80'}`}
    >
      <CandidateCard applicant={applicant} />
    </div>
  );
}

function Column({
  status,
  applicants,
  active,
}: {
  status: ApplicationStatus;
  applicants: EmployerApplicantCard[];
  active: EmployerApplicantCard | null;
}) {
  const allowed = active ? canDrop(active, status) : false;
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !allowed });
  // While dragging, only valid targets light up; everything else fades back.
  const state = !active ? 'idle' : allowed ? (isOver ? 'over' : 'target') : 'blocked';
  const style = {
    idle: 'border-zinc-200 bg-zinc-50',
    target: 'border-emerald-400 bg-emerald-50/60',
    over: 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500/40',
    blocked: 'border-zinc-200 bg-zinc-50 opacity-50',
  }[state];
  return (
    <section
      ref={setNodeRef}
      aria-label={`${EMPLOYER_APPLICATION_STATUS_LABELS[status]} column`}
      data-testid={`column-${status}`}
      data-drop-state={state}
      className={`flex min-h-48 min-w-0 flex-col gap-2 rounded-lg border p-2.5 ${style}`}
    >
      <h3 className="flex items-center justify-between gap-2 px-1 pb-1 text-xs font-bold tracking-wide text-zinc-600 uppercase">
        <span className="truncate">{EMPLOYER_APPLICATION_STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-700 shadow-2xs">
          {applicants.length}
        </span>
      </h3>
      {applicants.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-200 px-2 py-5 text-center text-xs text-zinc-400">
          No candidates
        </p>
      ) : (
        applicants.map((applicant) => (
          <DraggableCard key={applicant.applicationId} applicant={applicant} />
        ))
      )}
    </section>
  );
}

interface PipelineBoardProps {
  applicants: EmployerApplicantCard[];
  /** Called when a card is dropped on a valid column. The parent does the optimistic move. */
  onMove: (applicant: EmployerApplicantCard, to: ApplicationStatus) => void;
}

/** Drag-and-drop board (Th6-414), one column per status. Only valid drop targets highlight. */
export function PipelineBoard({ applicants, onMove }: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // A small drag distance keeps clicks and scrolling from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const groups = groupByStatus(applicants);
  const active = applicants.find((a) => a.applicationId === activeId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const applicant = applicants.find((a) => a.applicationId === event.active.id);
    const to = event.over?.id as ApplicationStatus | undefined;
    // Re-check with the shared rules: a drop the server would refuse never leaves the browser.
    if (applicant && to && dropTargets(applicant).includes(to)) onMove(applicant, to);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        className="grid auto-cols-[minmax(8.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3"
        data-testid="pipeline-board"
      >
        {BOARD_COLUMNS.map((status) => (
          <Column key={status} status={status} applicants={groups[status]} active={active} />
        ))}
      </div>
      <DragOverlay>{active ? <CandidateCard applicant={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
