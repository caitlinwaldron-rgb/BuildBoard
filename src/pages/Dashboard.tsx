import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CalendarRange,
  Check,
  FolderPlus,
  GripVertical,
  HardHat,
  Hammer,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { generateSampleProject, PROJECT_TYPE_LABELS } from '../lib/sampleProject';
import type { ProjectType } from '../lib/sampleProject';

const SAMPLE_TYPE_CYCLE: ProjectType[] = [
  'residential_house',
  'multi_residential',
  'commercial_office',
  'education',
  'mixed_use',
];
import { useStore } from '../store';
import { Button, cx } from '../components/ui';
import { MONTH_NAMES, formatDateLong, fromISODate, monthGrid, toISODate, todayISO } from '../lib/dates';
import type { Project } from '../types';

/** Folder tints drawn from the icecubes palette — ice white → periwinkle. */
const FOLDER_TINTS = [
  { id: 'honeydew', label: 'Ice', body: 'bg-honeydew', circle: 'text-[#4a47b0]', dot: 'bg-[#6f6fdd]', swatch: '#EFEFFB' },
  { id: 'lightcyan', label: 'Lavender', body: 'bg-lightcyan', circle: 'text-[#4a47b0]', dot: 'bg-[#8c8cea]', swatch: '#DEDFF8' },
  { id: 'frosted', label: 'Sky', body: 'bg-frosted/80', circle: 'text-[#34488c]', dot: 'bg-[#5b7fd6]', swatch: '#C3D6F5' },
  { id: 'wisteria', label: 'Blue', body: 'bg-wisteria/60', circle: 'text-[#33397f]', dot: 'bg-[#5b59cf]', swatch: '#9FB4EE' },
  { id: 'slateblue', label: 'Periwinkle', body: 'bg-slateblue/55', circle: 'text-[#33337a]', dot: 'bg-[#5b59cf]', swatch: '#8C8CEA' },
];

type Tint = (typeof FOLDER_TINTS)[number];
const TINT_BY_ID = Object.fromEntries(FOLDER_TINTS.map((t) => [t.id, t])) as Record<string, Tint>;

/** Resolve a project's tint: explicit choice, else a stable hash of its id. */
function tintFor(p: Project): Tint {
  if (p.color && TINT_BY_ID[p.color]) return TINT_BY_ID[p.color];
  let h = 0;
  for (const ch of p.id) h = (h + ch.charCodeAt(0)) % FOLDER_TINTS.length;
  return FOLDER_TINTS[h];
}

interface SuccessResult {
  typeLabel: string;
  drawings: number;
  assessments: number;
  events: number;
  documents: number;
}

