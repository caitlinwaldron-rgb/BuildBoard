import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Clock,
  Download,
  FileStack,
  FileText,
  Grid3x3,
  ListChecks,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../store';
import { ISSUED_STATUSES } from '../constants';
import { formatDateLong, todayISO } from '../lib/dates';
import { cx } from '../components/ui';

interface SectionCard {
  to: string;
  title: string;
  description: string;
  icon: typeof Table2;
  glyph: typeof Table2;
  stat: string;
  /** soft card gradient */
  grad: string;
  /** accent colour for the icon tile */
  tile: string;
  glyphText: string;
}

export function Overview() {
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
  const stats = useMemo(() => {
    const total = drawings.length;
    const issued = drawings.filter((d) => ISSUED_STATUSES.includes(d.status)).length;
    const overdue = drawings.filter(
      (d) => d.dueDate && d.dueDate < today && !ISSUED_STATUSES.includes(d.status),
    ).length;
    const clauses = new Set(drawings.flatMap((d) => d.nccClauses)).size;

    // Next upcoming date across drawings, events and the project deadline.
    const upcoming = [
      ...drawings.filter((d) => d.dueDate && d.dueDate >= today).map((d) => d.dueDate!),
      ...events.filter((e) => e.date >= today).map((e) => e.date),
      ...(project.dueDate && project.dueDate >= today ? [project.dueDate] : []),
    ].sort();

    return { total, issued, overdue, clauses, events: events.length, next: upcoming[0] };
  }, [drawings, events, project, today]);

  const cards: SectionCard[] = [
    {
      to: 'register',
      title: 'Drawing Register',
      description: 'Flat register of every sheet — status, revision, due dates and clause tags.',
      icon: Table2,
      glyph: FileStack,
      stat: `${stats.total} drawing${stats.total === 1 ? '' : 's'}`,
      grad: 'from-frosted/60 to-lightcyan/40',
      tile: 'bg-[#5b7fd6]',
      glyphText: 'text-[#34488c]',
    },
    {
      to: 'matrix',
      title: 'NCC Self-Assessment',
      description: 'Self-audit every NCC clause for supporting documentation evidence before submission.',
      icon: ShieldCheck,
      glyph: Grid3x3,
      stat: `${stats.clauses} clause${stats.clauses === 1 ? '' : 's'} tagged`,
      grad: 'from-wisteria/55 to-lightcyan/40',
      tile: 'bg-[#7f96e0]',
      glyphText: 'text-[#33397f]',
    },
    {
      to: 'tracker',
      title: 'Deliverable Tracker',
      description: 'Milestone rollup across DA / CC / Construction with issued progress.',
      icon: ListChecks,
      glyph: TrendingUp,
      stat: `${stats.issued}/${stats.total} issued`,
      grad: 'from-slateblue/45 to-lightcyan/40',
      tile: 'bg-[#6f6fdd]',
      glyphText: 'text-[#4a47b0]',
    },
    {
      to: 'calendar',
      title: 'Calendar',
      description: 'Due dates, milestones & meetings on a monthly board. Overdue flagged red.',
      icon: CalendarDays,
      glyph: Clock,
      stat: stats.overdue > 0 ? `${stats.overdue} overdue` : `${stats.events} event${stats.events === 1 ? '' : 's'}`,
      grad: 'from-lightcyan/80 to-frosted/40',
      tile: 'bg-[#8c8cea]',
      glyphText: 'text-[#4a47b0]',
    },
    {
      to: 'outputs',
      title: 'Outputs',
      description: 'Export the register, NCC matrix, tracker and schedule to PDF & Excel.',
      icon: Download,
      glyph: FileText,
      stat: '4 reports',
      grad: 'from-brand-100/90 to-brand-50/50',
      tile: 'bg-brand-600',
      glyphText: 'text-brand-700',
    },
    {
      to: 'settings',
      title: 'Settings',
      description: 'Project metadata, building classes, NCC volumes and certifier details.',
      icon: SettingsIcon,
      glyph: SlidersHorizontal,
      stat: project.nccVolumes.join(' · ') || 'Configure',
      grad: 'from-honeydew/90 to-white/40',
      tile: 'bg-[#7b7fc8]',
      glyphText: 'text-[#4a47b0]',
    },
  ];

  const projectOverdue = !!project.dueDate && project.dueDate < today;

  return (
    <div className="px-6 py-7">
      <div className="mx-auto max-w-6xl">
        {/* Glass header panel */}
        <header className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-sm backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600/80">
                Project overview
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{project.name}</h1>
              {project.address && <p className="mt-1 text-sm text-slate-500">{project.address}</p>}
            </div>
            {project.dueDate && (
              <div
                className={cx(
                  'flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium backdrop-blur',
                  projectOverdue
                    ? 'border-red-200/70 bg-red-50/70 text-red-700'
                    : 'border-white/70 bg-white/60 text-slate-700',
                )}
              >
                <CalendarClock size={16} />
                <span>
                  <span className="text-xs font-normal text-slate-400">Key deadline</span>
                  <br />
                  {formatDateLong(project.dueDate)}
                  {projectOverdue && ' · overdue'}
                </span>
              </div>
            )}
          </div>

          {/* Metadata chips — echoes the breadcrumb row in the reference */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {project.buildingClasses.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
            {project.nccVolumes.map((v) => (
              <Chip key={v} accent>
                {v}
              </Chip>
            ))}
            {project.daNumber && <Chip>DA {project.daNumber}</Chip>}
            {project.ccNumber && <Chip>CC {project.ccNumber}</Chip>}
            {project.certifier && <Chip>{project.certifier}</Chip>}
          </div>

          {/* Quick stats row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Drawings" value={String(stats.total)} />
            <Stat label="Issued" value={`${stats.issued}/${stats.total}`} />
            <Stat
              label="Overdue"
              value={String(stats.overdue)}
              tone={stats.overdue > 0 ? 'danger' : undefined}
            />
            <Stat label="Next due" value={stats.next ? formatDateLong(stats.next) : '—'} />
          </div>

          {stats.overdue > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200/70 bg-red-50/70 px-4 py-2.5 text-sm text-red-700 backdrop-blur">
              <AlertTriangle size={16} />
              {stats.overdue} drawing{stats.overdue === 1 ? '' : 's'} past due and not yet issued.
            </div>
          )}
        </header>

        {/* Section cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            const Glyph = c.glyph;
            return (
              <Link
                key={c.to}
                to={c.to}
                className={cx(
                  'group relative flex min-h-[210px] flex-col rounded-2xl border border-white/60 bg-gradient-to-br p-5 shadow-sm backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-xl',
                  c.grad,
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={cx(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm',
                      c.tile,
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/70 shadow-sm">
                    <Glyph size={18} className={c.glyphText} />
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{c.description}</p>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    <span className={cx('h-1.5 w-1.5 rounded-full', c.tile)} />
                    {c.stat}
                  </span>
                  <span className="text-sm font-medium text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700">
                    Open →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cx(
        'rounded-full border px-3 py-1 text-xs font-medium backdrop-blur',
        accent
          ? 'border-brand-200/70 bg-brand-50/70 text-brand-700'
          : 'border-white/70 bg-white/55 text-slate-600',
      )}
    >
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger';
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={cx(
          'mt-0.5 truncate text-lg font-bold',
          tone === 'danger' ? 'text-red-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}
