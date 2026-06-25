import type {
  BuildingClass,
  Discipline,
  DeliverableMilestone,
  DocStatus,
  DrawingStatus,
  EventCategory,
  NCCVolume,
} from './types';

export const BUILDING_CLASSES: { value: BuildingClass; label: string; volume: NCCVolume }[] = [
  { value: 'Class 1a', label: 'Class 1a — House', volume: 'Volume 2' },
  { value: 'Class 1b', label: 'Class 1b — Boarding/guest house (small)', volume: 'Volume 2' },
  { value: 'Class 2', label: 'Class 2 — Apartment building', volume: 'Volume 1' },
  { value: 'Class 3', label: 'Class 3 — Residential (hotel, hostel)', volume: 'Volume 1' },
  { value: 'Class 4', label: 'Class 4 — Dwelling in a non-residential building', volume: 'Volume 1' },
  { value: 'Class 5', label: 'Class 5 — Office', volume: 'Volume 1' },
  { value: 'Class 6', label: 'Class 6 — Shop / retail', volume: 'Volume 1' },
  { value: 'Class 7a', label: 'Class 7a — Carpark', volume: 'Volume 1' },
  { value: 'Class 7b', label: 'Class 7b — Warehouse / storage', volume: 'Volume 1' },
  { value: 'Class 8', label: 'Class 8 — Factory / laboratory', volume: 'Volume 1' },
  { value: 'Class 9a', label: 'Class 9a — Health-care building', volume: 'Volume 1' },
  { value: 'Class 9b', label: 'Class 9b — Assembly building', volume: 'Volume 1' },
  { value: 'Class 9c', label: 'Class 9c — Aged care building', volume: 'Volume 1' },
  { value: 'Class 10a', label: 'Class 10a — Shed / carport / garage', volume: 'Volume 2' },
  { value: 'Class 10b', label: 'Class 10b — Structure (fence, pool, mast)', volume: 'Volume 2' },
  { value: 'Class 10c', label: 'Class 10c — Private bushfire shelter', volume: 'Volume 2' },
];

export const NCC_VOLUMES: NCCVolume[] = ['Volume 1', 'Volume 2'];

export const DISCIPLINES: { value: Discipline; label: string }[] = [
  { value: 'A', label: 'Architectural' },
  { value: 'S', label: 'Structural' },
  { value: 'M', label: 'Mechanical' },
  { value: 'E', label: 'Electrical' },
  { value: 'C', label: 'Civil' },
  { value: 'L', label: 'Landscape' },
  { value: 'P', label: 'Hydraulic / Plumbing' },
  { value: 'ID', label: 'Interior Design' },
];

export const DISCIPLINE_COLORS: Record<Discipline, string> = {
  A: 'bg-blue-100 text-blue-800 border-blue-200',
  S: 'bg-stone-200 text-stone-800 border-stone-300',
  M: 'bg-teal-100 text-teal-800 border-teal-200',
  E: 'bg-amber-100 text-amber-800 border-amber-200',
  C: 'bg-lime-100 text-lime-800 border-lime-200',
  L: 'bg-green-100 text-green-800 border-green-200',
  P: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ID: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const MILESTONES: DeliverableMilestone[] = [
  'DA',
  'CC',
  'Construction',
  'As-built',
  'Tender',
];

export const STATUSES: { value: DrawingStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not started', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'in_progress', label: 'In progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  {
    value: 'issued_for_review',
    label: 'Issued for review',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  {
    value: 'issued_for_da',
    label: 'Issued for DA',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  {
    value: 'issued_for_cc',
    label: 'Issued for CC',
    color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  },
  {
    value: 'construction_issue',
    label: 'Construction issue',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  { value: 'as_built', label: 'As-built', color: 'bg-green-200 text-green-800 border-green-300' },
];

export const STATUS_LABEL: Record<DrawingStatus, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label]),
) as Record<DrawingStatus, string>;

export const STATUS_COLOR: Record<DrawingStatus, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.color]),
) as Record<DrawingStatus, string>;

/** Which status counts as "issued" toward a given milestone. */
export const MILESTONE_ISSUED_STATUS: Record<DeliverableMilestone, DrawingStatus[]> = {
  DA: ['issued_for_da', 'issued_for_cc', 'construction_issue', 'as_built'],
  Tender: ['issued_for_da', 'issued_for_cc', 'construction_issue', 'as_built'],
  CC: ['issued_for_cc', 'construction_issue', 'as_built'],
  Construction: ['construction_issue', 'as_built'],
  'As-built': ['as_built'],
};

/** Statuses that mean a drawing has been issued (so a past due date is no longer "overdue"). */
export const ISSUED_STATUSES: DrawingStatus[] = [
  'issued_for_review',
  'issued_for_da',
  'issued_for_cc',
  'construction_issue',
  'as_built',
];

export const EVENT_CATEGORIES: {
  value: EventCategory;
  label: string;
  color: string; // chip classes
  dot: string; // solid colour for calendar dot / legend
}[] = [
  { value: 'meeting', label: 'Meeting', color: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  { value: 'milestone', label: 'Milestone', color: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500' },
  { value: 'site-visit', label: 'Site visit', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'submission', label: 'Submission', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200', dot: 'bg-fuchsia-500' },
  { value: 'deadline', label: 'Deadline', color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
];

export const EVENT_CATEGORY_COLOR: Record<EventCategory, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.color]),
) as Record<EventCategory, string>;

export const EVENT_CATEGORY_DOT: Record<EventCategory, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.dot]),
) as Record<EventCategory, string>;

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<EventCategory, string>;

/* ---------------- NCC self-assessment: documentation status ---------------- */

export const DOC_STATUSES: {
  value: DocStatus;
  label: string;
  color: string; // chip / select classes
  row: string; // row tint when this status is set
  dot: string;
}[] = [
  {
    value: 'documented',
    label: 'Documented',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    row: '',
    dot: 'bg-emerald-500',
  },
  {
    value: 'partial',
    label: 'Partially Documented',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    row: 'bg-amber-50/70',
    dot: 'bg-amber-500',
  },
  {
    value: 'not_documented',
    label: 'Not Documented',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    row: 'bg-rose-50/70',
    dot: 'bg-rose-500',
  },
  {
    value: 'na',
    label: 'Not Applicable',
    color: 'bg-slate-100 text-slate-600 border-slate-300',
    row: '',
    dot: 'bg-slate-400',
  },
];

export const DOC_STATUS_LABEL: Record<DocStatus, string> = Object.fromEntries(
  DOC_STATUSES.map((s) => [s.value, s.label]),
) as Record<DocStatus, string>;

export const DOC_STATUS_META: Record<DocStatus, (typeof DOC_STATUSES)[number]> =
  Object.fromEntries(DOC_STATUSES.map((s) => [s.value, s])) as Record<
    DocStatus,
    (typeof DOC_STATUSES)[number]
  >;

/** Evidence confidence band chip styling. */
export const CONFIDENCE_META: Record<'high' | 'medium' | 'low', { label: string; chip: string }> = {
  high: { label: 'High', chip: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  medium: { label: 'Medium', chip: 'bg-amber-100 text-amber-800 border-amber-300' },
  low: { label: 'Low', chip: 'bg-slate-100 text-slate-600 border-slate-300' },
};

/** Common document types for the register's type field (datalist suggestions). */
export const DOCUMENT_TYPES = [
  'Site Plan',
  'Floor Plan',
  'Elevation',
  'Section',
  'Detail',
  'Schedule',
  'Specification',
  'Structural Drawing',
  'Services Drawing',
  'Report',
  'Certificate',
  'Calculation',
];
