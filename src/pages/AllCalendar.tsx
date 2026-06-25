import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HardHat,
} from 'lucide-react';
import { useStore } from '../store';
import type { DrawingStatus, EventCategory } from '../types';
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_COLOR,
  EVENT_CATEGORY_DOT,
  ISSUED_STATUSES,
} from '../constants';
import { Button, cx } from '../components/ui';
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  formatDateLong,
  formatTime,
  fromISODate,
  monthGrid,
  todayISO,
  toISODate,
} from '../lib/dates';

interface AllItem {
  key: string;
  date: string;
  kind: 'event' | 'drawing' | 'project';
  title: string;
  projectId: string;
  projectName: string;
  category?: EventCategory;
  time?: string;
  overdue?: boolean;
}

const isOverdue = (dueDate: string, status: DrawingStatus) =>
  dueDate < todayISO() && !ISSUED_STATUSES.includes(status);

export function AllCalendar() {
  const projects = useStore((s) => s.projects);
  const drawings = useStore((s) => s.drawings);
  const events = useStore((s) => s.events);
  const navigate = useNavigate();

  const today = todayISO();
  const initial = fromISODate(today);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [projectFilter, setProjectFilter] = useState<string>('');

  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? 'Project';
  }, [projects]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AllItem[]>();
    const push = (item: AllItem) => {
      if (projectFilter && item.projectId !== projectFilter) return;
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    };

    events.forEach((e) =>
      push({
        key: `e-${e.id}`,
        date: e.date,
        kind: 'event',
        title: e.title || '(untitled)',
        projectId: e.projectId,
        projectName: projectName(e.projectId),
        category: e.category,
        time: e.startTime,
      }),
    );

    drawings.forEach((d) => {
      if (!d.dueDate) return;
      push({
        key: `d-${d.id}`,
        date: d.dueDate,
        kind: 'drawing',
        title: `${d.drawingNumber || 'Drawing'}${d.title ? ` — ${d.title}` : ''}`,
        projectId: d.projectId,
        projectName: projectName(d.projectId),
        overdue: isOverdue(d.dueDate, d.status),
      });
    });

    projects.forEach((p) => {
      if (!p.dueDate) return;
      push({
        key: `p-${p.id}`,
        date: p.dueDate,
        kind: 'project',
        title: `${p.name} — deadline`,
        projectId: p.id,
        projectName: p.name,
        overdue: p.dueDate < today,
      });
    });

    map.forEach((list) => list.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')));
    return map;
  }, [events, drawings, projects, projectFilter, projectName, today]);

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);

  const upcoming = useMemo(() => {
    const all: AllItem[] = [];
    itemsByDate.forEach((list) => all.push(...list));
    return all
      .filter((i) => i.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'))
      .slice(0, 10);
  }, [itemsByDate, today]);

  const goMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () => setView({ year: initial.getFullYear(), month: initial.getMonth() });

  const openItem = (item: AllItem) => {
    const sub = item.kind === 'event' || item.kind === 'drawing' ? '/calendar' : '';
    navigate(`/project/${item.projectId}${sub}`);
  };

  return (
    <div className="app-bg min-h-screen">
      <header className="border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <HardHat size={20} />
            </div>
            <span className="text-lg font-bold text-slate-900">BuildBoard</span>
          </Link>
          <Link to="/">
            <Button icon={<ArrowLeft size={15} />}>All projects</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-7">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Combined calendar</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Due dates, milestones & meetings across every project.
            </p>
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none backdrop-blur focus:border-brand-500"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_18rem]">
          <div>
            {/* Month nav */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => goMonth(-1)}
                className="rounded-lg border border-white/70 bg-white/70 p-1.5 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goMonth(1)}
                className="rounded-lg border border-white/70 bg-white/70 p-1.5 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
              <h2 className="ml-1 text-lg font-bold text-slate-900">
                {MONTH_NAMES[view.month]} {view.year}
              </h2>
              <Button className="ml-2 py-1.5" onClick={goToday}>
                Today
              </Button>
            </div>

            {/* Grid */}
            <div className="overflow-hidden rounded-xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
              <div className="grid grid-cols-7 border-b border-slate-200/70 bg-white/40 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="py-2">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const iso = toISODate(cell);
                  const inMonth = cell.getMonth() === view.month;
                  const isToday = iso === today;
                  const items = itemsByDate.get(iso) ?? [];
                  return (
                    <DayCell
                      key={iso + i}
                      day={cell.getDate()}
                      inMonth={inMonth}
                      isToday={isToday}
                      items={items}
                      onOpenItem={openItem}
                    />
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              {EVENT_CATEGORIES.map((c) => (
                <span key={c.value} className="inline-flex items-center gap-1.5">
                  <span className={cx('h-2.5 w-2.5 rounded-full', c.dot)} /> {c.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Drawing due
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Overdue / deadline
              </span>
            </div>
          </div>

          {/* Upcoming sidebar */}
          <aside className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming</h3>
            {upcoming.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-6 text-center text-sm text-slate-400 backdrop-blur">
                Nothing scheduled. Add events or drawing due dates inside a project.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((i) => (
                  <li key={i.key}>
                    <button
                      onClick={() => openItem(i)}
                      className="flex w-full items-start gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-left text-sm shadow-sm backdrop-blur transition hover:bg-white"
                    >
                      <span
                        className={cx(
                          'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                          i.kind === 'event'
                            ? EVENT_CATEGORY_DOT[i.category!]
                            : i.overdue || i.kind === 'project'
                              ? 'bg-red-600'
                              : 'bg-amber-500',
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{i.title}</p>
                        <p className="truncate text-xs text-slate-400">
                          {i.projectName} · {formatDateLong(i.date)}
                          {i.time && ` · ${formatTime(i.time)}`}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  isToday,
  items,
  onOpenItem,
}: {
  day: number;
  inMonth: boolean;
  isToday: boolean;
  items: AllItem[];
  onOpenItem: (item: AllItem) => void;
}) {
  const MAX = 3;
  const visible = items.slice(0, MAX);
  const extra = items.length - visible.length;

  return (
    <div
      className={cx(
        'min-h-[104px] border-b border-r border-slate-200/60 p-1.5 last:border-r-0',
        !inMonth && 'bg-slate-50/40',
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cx(
            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
            isToday ? 'bg-brand-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300',
          )}
        >
          {day}
        </span>
      </div>

      <div className="space-y-1">
        {visible.map((i) => (
          <button
            key={i.key}
            onClick={() => onOpenItem(i)}
            className={cx(
              'flex w-full items-center gap-1 truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight',
              i.kind === 'event'
                ? EVENT_CATEGORY_COLOR[i.category!]
                : i.overdue || i.kind === 'project'
                  ? 'border-red-300 bg-red-100 text-red-800'
                  : 'border-amber-300 bg-amber-100 text-amber-800',
            )}
            title={`${i.title} · ${i.projectName}`}
          >
            {i.time && <span className="shrink-0 tabular-nums opacity-70">{formatTime(i.time)}</span>}
            <span className="truncate">{i.title}</span>
          </button>
        ))}
        {extra > 0 && <div className="pl-1 text-[11px] font-medium text-slate-400">+{extra} more</div>}
      </div>
    </div>
  );
}
