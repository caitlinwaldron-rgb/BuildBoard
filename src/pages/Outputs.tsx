import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, FileSpreadsheet, FileText, Grid3x3, ListChecks, Table2 } from 'lucide-react';
import { useStore } from '../store';
import { Button, EmptyState, cx } from '../components/ui';
import { ProjectHeader } from '../components/ProjectHeader';
import { EVENT_CATEGORY_LABEL, STATUS_LABEL } from '../constants';
import { formatDateLong, formatTime } from '../lib/dates';
import type { CalendarEvent, Drawing, Project } from '../types';
import {
  exportCalendarExcel,
  exportCalendarPdf,
  exportMatrixExcel,
  exportMatrixPdf,
  exportRegisterExcel,
  exportRegisterPdf,
  exportTrackerExcel,
  exportTrackerPdf,
} from '../lib/export';

type Output = 'register' | 'matrix' | 'tracker' | 'calendar';

const OUTPUTS: { id: Output; label: string; description: string; icon: typeof Table2 }[] = [
  { id: 'register', label: 'Drawing Register', description: 'The full schedule of drawings with discipline, revision, status, due dates and clause tags.', icon: Table2 },
  { id: 'matrix', label: 'NCC Compliance Matrix', description: 'Clause × drawing grid showing which clauses each drawing addresses.', icon: Grid3x3 },
  { id: 'tracker', label: 'Deliverable Status Tracker', description: 'Drawings grouped by milestone with an issued / outstanding rollup.', icon: ListChecks },
  { id: 'calendar', label: 'Calendar / Schedule', description: 'Chronological list of due dates, milestones and meetings across the project.', icon: CalendarDays },
];