export function Dashboard() {
  const projects    = useStore((s) => s.projects);
  const drawings    = useStore((s) => s.drawings);
  const bulkImport  = useStore((s) => s.bulkImport);
  const events = useStore((s) => s.events);
  const deleteProject = useStore((s) => s.deleteProject);
  const updateProject = useStore((s) => s.updateProject);
  const reorderProject = useStore((s) => s.reorderProject);
  const navigate = useNavigate();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Generate sample project dialog + success toast
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cycles through all 5 project types so each generation is a different type
  const generateIndexRef = useRef(0);

  // Sparkle cursor effect — fires for 3 s when generation starts
  const sparkleActiveRef = useRef(false);
  const sparkleCleanupRef = useRef<(() => void) | null>(null);

  const startSparkle = useCallback(() => {
    if (sparkleCleanupRef.current) sparkleCleanupRef.current();
    sparkleActiveRef.current = true;

    const COLORS = ['#a78bfa', '#818cf8', '#c4b5fd', '#e0e7ff', '#f0abfc', '#ffffff'];
    const CHARS  = ['✦', '✧', '★', '◆', '·', '✶'];

    const handleMove = (e: MouseEvent) => {
      if (!sparkleActiveRef.current) return;
      if (Math.random() > 0.55) return; // skip ~45 % of moves for performance
      const el = document.createElement('span');
      el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      const tx = (Math.random() - 0.5) * 70;
      const ty = -(20 + Math.random() * 50);
      el.style.cssText = [
        'position:fixed',
        `left:${e.clientX}px`,
        `top:${e.clientY}px`,
        'pointer-events:none',
        'z-index:9999',
        `color:${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
        `font-size:${8 + Math.random() * 14}px`,
        'line-height:1',
        `--tx:${tx}px`,
        `--ty:${ty}px`,
        'animation:bb-sparkle 0.75s ease-out forwards',
      ].join(';');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    };

    window.addEventListener('mousemove', handleMove);
    const timer = setTimeout(() => {
      sparkleActiveRef.current = false;
      window.removeEventListener('mousemove', handleMove);
    }, 3000);

    sparkleCleanupRef.current = () => {
      clearTimeout(timer);
      sparkleActiveRef.current = false;
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  useEffect(() => () => { sparkleCleanupRef.current?.(); }, []);

  const handleGenerate = useCallback(() => {
    setConfirmOpen(false);
    startSparkle();
    const type = SAMPLE_TYPE_CYCLE[generateIndexRef.current % SAMPLE_TYPE_CYCLE.length];
    generateIndexRef.current += 1;
    const sample = generateSampleProject(type);
    bulkImport({
      project:     sample.project,
      drawings:    sample.drawings,
      documents:   sample.documents,
      assessments: sample.assessments,
      events:      sample.events,
    });
    const result: SuccessResult = {
      typeLabel:   sample.typeLabel,
      drawings:    sample.drawings.length,
      assessments: sample.assessments.length,
      events:      sample.events.length,
      documents:   sample.documents.length,
    };
    setSuccessResult(result);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessResult(null), 6000);
  }, [bulkImport, startSparkle]);

  const countFor = (pid: string) => drawings.filter((d) => d.projectId === pid).length;

  // Combined upcoming-item count across all projects, for the calendar banner.
  const today = todayISO();
  const upcomingCount = useMemo(() => {
    const dwg = drawings.filter((d) => d.dueDate && d.dueDate >= today).length;
    const evt = events.filter((e) => e.date >= today).length;
    const proj = projects.filter((p) => p.dueDate && p.dueDate >= today).length;
    return dwg + evt + proj;
  }, [drawings, events, projects, today]);

  // Dates (this month) that have any scheduled item — for the mini preview dots.
  const itemDates = useMemo(() => {
    const s = new Set<string>();
    drawings.forEach((d) => d.dueDate && s.add(d.dueDate));
    events.forEach((e) => s.add(e.date));
    projects.forEach((p) => p.dueDate && s.add(p.dueDate));
    return s;
  }, [drawings, events, projects]);

  return (
    <div className="app-bg min-h-screen">
      {/* Top bar */}
      <header className="border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <HardHat size={20} />
            </div>
            <span className="text-lg font-bold text-slate-900">BuildBoard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              icon={<Sparkles size={16} />}
              onClick={() => setConfirmOpen(true)}
              className="border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
            >
              Generate Sample Project
            </Button>
            <Link to="/calendar">
              <Button icon={<CalendarRange size={16} />}>Calendar</Button>
            </Link>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/project/new')}>
              New project
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero */}
        <section className="mb-8">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/30 p-8 shadow-xl sm:p-10"
            style={{
              backgroundImage:
                'radial-gradient(120% 110% at 82% 8%, rgba(255,255,255,0.45), transparent 52%),' +
                'radial-gradient(110% 120% at 8% 95%, rgba(143,143,236,0.55), transparent 55%),' +
                'linear-gradient(135deg, #8b8be6 0%, #6f6fdd 55%, #4a47b0 100%)',
            }}
          >
            {/* iridescent glow blobs */}
            <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-72 rounded-full bg-violet-300/40 blur-3xl" />

            {/* construction icon */}
            <Hammer className="absolute right-6 top-6 h-32 w-32 opacity-30 sm:right-10 sm:h-44 sm:w-44" strokeWidth={1} color="white" />

            <div className="relative flex min-h-[300px] flex-col">
              {/* decorative stars */}
              <span className="pointer-events-none absolute left-2 top-4 select-none text-white/60" style={{ fontSize: '1.1rem' }}>✦</span>
              <span className="pointer-events-none absolute left-16 top-10 select-none text-white/35" style={{ fontSize: '0.55rem' }}>✦</span>
              <span className="pointer-events-none absolute left-8 top-20 select-none text-white/45" style={{ fontSize: '0.75rem' }}>✧</span>
              <span className="pointer-events-none absolute left-32 top-3 select-none text-white/25" style={{ fontSize: '0.45rem' }}>✦</span>
              <span className="pointer-events-none absolute left-44 top-14 select-none text-white/50" style={{ fontSize: '1.3rem' }}>✧</span>
              <span className="pointer-events-none absolute left-52 top-6 select-none text-white/20" style={{ fontSize: '0.4rem' }}>✦</span>
              <span className="pointer-events-none absolute left-24 top-32 select-none text-white/30" style={{ fontSize: '0.6rem' }}>✦</span>
              <span className="pointer-events-none absolute right-40 top-8 select-none text-white/25" style={{ fontSize: '0.5rem' }}>✧</span>
              <span className="pointer-events-none absolute right-28 top-20 select-none text-white/40" style={{ fontSize: '0.8rem' }}>✦</span>
              <span className="pointer-events-none absolute right-40 bottom-24 select-none text-white/50" style={{ fontSize: '0.9rem' }}>✦</span>
              <span className="pointer-events-none absolute right-52 bottom-16 select-none text-white/30" style={{ fontSize: '0.5rem' }}>✦</span>
              <span className="pointer-events-none absolute right-20 bottom-10 select-none text-white/40" style={{ fontSize: '1.0rem' }}>✧</span>
              <span className="pointer-events-none absolute right-64 bottom-6 select-none text-white/20" style={{ fontSize: '0.45rem' }}>✦</span>
              <span className="pointer-events-none absolute left-4 bottom-12 select-none text-white/40" style={{ fontSize: '0.65rem' }}>✧</span>
              <span className="pointer-events-none absolute left-20 bottom-6 select-none text-white/25" style={{ fontSize: '0.5rem' }}>✦</span>
              <span className="pointer-events-none absolute left-36 bottom-16 select-none text-white/35" style={{ fontSize: '0.7rem' }}>✦</span>
              <span className="pointer-events-none absolute left-60 bottom-8 select-none text-white/20" style={{ fontSize: '0.4rem' }}>✧</span>

              <h1 className="mt-auto leading-[0.88] text-white drop-shadow-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontStyle: 'italic' }}>
                <span className="block" style={{ fontSize: 'clamp(4rem, 10vw, 6.5rem)' }}>build</span>
                <span className="block" style={{ fontSize: 'clamp(4rem, 10vw, 6.5rem)' }}>board</span>
              </h1>

              <p className="mt-8 max-w-lg text-xs leading-relaxed text-white/85">
                BuildBoard is an offline-first drawing register, NCC compliance tracker and
                deliverable planner for architects working under the National Construction Code.
                Track every drawing, clause obligation, milestone and deadline — all in your browser,
                no account required.
              </p>
            </div>
          </div>
        </section>

        {/* Two columns — combined calendar (left) · projects (right) */}
        <div className="grid items-start gap-6 md:grid-cols-2">
          {/* Left — combined calendar (compact) + preview */}
          <div className="space-y-4">
            <Link
              to="/calendar"
              className="group flex items-center gap-3 rounded-2xl border border-white/30 p-4 text-white shadow-lg transition hover:shadow-xl"
              style={{
                backgroundImage:
                  'radial-gradient(120% 90% at 90% 6%, rgba(255,255,255,0.28), transparent 55%),' +
                  'linear-gradient(135deg, #8b8be6 0%, #6f6fdd 58%, #5b59cf 100%)',
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <CalendarRange size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold">Combined calendar</h2>
                <p className="text-xs text-white/85">
                  {upcomingCount > 0 ? `${upcomingCount} upcoming across all projects` : 'All projects in one view'}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="ml-auto shrink-0 text-white/85 transition group-hover:translate-x-0.5"
              />
            </Link>

            {/* Mini calendar preview */}
            <Link
              to="/calendar"
              className="block rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-xl transition hover:bg-white/70 hover:shadow-md"
            >
              <MiniCalendar today={today} itemDates={itemDates} />
            </Link>

            {/* New-project folder — under the calendar */}
            <Link to="/project/new" className="group block text-slate-400 transition group-hover:text-brand-600">
              {/* folder tab — in flow, no overlap */}
              <div className="h-5 w-2/5 rounded-t-xl border-2 border-b-0 border-dashed border-slate-300/80 bg-white/40 transition group-hover:border-brand-400" />
              {/* card body */}
              <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl rounded-tl-none border-2 border-dashed border-slate-300/80 bg-white/40 backdrop-blur transition group-hover:-translate-y-0.5 group-hover:border-brand-400">
                <FolderPlus size={26} />
                <span className="mt-2 text-sm font-semibold">New project</span>
              </div>
            </Link>
          </div>

          {/* Right — projects (draggable to reorder) */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Projects {projects.length > 0 && <span className="text-slate-400">({projects.length})</span>}
            </h2>

            {projects.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-5 py-10 text-center text-sm text-slate-400 backdrop-blur">
                No projects yet — create your first with the folder on the left.
              </p>
            ) : (
              <div className="flex flex-col gap-7">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', p.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragId(p.id);
                    }}
                    onDragEnter={() => setOverId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData('text/plain');
                      if (draggedId && draggedId !== p.id) reorderProject(draggedId, p.id);
                      setDragId(null);
                      setOverId(null);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    className={cx(
                      'cursor-grab transition active:cursor-grabbing',
                      dragId === p.id && 'opacity-40',
                      overId === p.id && dragId && dragId !== p.id && 'ring-2 ring-brand-500',
                    )}
                  >
                    <ProjectFolder
                      project={p}
                      tint={tintFor(p)}
                      drawingCount={countFor(p.id)}
                      onColorChange={(colorId) => updateProject(p.id, { color: colorId })}
                      onDelete={() => {
                        if (confirm(`Delete project "${p.name}" and all its drawings?`))
                          deleteProject(p.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Confirmation dialog ───────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-3xl border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => setConfirmOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
              <Sparkles size={24} className="text-brand-600" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">generate sample project?</h2>
            <p className="mb-1 text-sm leading-relaxed text-slate-600">
              this will populate the application with a realistic sample project for testing and
              demonstration purposes — including drawings, ncc assessments, documents and calendar
              milestones.
            </p>
            <p className="mb-6 text-xs font-semibold text-brand-600">
              next up: {PROJECT_TYPE_LABELS[SAMPLE_TYPE_CYCLE[generateIndexRef.current % SAMPLE_TYPE_CYCLE.length]]}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 active:scale-95"
              >
                <Sparkles size={15} />
                generate
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success toast ─────────────────────────────────────────────── */}
      {successResult && (
        <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-2xl">
          <div className="bg-brand-600 px-4 py-3 flex items-center gap-2">
            <Sparkles size={16} className="text-white/90" />
            <span className="text-sm font-semibold text-white">sample project generated!</span>
            <button
              onClick={() => setSuccessResult(null)}
              className="ml-auto text-white/70 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {successResult.typeLabel}
            </p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                <span>drawings created</span>
                <span className="font-bold text-slate-900">{successResult.drawings}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>ncc assessments</span>
                <span className="font-bold text-slate-900">{successResult.assessments}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>calendar events</span>
                <span className="font-bold text-slate-900">{successResult.events}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>supporting documents</span>
                <span className="font-bold text-slate-900">{successResult.documents}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectFolder({
  project: p,
  tint,
  drawingCount,
  onDelete,
  onColorChange,
}: {
  project: Project;
  tint: Tint;
  drawingCount: number;
  onDelete: () => void;
  onColorChange: (colorId: string) => void;
}) {
  const overdue = !!p.dueDate && p.dueDate < todayISO();
  const classes = p.buildingClasses;
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Link
      to={`/project/${p.id}`}
      draggable={false}
      className="group block"
    >
      {/* folder tab — in normal flow so it joins seamlessly with card body */}
      <div className={cx('h-5 w-2/5 rounded-t-xl', tint.body)} />
      <div className={cx(
        'relative flex min-h-[200px] flex-col rounded-2xl rounded-tl-none p-5 shadow-sm transition duration-200 group-hover:shadow-xl',
        tint.body,
      )}>

      {/* top-right controls: drag hint · colour · delete */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <span
          className="cursor-grab text-slate-400/70 opacity-0 transition group-hover:opacity-100"
          title="Drag to reorder"
        >
          <GripVertical size={15} />
        </span>

        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPickerOpen((o) => !o);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/80 text-slate-500 shadow-sm transition hover:scale-105"
            style={{ backgroundColor: tint.swatch }}
            title="Folder colour"
            aria-label="Choose folder colour"
          >
            <Palette size={12} className="opacity-0 group-hover:opacity-70" />
          </button>

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.preventDefault();
                  setPickerOpen(false);
                }}
              />
              <div className="absolute right-0 top-8 z-30 flex gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {FOLDER_TINTS.map((t) => (
                  <button
                    key={t.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onColorChange(t.id);
                      setPickerOpen(false);
                    }}
                    className={cx(
                      'flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition hover:scale-110',
                      tint.id === t.id ? 'border-slate-400' : 'border-slate-200',
                    )}
                    style={{ backgroundColor: t.swatch }}
                    title={t.label}
                  >
                    {tint.id === t.id && <Check size={12} className="text-slate-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-white/70 hover:text-red-500 group-hover:opacity-100"
          title="Delete project"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* "Shared with" → building classes as avatar-style circles */}
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500/90">
        Building class
      </div>
      <div className="mt-2 flex items-center">
        {classes.slice(0, 4).map((c, idx) => (
          <span
            key={c}
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-[11px] font-bold shadow-sm',
              tint.circle,
              idx > 0 && '-ml-2',
            )}
            title={c}
          >
            {c.replace('Class ', '')}
          </span>
        ))}
        {classes.length > 4 && (
          <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-[11px] font-bold text-slate-500 shadow-sm">
            +{classes.length - 4}
          </span>
        )}
      </div>

      {/* Folder name + meta */}
      <div className="mt-auto pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500/90">
          Project
        </div>
        <h3 className="mt-0.5 text-lg font-bold leading-snug text-slate-900">{p.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span>{drawingCount} drawing{drawingCount === 1 ? '' : 's'}</span>
          {p.dueDate && (
            <>
              <span className="text-slate-400">·</span>
              <span className={cx('inline-flex items-center gap-1', overdue && 'font-semibold text-red-600')}>
                <CalendarClock size={12} /> {formatDateLong(p.dueDate)}
                {overdue && ' · overdue'}
              </span>
            </>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
}

/** Compact current-month grid with dots on days that have scheduled items. */
function MiniCalendar({ today, itemDates }: { today: string; itemDates: Set<string> }) {
  const base = fromISODate(today);
  const year = base.getFullYear();
  const month = base.getMonth();
  const cells = monthGrid(year, month);
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <span className="text-xs font-semibold text-brand-600">View all →</span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {w}
          </span>
        ))}
        {cells.map((cell) => {
          const iso = toISODate(cell);
          const inMonth = cell.getMonth() === month;
          const isToday = iso === today;
          const hasItem = inMonth && itemDates.has(iso);
          return (
            <div key={iso} className="flex flex-col items-center">
              <span
                className={cx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px]',
                  isToday
                    ? 'bg-brand-600 font-bold text-white'
                    : inMonth
                      ? 'text-slate-700'
                      : 'text-slate-300',
                )}
              >
                {cell.getDate()}
              </span>
              <span
                className={cx(
                  'mt-0.5 leading-none text-brand-500 transition-opacity',
                  hasItem ? 'opacity-100' : 'opacity-0',
                )}
                style={{ fontSize: '0.6rem' }}
              >★</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
