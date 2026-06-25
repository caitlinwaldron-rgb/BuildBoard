import type { ReactNode } from 'react';
import type { Project } from '../types';

export function ProjectHeader({
  project,
  title,
  subtitle,
  children,
}: {
  project: Project;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {project.name}
            {subtitle && <span className="text-slate-400"> · {subtitle}</span>}
          </p>
        </div>
        {children && <div className="no-print flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
