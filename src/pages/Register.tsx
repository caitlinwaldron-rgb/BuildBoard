import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FilePlus2, Plus, Search, Table2, Upload, X } from 'lucide-react';
import { useStore } from '../store';
import type { DeliverableMilestone, Discipline, Drawing, DrawingStatus } from '../types';
import {
  DISCIPLINES,
  DISCIPLINE_COLORS,
  ISSUED_STATUSES,
  MILESTONES,
  STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../constants';
import { todayISO } from '../lib/dates';
import { Badge, Button, EmptyState, cx } from '../components/ui';
import { NccClausePicker } from '../components/NccClausePicker';
import { ImportModal } from '../components/ImportModal';
import { ProjectHeader } from '../components/ProjectHeader';

type GroupBy = 'none' | 'discipline' | 'milestone' | 'status';

export function Register() {
  const { id } = useParams();
  const projectId = id!;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))!;
  const allDrawings = useStore((s) => s.drawings);
  const drawings = useMemo(
    () => allDrawings.filter((d) => d.projectId === projectId),
    [allDrawings, projectId],
  );
  const addDrawing = useStore((s) => s.addDrawing);
  const addDrawings = useStore((s) => s.addDrawings);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DrawingStatus | ''>('');
  const [disciplineFilter, setDisciplineFilter] = useState<Discipline | ''>('');
  const [milestoneFilter, setMilestoneFilter] = useState<DeliverableMilestone | ''>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drawings
      .filter((d) => {
        if (statusFilter && d.status !== statusFilter) return false;
        if (disciplineFilter && d.discipline !== disciplineFilter) return false;
        if (milestoneFilter && !d.milestones.includes(milestoneFilter)) return false;
        if (q) {
          const hay = `${d.drawingNumber} ${d.title} ${d.notes} ${d.tags.join(' ')} ${d.nccClauses.join(
            ' ',
          )}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.drawingNumber.localeCompare(b.drawingNumber, undefined, { numeric: true }));
  }, [drawings, query, statusFilter, disciplineFilter, milestoneFilter]);

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', rows: filtered }];
    const map = new Map<string, Drawing[]>();
    const keyOf = (d: Drawing): string[] => {
      if (groupBy === 'discipline') return [d.discipline];
      if (groupBy === 'status') return [STATUS_LABEL[d.status]];
      return d.milestones.length ? d.milestones : ['— No milestone —'];
    };
    filtered.forEach((d) => {
      keyOf(d).forEach((k) => {
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(d);
      });
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, rows]) => ({ label, rows }));
  }, [filtered, groupBy]);

  const anyFilter = query || statusFilter || disciplineFilter || milestoneFilter;
  const clearFilters = () => {
    setQuery('');
    setStatusFilter('');
    setDisciplineFilter('');
    setMilestoneFilter('');
  };

  return (
    <div>
      <ProjectHeader project={project} title="Drawing register" subtitle={`${drawings.length} drawings`}>
        <Button icon={<Upload size={15} />} onClick={() => setImporting(true)}>
          Import
        </Button>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => addDrawing(projectId)}>
          Add drawing
        </Button>
      </ProjectHeader>

      <div className="px-6 py-4">
        {/* Toolbar */}
        <div className="no-print mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drawings…"
              className="w-56 rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as DrawingStatus | '')}
            placeholder="All statuses"
            options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <FilterSelect
            value={disciplineFilter}
            onChange={(v) => setDisciplineFilter(v as Discipline | '')}
            placeholder="All disciplines"
            options={DISCIPLINES.map((d) => ({ value: d.value, label: `${d.value} — ${d.label}` }))}
          />
          <FilterSelect
            value={milestoneFilter}
            onChange={(v) => setMilestoneFilter(v as DeliverableMilestone | '')}
            placeholder="All milestones"
            options={MILESTONES.map((m) => ({ value: m, label: m }))}
          />

          <div className="ml-auto flex items-center gap-2">
            {anyFilter && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <X size={13} /> Clear
              </button>
            )}
            <label className="text-xs text-slate-500">Group by</label>
            <FilterSelect
              value={groupBy === 'none' ? '' : groupBy}
              onChange={(v) => setGroupBy((v || 'none') as GroupBy)}
              placeholder="Nothing"
              options={[
                { value: 'discipline', label: 'Discipline' },
                { value: 'milestone', label: 'Milestone' },
                { value: 'status', label: 'Status' },
              ]}
            />
          </div>
        </div>

        {drawings.length === 0 ? (
          <EmptyState
            icon={<Table2 size={40} />}
            title="No drawings yet"
            description="Add drawings one at a time or bulk-import an existing register from CSV."
            action={
              <div className="flex gap-2">
                <Button icon={<Upload size={15} />} onClick={() => setImporting(true)}>
                  Import CSV
                </Button>
                <Button variant="primary" icon={<FilePlus2 size={15} />} onClick={() => addDrawing(projectId)}>
                  Add drawing
                </Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No drawings match your filters" action={<Button onClick={clearFilters}>Clear filters</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1140px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Th className="w-28">No.</Th>
                  <Th className="min-w-[18rem]">Title</Th>
                  <Th className="w-24">Disc.</Th>
                  <Th className="w-16">Rev</Th>
                  <Th className="w-44">Status</Th>
                  <Th className="w-32">Due</Th>
                  <Th className="w-40">Milestones</Th>
                  <Th className="w-56">NCC clauses</Th>
                  <Th>Notes</Th>
                  <Th className="w-10"> </Th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <RowGroup key={g.label || 'all'} group={g} project={project} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={(rows) => {
            addDrawings(projectId, rows);
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------- rows ----------------------------------- */

function RowGroup({
  group,
  project,
}: {
  group: { label: string; rows: Drawing[] };
  project: ReturnType<typeof useStore.getState>['projects'][number];
}) {
  return (
    <>
      {group.label && (
        <tr className="bg-slate-100/70">
          <td colSpan={10} className="px-3 py-1.5 text-xs font-semibold text-slate-600">
            {group.label} <span className="font-normal text-slate-400">({group.rows.length})</span>
          </td>
        </tr>
      )}
      {group.rows.map((d) => (
        <DrawingRow key={d.id} drawing={d} project={project} />
      ))}
    </>
  );
}

function DrawingRow({
  drawing,
  project,
}: {
  drawing: Drawing;
  project: ReturnType<typeof useStore.getState>['projects'][number];
}) {
  const update = useStore((s) => s.updateDrawing);
  const remove = useStore((s) => s.deleteDrawing);
  const [nccOpen, setNccOpen] = useState(false);
  const [msOpen, setMsOpen] = useState(false);

  const patch = (p: Partial<Drawing>) => update(drawing.id, p);

  const overdue =
    !!drawing.dueDate && drawing.dueDate < todayISO() && !ISSUED_STATUSES.includes(drawing.status);

  return (
    <tr
      className={cx(
        'group border-b border-slate-100 align-top last:border-0',
        overdue ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-slate-50/60',
      )}
    >
      <Td>
        <TextInput value={drawing.drawingNumber} placeholder="A-001" mono onCommit={(v) => patch({ drawingNumber: v })} />
      </Td>
      <Td>
        <TextInput value={drawing.title} placeholder="Drawing title" onCommit={(v) => patch({ title: v })} />
      </Td>
      <Td>
        <select
          value={drawing.discipline}
          onChange={(e) => patch({ discipline: e.target.value as Discipline })}
          className={cx('w-full rounded border px-1 py-1 text-xs font-semibold outline-none', DISCIPLINE_COLORS[drawing.discipline])}
        >
          {DISCIPLINES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.value}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <TextInput value={drawing.revision} placeholder="A" mono onCommit={(v) => patch({ revision: v })} />
      </Td>
      <Td>
        <select
          value={drawing.status}
          onChange={(e) => patch({ status: e.target.value as DrawingStatus })}
          className={cx('w-full rounded border px-1.5 py-1 text-xs font-medium outline-none', STATUS_COLOR[drawing.status])}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Td>

      {/* Due date */}
      <Td>
        <input
          type="date"
          value={drawing.dueDate ?? ''}
          onChange={(e) => patch({ dueDate: e.target.value || undefined })}
          className={cx(
            'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs outline-none hover:border-slate-200 focus:border-brand-400 focus:bg-white',
            overdue && 'font-semibold text-red-600',
          )}
        />
      </Td>

      {/* Milestones */}
      <Td>
        <div className="relative">
          <button
            onClick={() => setMsOpen((o) => !o)}
            className="flex min-h-[28px] w-full flex-wrap items-center gap-1 rounded border border-transparent px-1 py-1 text-left hover:border-slate-200"
          >
            {drawing.milestones.length === 0 ? (
              <span className="text-xs text-slate-300">+ milestone</span>
            ) : (
              drawing.milestones.map((m) => (
                <Badge key={m} className="border-slate-200 bg-slate-100 text-slate-700">
                  {m}
                </Badge>
              ))
            )}
          </button>
          {msOpen && (
            <Popover onClose={() => setMsOpen(false)}>
              {MILESTONES.map((m) => {
                const on = drawing.milestones.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() =>
                      patch({
                        milestones: on
                          ? drawing.milestones.filter((x) => x !== m)
                          : [...drawing.milestones, m],
                      })
                    }
                    className={cx(
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50',
                      on && 'bg-brand-50 text-brand-700',
                    )}
                  >
                    {m}
                    {on && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </Popover>
          )}
        </div>
      </Td>

      {/* NCC clauses */}
      <Td>
        <div className="relative">
          <button
            onClick={() => setNccOpen((o) => !o)}
            className="flex min-h-[28px] w-full flex-wrap items-center gap-1 rounded border border-transparent px-1 py-1 text-left hover:border-slate-200"
          >
            {drawing.nccClauses.length === 0 ? (
              <span className="text-xs text-slate-300">+ clause</span>
            ) : (
              drawing.nccClauses.map((c) => (
                <Badge key={c} className="border-brand-200 bg-brand-50 font-mono text-brand-700">
                  {c}
                </Badge>
              ))
            )}
          </button>
          {nccOpen && (
            <NccClausePicker
              selected={drawing.nccClauses}
              buildingClasses={project.buildingClasses}
              volumes={project.nccVolumes}
              onChange={(clauses) => patch({ nccClauses: clauses })}
              onClose={() => setNccOpen(false)}
            />
          )}
        </div>
      </Td>

      <Td>
        <TextInput value={drawing.notes} placeholder="—" onCommit={(v) => patch({ notes: v })} />
      </Td>
      <Td>
        <button
          onClick={() => {
            if (confirm(`Delete drawing ${drawing.drawingNumber || '(untitled)'}?`)) remove(drawing.id);
          }}
          className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          title="Delete"
        >
          <X size={15} />
        </button>
      </Td>
    </tr>
  );
}

/* ------------------------------ small cells ------------------------------- */

function TextInput({
  value,
  placeholder,
  mono,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  mono?: boolean;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== value && onCommit(local)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setLocal(value);
      }}
      className={cx(
        'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-slate-200 focus:border-brand-400 focus:bg-white',
        mono && 'font-mono',
      )}
    />
  );
}

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute z-30 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
        {children}
      </div>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        'rounded-lg border border-slate-300 bg-white py-2 pl-2.5 pr-7 text-sm outline-none focus:border-brand-500',
        !value && 'text-slate-500',
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-slate-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cx('px-3 py-2.5 font-semibold', className)}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5">{children}</td>;
}
