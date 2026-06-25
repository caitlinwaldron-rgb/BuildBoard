import { useState } from 'react';
import { Download, FileUp, X } from 'lucide-react';
import { parseCsv, rowsToDrawings, CSV_TEMPLATE } from '../lib/csv';
import type { Drawing } from '../types';
import { Button } from './ui';

interface Props {
  onImport: (rows: Partial<Drawing>[]) => void;
  onClose: () => void;
}

export function ImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Partial<Drawing>[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const analyse = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      setPreview(null);
      setWarnings([]);
      return;
    }
    const { drawings, warnings } = rowsToDrawings(parseCsv(raw));
    setPreview(drawings);
    setWarnings(warnings);
  };

  const onFile = async (file: File) => {
    const raw = await file.text();
    analyse(raw);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buildboard_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Bulk import drawings</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Paste CSV rows or upload a file. The first row must be a header.
            </p>
            <Button variant="ghost" icon={<Download size={15} />} onClick={downloadTemplate}>
              Template
            </Button>
          </div>

          <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 hover:bg-slate-100">
            <FileUp size={16} />
            Choose a .csv file
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>

          <textarea
            value={text}
            onChange={(e) => analyse(e.target.value)}
            placeholder={'Drawing Number,Title,Discipline,Revision,Status\nA-001,Cover Sheet,A,A,not_started'}
            className="h-36 w-full resize-none rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              {warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          {preview && preview.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Preview — {preview.length} drawing(s)
              </p>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-2 py-1 font-medium">No.</th>
                      <th className="px-2 py-1 font-medium">Title</th>
                      <th className="px-2 py-1 font-medium">Disc</th>
                      <th className="px-2 py-1 font-medium">Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((d, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-2 py-1 font-mono">{d.drawingNumber}</td>
                        <td className="px-2 py-1">{d.title}</td>
                        <td className="px-2 py-1">{d.discipline ?? 'A'}</td>
                        <td className="px-2 py-1">{d.revision ?? 'A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!preview || preview.length === 0}
            onClick={() => preview && onImport(preview)}
          >
            Import {preview?.length ? `${preview.length} drawing(s)` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
