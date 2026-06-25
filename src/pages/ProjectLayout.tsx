import { NavLink, Outlet, useParams, Link, Navigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  Download,
  HardHat,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  Table2,
  User,
} from 'lucide-react';
import { useStore } from '../store';
import { cx } from '../components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

// Main section icons (top group)
const MAIN_NAV: NavItem[] = [
  { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: 'register', label: 'Drawing register', icon: Table2, end: false },
  { to: 'matrix', label: 'NCC self-assessment', icon: ShieldCheck, end: false },
  { to: 'tracker', label: 'Deliverable tracker', icon: ListChecks, end: false },
  { to: 'calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: 'outputs', label: 'Outputs', icon: Download, end: false },
];

export function ProjectLayout() {
  const { id } = useParams();
  const project = useStore((s) => s.projects.find((p) => p.id === id));

  if (!project) return <Navigate to="/" replace />;

  return (
    <div className="app-bg flex min-h-screen">
      <aside className="no-print sticky top-0 z-40 flex h-screen w-[76px] shrink-0 flex-col items-center border-r border-white/40 bg-white/25 py-4 backdrop-blur-xl">
        {/* Logo mark */}
        <Link
          to="/"
          aria-label="BuildBoard — all projects"
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600/90 text-white shadow-sm shadow-brand-600/30 backdrop-blur transition hover:bg-brand-600"
        >
          <HardHat size={22} />
          <Tooltip label="All projects" />
        </Link>

        {/* Main nav */}
        <nav className="mt-6 flex flex-1 flex-col items-center gap-1.5">
          {MAIN_NAV.map((item) => (
            <RailLink key={item.to} item={item} />
          ))}
        </nav>

        {/* Footer group: settings + account */}
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <RailLink
            item={{ to: 'settings', label: 'Settings', icon: SettingsIcon, end: false }}
          />
          <Link
            to="/"
            aria-label="Back to all projects"
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/50 hover:text-slate-800"
          >
            <ChevronLeft size={19} />
            <Tooltip label="All projects" />
          </Link>
          <div className="my-1 h-px w-7 bg-white/50" />
          <div
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400/90 to-brand-600/90 text-white shadow-sm backdrop-blur"
            aria-label="Account"
          >
            <User size={17} />
            <Tooltip label="Account" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function RailLink({ item }: { item: NavItem }) {
  const { icon: Icon, label, to, end } = item;
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        cx(
          'group relative flex h-11 w-11 items-center justify-center rounded-xl backdrop-blur transition',
          isActive
            ? 'bg-white/60 text-brand-700 shadow-sm ring-1 ring-white/60'
            : 'text-slate-500 hover:bg-white/40 hover:text-slate-800',
        )
      }
    >
      <Icon size={19} />
      <Tooltip label={label} />
    </NavLink>
  );
}

/** Hover tooltip that appears to the right of an icon-only rail button. */
function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full z-50 ml-3 origin-left scale-95 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
      {label}
    </span>
  );
}
