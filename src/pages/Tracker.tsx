import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle, FileDown, ListChecks } from 'lucide-react';
import { useStore } from '../store';
import {
  DISCIPLINE_COLORS,
  MILESTONES,
  MILESTONE_ISSUED_STATUS,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../constants';
import { Badge, Button, EmptyState, cx } from '../components/ui';
import { ProjectHeader } from '../components/ProjectHeader';
import { exportTrackerExcel, exportTrackerPdf } from '../lib/export';

export function Tracker() {
  const { id } = useParams();
  const projectId = id!;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))!;
  const allDrawings = useStore((s) => s.drawings);
  const drawings = useMemo(
    () => allDrawings.filter((d) => d.projectId === projectId),
    [allDrawings, projectId],
  );

  const byMilestone = useMemo(
    () =>
      MILESTONES.map((m) => {
        const rows = drawings
          .filter((d) => d.milestones.includes(m))
          .sort((a, b) => a.drawingNumber.localeCompare(b.drawingNumber, undefined, { numeric: true }));
        const issued = rows.filter((d) => MILESTONE_ISSUED_STATUS[m].includes(d.status)).length;
        return { milestone: m, rows, issued };
      }).filter((g) => g.rows.length > 0),
    [drawings],
  );

  if (drawings.length === 0) {
    return (
      <div>
        <ProjectHeader project={project} title="Deliverable status tracker" />
        <div className="px-6 py-6">
          <EmptyState icon={<ListChecks size={40} />} title="Nothing to track yet" description="Tag drawings with deliverable milestones (DA, CC, Construction…) to see status rollups here." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProjectHeader project={project} title="Deliverable status tracker">
        <Button icon={<FileDown size={15} />} onClick={() => exportTrackerExcel(project, drawings)}>
          Excel
        </Button>
        <Button icon={<FileDown size={15} />} onClick={() => exportTrackerPdf(project, drawings)}>
          PDF
        </Button>
      </ProjectHeader>

      <div className="space-y-5 px-6 py-5">
        {byMilestone.length === 0 && (
          <EmptyState title="No milestones assigned" description="Open the register and tag drawings with a milestone to populate this view." />
        )}

        {byMilestone.map(({ milestone, rows, issued }) => {
          const pct = Math.round((issued / rows.length) * 100);
          return (
            <section key={milestone} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-900">{milestone}</h2>
                  <Badge className="border-slate-200 bg-slate-50 text-slate-500">
                    {rows.length} drawings
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {issued}/{rows.length} issued
                  </span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cx('h-full rounded-full', pct === 100 ? 'bg-green-500' : 'bg-brand-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-semibold text-slate-600">{pct}%</span>
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {rows.map((d) => {
                    const issuedForM = MILESTONE_ISSUED_STATUS[milestone].includes(d.status);
                    return (
                      <tr key={d.id} className="border-b border-slate-50 last:border-0">
                        <td className="w-8 py-2 pl-4">
                          {issuedForM ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <Circle size={16} className="text-slate-300" />
                          )}
                        </td>
                        <td className="w-28 py-2 font-mono text-xs font-semibold text-slate-700">
                          {d.drawingNumber || '—'}
                        </td>
                        <td className="py-2 text-slate-700">{d.title || <span className="text-slate-300">Untitled</span>}</td>
                        <td className="w-20 py-2">
                          <Badge className={DISCIPLINE_COLORS[d.discipline]}>{d.discipline}</Badge>
                        </td>
                        <td className="w-44 py-2 pr-4 text-right">
                          <Badge className={STATUS_COLOR[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}