export function Outputs() {
  const { id } = useParams();
  const projectId = id!;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))!;
  const allDrawings = useStore((s) => s.drawings);
  const allEvents = useStore((s) => s.events);
  const drawings = useMemo(
    () => allDrawings.filter((d) => d.projectId === projectId),
    [allDrawings, projectId],
  );
  const events = useMemo(
    () => allEvents.filter((e) => e.projectId === projectId),
    [allEvents, projectId],
  );
  const [selected, setSelected] = useState<Output>('register');

  const hasCalendarContent =
    events.length > 0 || drawings.some((d) => d.dueDate) || !!project.dueDate;
  const empty = selected === 'calendar' ? !hasCalendarContent : drawings.length === 0;

  const runExport = (format: 'pdf' | 'excel') => {
    switch (selected) {
      case 'register':
        return (format === 'pdf' ? exportRegisterPdf : exportRegisterExcel)(project, drawings);
      case 'matrix':
        return (format === 'pdf' ? exportMatrixPdf : exportMatrixExcel)(project, drawings);
      case 'tracker':
        return (format === 'pdf' ? exportTrackerPdf : exportTrackerExcel)(project, drawings);
      case 'calendar':
        return (format === 'pdf' ? exportCalendarPdf : exportCalendarExcel)(project, drawings, events);
    }
  };

  return (
    <div>
      <ProjectHeader project={project} title="Outputs" subtitle="Export schedules for certifiers & clients" />

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[20rem_1fr]">
        {/* selector */}
        <div className="space-y-2">
          {OUTPUTS.map((o) => {
            const Icon = o.icon;
            const active = selected === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
                  active ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <Icon size={20} className={active ? 'text-brand-600' : 'text-slate-400'} />
                <div>
                  <div className="font-semibold text-slate-900">{o.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{o.description}</div>
                </div>
              </button>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              icon={<FileText size={15} />}
              onClick={() => runExport('pdf')}
              disabled={empty}
            >
              Export PDF
            </Button>
            <Button
              className="flex-1"
              variant="primary"
              icon={<FileSpreadsheet size={15} />}
              onClick={() => runExport('excel')}
              disabled={empty}
            >
              Export Excel
            </Button>
          </div>
        </div>

        {/* preview */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {empty ? (
            <EmptyState
              title="Nothing to export yet"
              description={
                selected === 'calendar'
                  ? 'Add events or drawing due dates in the Calendar first.'
                  : 'Add drawings to the register first.'
              }
            />
          ) : (
            <Preview output={selected} project={project} drawings={drawings} events={events} />
          )}
        </div>
      </div>
    </div>
  );
}

function Preview({
  output,
  project,
  drawings,
  events,
}: {
  output: Output;
  project: Project;
  drawings: Drawing[];
  events: CalendarEvent[];
}) {
  return (
    <div>
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-900">{OUTPUTS.find((o) => o.id === output)!.label}</h2>
        <p className="text-sm text-slate-500">
          {project.name} · {project.address || 'No address'} · {project.buildingClasses.join(', ')}
        </p>
      </div>

      {output === 'register' && (
        <table className="w-full text-xs">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-1 pr-2">No.</th>
              <th className="py-1 pr-2">Title</th>
              <th className="py-1 pr-2">Disc</th>
              <th className="py-1 pr-2">Rev</th>
              <th className="py-1 pr-2">Status</th>
              <th className="py-1 pr-2">Due</th>
              <th className="py-1 pr-2">Clauses</th>
            </tr>
          </thead>
          <tbody>
            {drawings.slice(0, 60).map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="py-1 pr-2 font-mono">{d.drawingNumber}</td>
                <td className="py-1 pr-2">{d.title}</td>
                <td className="py-1 pr-2">{d.discipline}</td>
                <td className="py-1 pr-2">{d.revision}</td>
                <td className="py-1 pr-2">{STATUS_LABEL[d.status]}</td>
                <td className="py-1 pr-2 text-slate-500">{d.dueDate ? formatDateLong(d.dueDate) : '—'}</td>
                <td className="py-1 pr-2 font-mono text-slate-500">{d.nccClauses.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {output === 'matrix' && <MatrixPreview drawings={drawings} />}

      {output === 'tracker' && (
        <ul className="space-y-1 text-sm">
          {drawings.slice(0, 60).map((d) => (
            <li key={d.id} className="flex justify-between border-b border-slate-50 py-1">
              <span>
                <span className="font-mono text-xs text-slate-500">{d.drawingNumber}</span> {d.title}
              </span>
              <span className="text-xs text-slate-400">
                {d.milestones.join(', ') || '—'} · {STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {output === 'calendar' && <CalendarPreview project={project} drawings={drawings} events={events} />}

      {output !== 'calendar' && drawings.length > 60 && (
        <p className="mt-3 text-xs text-slate-400">Preview limited to 60 rows. The export includes all {drawings.length}.</p>
      )}
    </div>
  );
}

function MatrixPreview({ drawings }: { drawings: Drawing[] }) {
  const clauses = [...new Set(drawings.flatMap((d) => d.nccClauses))].sort();
  if (clauses.length === 0) return <p className="text-sm text-slate-400">No clauses tagged yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-1 py-1 text-left text-slate-400">Drawing</th>
            {clauses.map((c) => (
              <th key={c} className="px-1 py-1 font-mono text-slate-400">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drawings.slice(0, 40).map((d) => (
            <tr key={d.id} className="border-t border-slate-100">
              <td className="px-1 py-1 font-mono">{d.drawingNumber || '—'}</td>
              {clauses.map((c) => (
                <td key={c} className="px-1 py-1 text-center">
                  {d.nccClauses.includes(c) ? '●' : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarPreview({
  project,
  drawings,
  events,
}: {
  project: Project;
  drawings: Drawing[];
  events: CalendarEvent[];
}) {
  const rows = [
    ...(project.dueDate ? [{ date: project.dueDate, time: '', type: 'Project deadline', item: project.name }] : []),
    ...drawings
      .filter((d) => d.dueDate)
      .map((d) => ({
        date: d.dueDate!,
        time: '',
        type: 'Drawing due',
        item: `${d.drawingNumber}${d.title ? ` — ${d.title}` : ''}`,
      })),
    ...events.map((e) => ({
      date: e.date,
      time: [e.startTime, e.endTime].filter(Boolean).map(formatTime).join(' – '),
      type: EVENT_CATEGORY_LABEL[e.category],
      item: e.title,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <table className="w-full text-xs">
      <thead className="text-left text-slate-400">
        <tr>
          <th className="py-1 pr-2">Date</th>
          <th className="py-1 pr-2">Time</th>
          <th className="py-1 pr-2">Type</th>
          <th className="py-1 pr-2">Item</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 80).map((r, i) => (
          <tr key={i} className="border-t border-slate-100">
            <td className="py-1 pr-2 whitespace-nowrap">{formatDateLong(r.date)}</td>
            <td className="py-1 pr-2 whitespace-nowrap text-slate-500">{r.time || '—'}</td>
            <td className="py-1 pr-2 text-slate-500">{r.type}</td>
            <td className="py-1 pr-2">{r.item}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
