import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { BUILDING_CLASSES } from '../constants';
import type { BuildingClass, NCCVolume } from '../types';
import { Button, Field, cx, inputClass } from '../components/ui';
import { ProjectHeader } from '../components/ProjectHeader';

export function Settings() {
  const { id } = useParams();
  const projectId = id!;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))!;
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const navigate = useNavigate();

  const [name, setName] = useState(project.name);
  const [address, setAddress] = useState(project.address);
  const [classes, setClasses] = useState<BuildingClass[]>(project.buildingClasses);
  const [daNumber, setDaNumber] = useState(project.daNumber ?? '');
  const [ccNumber, setCcNumber] = useState(project.ccNumber ?? '');
  const [certifier, setCertifier] = useState(project.certifier ?? '');
  const [dueDate, setDueDate] = useState(project.dueDate ?? '');
  const [saved, setSaved] = useState(false);

  const volumes: NCCVolume[] = [
    ...new Set(
      classes
        .map((c) => BUILDING_CLASSES.find((b) => b.value === c)?.volume)
        .filter(Boolean) as NCCVolume[],
    ),
  ];

  const toggleClass = (c: BuildingClass) =>
    setClasses((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const save = () => {
    updateProject(projectId, {
      name: name.trim() || project.name,
      address: address.trim(),
      buildingClasses: classes,
      nccVolumes: volumes.length ? volumes : project.nccVolumes,
      daNumber: daNumber.trim() || undefined,
      ccNumber: ccNumber.trim() || undefined,
      certifier: certifier.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <ProjectHeader project={project} title="Project settings">
        <Button variant="primary" icon={saved ? <Check size={15} /> : undefined} onClick={save}>
          {saved ? 'Saved' : 'Save changes'}
        </Button>
      </ProjectHeader>

      <div className="max-w-2xl space-y-6 px-6 py-6">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Project name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Site address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </Field>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Building class(es)</span>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {BUILDING_CLASSES.map((c) => {
                const active = classes.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleClass(c.value)}
                    className={cx(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                      )}
                    >
                      {active && <Check size={12} />}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">NCC volume(s): {volumes.join(', ') || '—'}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="DA number">
              <input value={daNumber} onChange={(e) => setDaNumber(e.target.value)} className={inputClass} />
            </Field>
            <Field label="CC number">
              <input value={ccNumber} onChange={(e) => setCcNumber(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Certifier">
              <input value={certifier} onChange={(e) => setCertifier(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Key deadline" hint="Headline project due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
          <p className="mt-1 text-sm text-slate-500">
            Deleting this project removes all of its drawings and clause tags. This cannot be undone.
          </p>
          <Button
            variant="danger"
            icon={<Trash2 size={15} />}
            className="mt-3"
            onClick={() => {
              if (confirm(`Delete "${project.name}" and all its drawings? This cannot be undone.`)) {
                deleteProject(projectId);
                navigate('/');
              }
            }}
          >
            Delete project
          </Button>
        </div>
      </div>
    </div>
  );
}
