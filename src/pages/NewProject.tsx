import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../store';
import { BUILDING_CLASSES, NCC_VOLUMES } from '../constants';
import type { BuildingClass, NCCVolume } from '../types';
import { Button, Field, cx, inputClass } from '../components/ui';

export function NewProject() {
  const createProject = useStore((s) => s.createProject);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [classes, setClasses] = useState<BuildingClass[]>([]);
  const [daNumber, setDaNumber] = useState('');
  const [certifier, setCertifier] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Volumes are derived from the selected classes, but stay editable.
  const derivedVolumes = useMemo<NCCVolume[]>(() => {
    const set = new Set<NCCVolume>();
    classes.forEach((c) => {
      const meta = BUILDING_CLASSES.find((b) => b.value === c);
      if (meta) set.add(meta.volume);
    });
    return [...set];
  }, [classes]);

  const toggleClass = (c: BuildingClass) =>
    setClasses((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const valid = name.trim() !== '' && classes.length > 0;

  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    const id = createProject({
      name: name.trim(),
      address: address.trim(),
      buildingClasses: classes,
      nccVolumes: derivedVolumes.length ? derivedVolumes : ['Volume 1'],
      daNumber: daNumber.trim() || undefined,
      certifier: certifier.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    navigate(`/project/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-slate-900">New project</h1>
      <p className="mb-8 text-sm text-slate-500">
        Set up the project metadata. The NCC volume is derived from your building classes and used to filter the clause library.
      </p>

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Project name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 24 Harbour Street Mixed-Use"
            className={cx(inputClass, submitted && !name.trim() && 'border-red-300')}
          />
        </Field>

        <Field label="Site address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 24 Harbour St, Sydney NSW 2000"
            className={inputClass}
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Building class(es) <span className="text-red-500">*</span>
          </span>
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
          {submitted && classes.length === 0 && (
            <p className="mt-1 text-xs text-red-500">Select at least one building class.</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">NCC volume(s)</span>
          <div className="flex gap-2">
            {NCC_VOLUMES.map((v) => (
              <span
                key={v}
                className={cx(
                  'rounded-lg border px-3 py-2 text-sm font-medium',
                  derivedVolumes.includes(v)
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-slate-50 text-slate-400',
                )}
              >
                {v}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Derived automatically from your building class selection.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="DA number" hint="Development application reference">
            <input
              value={daNumber}
              onChange={(e) => setDaNumber(e.target.value)}
              placeholder="e.g. DA-2026/0142"
              className={inputClass}
            />
          </Field>
          <Field label="Certifier" hint="Principal certifying authority">
            <input
              value={certifier}
              onChange={(e) => setCertifier(e.target.value)}
              placeholder="e.g. BuildCert Pty Ltd"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Key deadline" hint="Headline project due date — shown on the dashboard and calendar">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button onClick={() => navigate('/')}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Create project
          </Button>
        </div>
      </div>
    </div>
  );
}
