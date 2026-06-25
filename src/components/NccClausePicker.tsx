import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { NCC_CLAUSES } from '../data/nccClauses';
import type { BuildingClass, NCCVolume } from '../types';
import { cx } from './ui';

interface Props {
  selected: string[];
  buildingClasses: BuildingClass[];
  volumes: NCCVolume[];
  onChange: (clauseIds: string[]) => void;
  onClose: () => void;
}

export function NccClausePicker({ selected, buildingClasses, volumes, onChange, onClose }: Props) {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const applicable = useMemo(() => {
    return NCC_CLAUSES.filter((c) => {
      const volumeOk = volumes.length === 0 || volumes.includes(c.volume);
      const classOk =
        buildingClasses.length === 0 ||
        c.applicableClasses.some((ac) => buildingClasses.includes(ac));
      return volumeOk && classOk;
    });
  }, [buildingClasses, volumes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? applicable.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.partTitle.toLowerCase().includes(q),
        )
      : applicable;
    // group by part
    const groups = new Map<string, typeof list>();
    list.forEach((c) => {
      const key = `${c.volume} · Part ${c.part} — ${c.partTitle}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    });
    return [...groups.entries()];
  }, [applicable, query]);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
  };

  return (
    <div
      ref={ref}
      className="absolute z-30 mt-1 w-[28rem] max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 p-2">
        <Search size={16} className="text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clause number or title…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X size={15} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            No clauses match — try a different search.
          </p>
        )}
        {filtered.map(([group, clauses]) => (
          <div key={group} className="mb-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {group}
            </div>
            {clauses.map((c) => {
              const isSel = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cx(
                    'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50',
                    isSel && 'bg-brand-50',
                  )}
                >
                  <span
                    className={cx(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isSel ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                    )}
                  >
                    {isSel && <Check size={12} />}
                  </span>
                  <span>
                    <span className="font-mono font-semibold text-slate-800">{c.id}</span>{' '}
                    <span className="text-slate-600">{c.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
        <span>{selected.length} selected</span>
        <button onClick={onClose} className="font-medium text-brand-600 hover:underline">
          Done
        </button>
      </div>
    </div>
  );
}
