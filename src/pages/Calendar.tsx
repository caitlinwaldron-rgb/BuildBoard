import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  PencilRuler,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import type {
  CalendarEvent,
  Discipline,
  Drawing,
  DrawingStatus,
  EventCategory,
} from '../types';
import {
  DISCIPLINES,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_COLOR,
  EVENT_CATEGORY_DOT,
  ISSUED_STATUSES,
  STATUS_LABEL,
} from '../constants';
import { Button, Field, cx, inputClass } from '../components/ui';
import { ProjectHeader } from '../components/ProjectHeader';
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

/* A unified item placed on a calendar day. */
interface CalItem {
  key: string;
  date: string;
  kind: 'event' | 'drawing' | 'project';
  title: string;
  category?: EventCategory;
  time?: string;
  overdue?: boolean;
  eventId?: string;
  drawingId?: string;
}

const isOverdue = (dueDate: string, status: DrawingStatus) =>
  dueDate < todayISO() && !ISSUED_STATUSES.includes(status);

export function Calendar() {
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

  const today = todayISO();
  const initial = fromISODate(today);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  // Modal state
  const [eventModal, setEventModal] = useState<{ event?: CalendarEvent; date?: string } | null>(null);
  const [drawingModal, setDrawingModal] = useState<{ drawing?: Drawing; date?: string } | null>(null);

  /* Assemble all items keyed by ISO date. */
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    const push = (item: CalItem) => {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    };

    events.forEach((e) =>
      push({
        key: `e-${e.id}`,
        date: e.date,
        kind: 'event',
        title: e.title || '(untitled)',
        category: e.category,
        time: e.startTime,
        eventId: e.id,
      }),
    );

    drawings.forEach((d) => {
      if (!d.dueDate) return;
      push({
        key: `d-${d.id}`,
        date: d.dueDate,
        kind: 'drawing',
        title: `${d.drawingNumber || 'Drawing'}${d.title ? ` — ${d.title}` : ''}`,
        overdue: isOverdue(d.dueDate, d.status),
        drawingId: d.id,
      });
    });

    if (project.dueDate) {
      push({
        key: `p-${project.id}`,
        date: project.dueDate,
        kind: 'project',
        title: 'Project deadline',
        overdue: project.dueDate < today,
      });
    }

    // Sort each day's items: timed events first, then all-day.
    map.forEach((list) =>
      list.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')),
    );
    return map;
  }, [events, drawings, project, today]);

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);

  const upcoming = useMemo(() => {
    const all: CalItem[] = [];
    itemsByDate.forEach((list) => all.push(...list));
    return all
      .filter((i) => i.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'))
      .slice(0, 8);
  }, [itemsByDate, today]);

  const goMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goToday = () => setView({ year: initial.getFullYear(), month: initial.getMonth() });

  return (
    <div>
      <ProjectHeader project={project} title="Calendar" subtitle="Due dates, milestones & meetings">
        <Button icon={<PencilRuler size={15} />} onClick={() => setDrawingModal({})}>
          Add drawing date
        </Button>
        <Button variant="primary" icon={<CalendarPlus size={15} />} onClick={() => setEventModal({})}>
          Add event
        </Button>
      </ProjectHeader>

      <div className="grid gap-5 px-6 py-5 xl:grid-cols-[1fr_18rem]">
        <div>
          {/* Month nav */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => goMonth(-1)}
              className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goMonth(1)}
              className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    iso={iso}
                    day={cell.getDate()}
                    inMonth={inMonth}
                    isToday={isToday}
                    items={items}
                    onAddEvent={() => setEventModal({ date: iso })}
                    onOpenItem={(item) => {
                      if (item.kind === 'event') {
                        const ev = events.find((e) => e.id === item.eventId);
                        if (ev) setEventModal({ event: ev });
                      } else if (item.kind === 'drawing') {
                        const dr = drawings.find((d) => d.id === item.drawingId);
                        if (dr) setDrawingModal({ drawing: dr });
                      }
                    }}
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
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Overdue
            </span>
          </div>
        </div>

        {/* Upcoming sidebar */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-sm text-slate-400">
              Nothing scheduled yet. Add an event or a drawing due date.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((i) => (
                <li
                  key={i.key}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <span
                    className={cx(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      i.kind === 'event'
                        ? EVENT_CATEGORY_DOT[i.category!]
                        : i.kind === 'project'
                          ? 'bg-red-600'
                          : i.overdue
                            ? 'bg-red-600'
                            : 'bg-amber-500',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{i.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatDateLong(i.date)}
                      {i.time && ` · ${formatTime(i.time)}`}
                      {i.overdue && <span className="font-medium text-red-500"> · overdue</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {eventModal && (
        <EventModal
          projectId={projectId}
          event={eventModal.event}
          defaultDate={eventModal.date}
          onClose={() => setEventModal(null)}
        />
      )}
      {drawingModal && (
        <DrawingDateModal
          projectId={projectId}
          drawings={drawings}
          drawing={drawingModal.drawing}
          defaultDate={drawingModal.date}
          onClose={() => setDrawingModal(null)}
        />
      )}
    </div>
  );
}

/* --------------------------------- day cell -------------------------------- */

function DayCell({
  iso,
  day,
  inMonth,
  isToday,
  items,
  onAddEvent,
  onOpenItem,
}: {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  items: CalItem[];
  onAddEvent: () => void;
  onOpenItem: (item: CalItem) => void;
}) {
  const MAX = 3;
  const visible = items.slice(0, MAX);
  const extra = items.length - visible.length;

  return (
    <div
      className={cx(
        'group relative min-h-[104px] border-b border-r border-slate-100 p-1.5 last:border-r-0',
        !inMonth && 'bg-slate-50/60',
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
        <button
          onClick={onAddEvent}
          className="rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-brand-50 hover:text-brand-600 group-hover:opacity-100"
          title={`Add event on ${iso}`}
          aria-label="Add event"
        >
          <CalendarPlus size={14} />
        </button>
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
                : i.kind === 'project'
                  ? 'border-red-300 bg-red-100 text-red-800'
                  : i.overdue
                    ? 'border-red-300 bg-red-100 text-red-800'
                    : 'border-amber-300 bg-amber-100 text-amber-800',
            )}
            title={i.title}
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

/* ------------------------------ modal shell -------------------------------- */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- event modal ------------------------------- */

function EventModal({
  projectId,
  event,
  defaultDate,
  onClose,
}: {
  projectId: string;
  event?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
}) {
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);

  const [title, setTitle] = useState(event?.title ?? '');
  const [category, setCategory] = useState<EventCategory>(event?.category ?? 'meeting');
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayISO());
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [endTime, setEndTime] = useState(event?.endTime ?? '');
  const [attendees, setAttendees] = useState(event?.attendees ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  const valid = title.trim() !== '' && date !== '';

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    const payload = {
      title: title.trim(),
      category,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      attendees: attendees.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (event) updateEvent(event.id, payload);
    else addEvent(projectId, payload);
    onClose();
  };

  return (
    <ModalShell title={event ? 'Edit event' : 'New event'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title" required>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Client design review"
            className={cx(inputClass, submitted && !title.trim() && 'border-red-300')}
          />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition',
                  category === c.value
                    ? c.color
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                )}
              >
                <span className={cx('h-2 w-2 rounded-full', c.dot)} /> {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time">
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </Field>
          <Field label="End time">
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Attendees" hint="Who must attend — comma separated">
          <input
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="e.g. Caitlin, Certifier, Client"
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={cx(inputClass, 'resize-none')}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        {event ? (
          <Button
            variant="danger"
            icon={<Trash2 size={15} />}
            onClick={() => {
              deleteEvent(event.id);
              onClose();
            }}
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {event ? 'Save' : 'Add event'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

/* --------------------------- drawing date modal ---------------------------- */

function DrawingDateModal({
  projectId,
  drawings,
  drawing,
  defaultDate,
  onClose,
}: {
  projectId: string;
  drawings: Drawing[];
  drawing?: Drawing;
  defaultDate?: string;
  onClose: () => void;
}) {
  const addDrawing = useStore((s) => s.addDrawing);
  const updateDrawing = useStore((s) => s.updateDrawing);

  // When editing an existing chip, lock to that drawing. Otherwise choose mode.
  const editing = !!drawing;
  const [mode, setMode] = useState<'existing' | 'new'>(drawings.length > 0 ? 'existing' : 'new');
  const [selectedId, setSelectedId] = useState(drawing?.id ?? drawings[0]?.id ?? '');
  const [date, setDate] = useState(drawing?.dueDate ?? defaultDate ?? todayISO());

  // New drawing fields
  const [number, setNumber] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('A');
  const [submitted, setSubmitted] = useState(false);

  const useExisting = editing || mode === 'existing';
  const valid = date !== '' && (useExisting ? !!selectedId : number.trim() !== '' || title.trim() !== '');

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    if (useExisting) {
      updateDrawing(selectedId, { dueDate: date });
    } else {
      addDrawing(projectId, {
        drawingNumber: number.trim(),
        title: title.trim(),
        discipline,
        dueDate: date,
      });
    }
    onClose();
  };

  const clearDate = () => {
    if (drawing) updateDrawing(drawing.id, { dueDate: undefined });
    onClose();
  };

  return (
    <ModalShell title={editing ? 'Edit drawing due date' : 'Add drawing due date'} onClose={onClose}>
      <div className="space-y-4">
        {!editing && drawings.length > 0 && (
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-sm">
            <button
              onClick={() => setMode('existing')}
              className={cx(
                'flex-1 rounded-md px-3 py-1.5 font-medium transition',
                mode === 'existing' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              Existing drawing
            </button>
            <button
              onClick={() => setMode('new')}
              className={cx(
                'flex-1 rounded-md px-3 py-1.5 font-medium transition',
                mode === 'new' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              New drawing
            </button>
          </div>
        )}

        {useExisting ? (
          <Field label="Drawing" required>
            {editing ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {drawing!.drawingNumber || 'Drawing'}
                {drawing!.title ? ` — ${drawing!.title}` : ''}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {STATUS_LABEL[drawing!.status]}
                </span>
              </div>
            ) : (
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputClass}>
                {drawings.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drawingNumber || '(no number)'} {d.title ? `— ${d.title}` : ''}
                    {d.dueDate ? `  ·  due ${d.dueDate}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <Field label="Drawing number">
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="A-101"
                  className={cx(inputClass, 'font-mono')}
                />
              </Field>
              <Field label="Disc.">
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as Discipline)}
                  className={inputClass}
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ground Floor Plan"
                className={cx(inputClass, submitted && !valid && 'border-red-300')}
              />
            </Field>
          </>
        )}

        <Field label="Due date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        {editing ? (
          <Button variant="danger" icon={<CalendarDays size={15} />} onClick={clearDate}>
            Remove due date
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
