import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpDown,
  Check,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import { NCC_CLAUSE_MAP, NCC_SECTIONS } from '../data/nccClauses';
import {
  CONFIDENCE_META,
  DISCIPLINES,
  DOCUMENT_TYPES,
  DOC_STATUSES,
  DOC_STATUS_LABEL,
  DOC_STATUS_META,
} from '../constants';
import type { ClauseAssessment, DocStatus, ProjectDocument } from '../types';
import { Badge, Button, EmptyState, cx, inputClass } from '../components/ui';
import { ProjectHeader } from '../components/ProjectHeader';
import { ACCEPTED_UPLOAD, extractText } from '../lib/extract';
import { CONFIDENCE_LABEL, detectReferences, suggestionsForClause, type Suggestion } from '../lib/nccMatch';
import {
  exportAssessmentExcel,
  exportAssessmentPdf,
  type AssessmentReport,
  type AssessmentRow,
} from '../lib/export';

const DEFAULT_ASSESSMENT = (projectId: string, clauseId: string): ClauseAssessment => ({
  projectId,
  clauseId,
  docIds: [],
  status: 'not_documented',
  notes: '',
  verified: false,
});

const isMissing = (a: ClauseAssessment) => a.docIds.length === 0 && a.status !== 'na';

const DISCLAIMER = 'Suggested evidence only. Final compliance determination must be confirmed by the user.';

/* Guess a sensible document type / number from an uploaded filename. */
function guessType(name: string): string {
  const n = name.toLowerCase();
  if (/access/.test(n)) return 'Accessibility Report';
  if (/fire/.test(n)) return 'Fire Engineering Report';
  if (/struct/.test(n)) return 'Structural Report';
  if (/spec/.test(n)) return 'Specification';
  if (/schedule/.test(n)) return 'Schedule';
  if (/elevation/.test(n)) return 'Elevation';
  if (/section/.test(n)) return 'Section';
  if (/plan/.test(n)) return 'Floor Plan';
  if (/report|statement|cert/.test(n)) return 'Report';
  return 'Document';
}
function guessNumber(name: string): string {
  const m = name.match(/\b[A-Z]{1,3}[-\s]?\d{2,4}\b/);
  return m ? m[0].replace(/\s/g, '') : '';
}

export function Matrix() {
  const { id } = useParams();
  const projectId = id!;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))!;
  const allDocuments = useStore((s) => s.documents);
  const allAssessments = useStore((s) => s.assessments);
  const allDrawings = useStore((s) => s.drawings);

  const addDocument = useStore((s) => s.addDocument);
  const addDocuments = useStore((s) => s.addDocuments);
  const updateDocument = useStore((s) => s.updateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const setAssessment = useStore((s) => s.setAssessment);

  const documents = useMemo(
    () => allDocuments.filter((d) => d.projectId === projectId),
    [allDocuments, projectId],
  );
  const docById = useMemo(() => new Map(documents.map((d) => [d.id, d])), [documents]);
  const assessmentMap = useMemo(() => {
    const m = new Map<string, ClauseAssessment>();
    allAssessments.filter((a) => a.projectId === projectId).forEach((a) => m.set(a.clauseId, a));
    return m;
  }, [allAssessments, projectId]);

  const getA = (clauseId: string) =>
    assessmentMap.get(clauseId) ?? DEFAULT_ASSESSMENT(projectId, clauseId);

  // ---- NCC section selection -------------------------------------------------
  const sections = useMemo(
    () => NCC_SECTIONS.filter((sec) => project.nccVolumes.includes(sec.volume)),
    [project.nccVolumes],
  );
  const [sectionKey, setSectionKey] = useState<string>(() => sections[0]?.key ?? '');
  useEffect(() => {
    if (sections.length && !sections.some((s) => s.key === sectionKey)) setSectionKey(sections[0].key);
  }, [sections, sectionKey]);

  const section = sections.find((s) => s.key === sectionKey) ?? sections[0];
  const sectionClauses = useMemo(
    () => (section ? section.clauseIds.map((cid) => NCC_CLAUSE_MAP[cid]).filter(Boolean) : []),
    [section],
  );

  // ---- evidence suggestions (per section clause) -----------------------------
  const suggestionsByClause = useMemo(() => {
    const m = new Map<string, Suggestion[]>();
    sectionClauses.forEach((c) => m.set(c.id, suggestionsForClause(c, documents)));
    return m;
  }, [sectionClauses, documents]);

  // ---- summary ---------------------------------------------------------------
  const summary = useMemo(() => {
    let documented = 0, partial = 0, notDocumented = 0, na = 0, missing = 0;
    sectionClauses.forEach((c) => {
      const a = getA(c.id);
      if (a.status === 'documented') documented++;
      else if (a.status === 'partial') partial++;
      else if (a.status === 'na') na++;
      else notDocumented++;
      if (isMissing(a)) missing++;
    });
    const total = sectionClauses.length;
    const considered = total - na;
    const percentDocumented = considered > 0 ? Math.round((documented / considered) * 100) : 0;
    let overall: 'green' | 'amber' | 'red' | 'neutral';
    if (considered === 0) overall = 'neutral';
    else if (notDocumented > 0 || missing > 0) overall = 'red';
    else if (partial > 0 || documented < considered) overall = 'amber';
    else overall = 'green';
    const overallLabel =
      overall === 'green' ? 'Fully Documented'
        : overall === 'amber' ? 'Requires Review'
          : overall === 'red' ? 'Missing Documentation' : 'Not Started';
    return { total, documented, partial, notDocumented, na, missing, percentDocumented, overall, overallLabel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionClauses, assessmentMap]);

  // ---- verification table filters -------------------------------------------
  const [clauseSearch, setClauseSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'missing' | ''>('');
  const [sortAsc, setSortAsc] = useState(true);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  const visibleClauses = useMemo(() => {
    const q = clauseSearch.trim().toLowerCase();
    const list = sectionClauses.filter((c) => {
      const a = getA(c.id);
      if (statusFilter === 'missing' && !isMissing(a)) return false;
      if (statusFilter && statusFilter !== 'missing' && a.status !== statusFilter) return false;
      if (q && !`${c.id} ${c.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sortAsc ? a.id.localeCompare(b.id, undefined, { numeric: true }) : b.id.localeCompare(a.id, undefined, { numeric: true }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionClauses, clauseSearch, statusFilter, sortAsc, assessmentMap]);

  // ---- uploads ---------------------------------------------------------------
  const [busy, setBusy] = useState(0);
  const handleFiles = async (files: FileList | File[]) => {
    const arr = [...files];
    setBusy((b) => b + arr.length);
    for (const file of arr) {
      try {
        const { text, ocrPending } = await extractText(file);
        const baseName = file.name.replace(/\.[^.]+$/, '');
        addDocument(projectId, {
          source: 'upload',
          fileName: file.name,
          mime: file.type,
          type: guessType(file.name),
          number: guessNumber(file.name),
          title: baseName,
          content: text,
          detectedClauseIds: detectReferences(text),
          ocrPending,
        });
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  // ---- handlers --------------------------------------------------------------
  const onDocsChange = (clauseId: string, docIds: string[]) => {
    const a = getA(clauseId);
    const patch: Partial<ClauseAssessment> = { docIds };
    if (docIds.length === 0 && a.status === 'documented') patch.status = 'not_documented';
    setAssessment(projectId, clauseId, patch);
    setRuleError(null);
  };

  const onStatusChange = (clauseId: string, status: DocStatus) => {
    const a = getA(clauseId);
    if (!a.verified) {
      setRuleError('Please tick “Verified by User” before setting a documentation status for this clause.');
      return;
    }
    if (status === 'documented' && a.docIds.length === 0) {
      setRuleError('Please select supporting documentation before marking this clause as documented.');
      return;
    }
    setRuleError(null);
    setAssessment(projectId, clauseId, { status });
  };

  const acceptSuggestion = (clauseId: string, docId: string) => {
    const a = getA(clauseId);
    if (!a.docIds.includes(docId)) setAssessment(projectId, clauseId, { docIds: [...a.docIds, docId] });
  };

  const importFromDrawings = () => {
    const projectDrawings = allDrawings.filter((d) => d.projectId === projectId);
    const existing = new Set(documents.map((d) => d.number.trim().toLowerCase()));
    const rows = projectDrawings
      .filter((d) => (d.drawingNumber || d.title) && !existing.has(d.drawingNumber.trim().toLowerCase()))
      .map((d) => ({
        type: DISCIPLINES.find((x) => x.value === d.discipline)?.label ?? 'Drawing',
        number: d.drawingNumber,
        title: d.title,
        source: 'manual' as const,
      }));
    if (!rows.length) {
      setRuleError('No new drawings to import — they may already be in the register.');
      setTimeout(() => setRuleError(null), 3000);
      return;
    }
    addDocuments(projectId, rows);
  };

  const buildReport = (): AssessmentReport => {
    const rows: AssessmentRow[] = sectionClauses.map((c) => {
      const a = getA(c.id);
      const sugg = suggestionsByClause.get(c.id) ?? [];
      return {
        clauseId: c.id,
        requirement: c.title,
        docs: a.docIds.map((did) => docById.get(did)?.number).filter(Boolean).join(', '),
        suggested: sugg.map((s) => docById.get(s.docId)?.number || docById.get(s.docId)?.title || '').filter(Boolean).join(', '),
        confidence: sugg.length ? CONFIDENCE_LABEL[sugg[0].band] : 'No evidence found',
        verified: a.verified,
        statusLabel: DOC_STATUS_LABEL[a.status],
        notes: a.notes,
        missingEvidence: isMissing(a),
      };
    });
    return { sectionLabel: section?.label ?? '—', documents, rows, summary, generatedAt: new Date().toLocaleString() };
  };

  // ---- review panel data -----------------------------------------------------
  const review = useMemo(() => {
    const addressed = sectionClauses.filter((c) => (suggestionsByClause.get(c.id) ?? []).length > 0);
    const missing = sectionClauses.filter((c) => (suggestionsByClause.get(c.id) ?? []).length === 0);
    const refDocIds = new Set<string>();
    suggestionsByClause.forEach((list) => list.forEach((s) => refDocIds.add(s.docId)));
    return {
      addressed,
      missing,
      docs: [...refDocIds].map((did) => docById.get(did)).filter(Boolean) as ProjectDocument[],
    };
  }, [sectionClauses, suggestionsByClause, docById]);

  if (!section) {
    return (
      <div>
        <ProjectHeader project={project} title="ncc self-assessment" />
        <div className="px-6 py-6">
          <EmptyState icon={<ShieldCheck size={40} />} title="No NCC sections for this project" description="Set the project's building classes and NCC volume in Settings to load the clause library." />
        </div>
      </div>
    );
  }

  return (
    <div className="print-area">
      <ProjectHeader
        project={project}
        title="ncc self-assessment"
        subtitle={`${summary.documented}/${summary.total - summary.na} documented · ${summary.missing} missing evidence`}
      >
        <Button icon={<Printer size={15} />} onClick={() => window.print()}>Print</Button>
        <Button icon={<FileSpreadsheet size={15} />} onClick={() => exportAssessmentExcel(project, buildReport())}>Excel</Button>
        <Button variant="primary" icon={<FileDown size={15} />} onClick={() => exportAssessmentPdf(project, buildReport())}>PDF</Button>
      </ProjectHeader>

      <div className="space-y-6 px-6 py-6">
        {/* 1 — NCC section selection */}
        <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select NCC Section</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sectionKey}
              onChange={(e) => { setSectionKey(e.target.value); setClauseSearch(''); setStatusFilter(''); setRuleError(null); }}
              className={cx(inputClass, 'max-w-md font-medium')}
            >
              {sections.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <span className="text-sm text-slate-500">{section.clauseIds.length} clause{section.clauseIds.length === 1 ? '' : 's'} in this section</span>
          </div>
        </section>

        {/* 2 — Documentation register + upload */}
        <section className="rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900">project documentation register</h2>
              <p className="text-xs text-slate-500">Upload or add the documents that make up your project set — the evidence for compliance.</p>
            </div>
            <div className="no-print flex items-center gap-2">
              <Button icon={<FileText size={14} />} onClick={importFromDrawings}>Import from drawings</Button>
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => addDocument(projectId, { source: 'manual' })}>Add document</Button>
            </div>
          </div>

          <div className="px-5 pt-4">
            <UploadZone busy={busy} onFiles={handleFiles} />
          </div>

          <RegisterTable documents={documents} onUpdate={updateDocument} onDelete={deleteDocument} onAdd={() => addDocument(projectId, { source: 'manual' })} />
        </section>

        {/* 3 — dashboard */}
        <Dashboard summary={summary} />

        {/* Rule message */}
        {ruleError && (
          <div className="no-print flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
            <AlertTriangle size={16} /> {ruleError}
          </div>
        )}

        {/* AI review panel */}
        <section className="rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
          <button
            onClick={() => setShowReview((v) => !v)}
            className="no-print flex w-full items-center justify-between gap-3 px-5 py-3.5"
          >
            <span className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles size={16} className="text-brand-600" /> ai-assisted review panel
            </span>
            <ChevronDown size={18} className={cx('text-slate-400 transition', showReview && 'rotate-180')} />
          </button>
          {showReview && (
            <div className="border-t border-slate-200/70 px-5 py-4">
              <p className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <Info size={14} /> Guidance only — these suggestions never replace your verification.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <ReviewList title="Potentially Addressed" tone="emerald" items={review.addressed.map((c) => `${c.id} — ${c.title}`)} empty="None yet." />
                <ReviewList title="Potentially Missing" tone="rose" items={review.missing.map((c) => `${c.id} — ${c.title}`)} empty="None — every clause has a suggestion." />
                <ReviewList title="Documents Referenced" tone="slate" items={review.docs.map((d) => `${d.number ? d.number + ' — ' : ''}${d.title || d.fileName}`)} empty="Upload documents to see references." />
              </div>
            </div>
          )}
        </section>

        {/* 4 — verification table */}
        <section className="rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-3.5">
            <h2 className="text-base font-bold text-slate-900">compliance verification — {section.partTitle.toLowerCase()}</h2>
            <div className="no-print flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={clauseSearch} onChange={(e) => setClauseSearch(e.target.value)} placeholder="Search clause no.…" className="w-40 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DocStatus | 'missing' | '')} className="rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-sm outline-none focus:border-brand-500">
                <option value="">All statuses</option>
                {DOC_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                <option value="missing">Missing evidence</option>
              </select>
              <button onClick={() => setSortAsc((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50" title="Sort by clause number">
                <ArrowUpDown size={14} /> {sortAsc ? 'A–Z' : 'Z–A'}
              </button>
            </div>
          </div>

          <p className="flex items-center gap-2 border-b border-slate-200/70 bg-brand-50/60 px-5 py-2 text-xs font-medium text-brand-700">
            <Info size={14} /> {DISCLAIMER}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5">NCC Clause</th>
                  <th className="px-3 py-2.5">Requirement</th>
                  <th className="px-3 py-2.5">Suggested Evidence</th>
                  <th className="px-3 py-2.5">Supporting Document(s)</th>
                  <th className="px-3 py-2.5 text-center">Verified</th>
                  <th className="px-3 py-2.5 w-44">Status</th>
                  <th className="px-3 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {visibleClauses.map((c) => (
                  <ClauseRow
                    key={c.id}
                    clauseId={c.id}
                    requirement={c.title}
                    assessment={getA(c.id)}
                    documents={documents}
                    suggestions={suggestionsByClause.get(c.id) ?? []}
                    onAccept={(docId) => acceptSuggestion(c.id, docId)}
                    onDocsChange={(ids) => onDocsChange(c.id, ids)}
                    onVerifyToggle={(v) => setAssessment(projectId, c.id, { verified: v })}
                    onStatusChange={(st) => onStatusChange(c.id, st)}
                    onNotesChange={(notes) => setAssessment(projectId, c.id, { notes })}
                  />
                ))}
                {visibleClauses.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-400">No clauses match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------- upload zone ------------------------------ */

function UploadZone({ busy, onFiles }: { busy: number; onFiles: (files: FileList | File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
      className={cx(
        'no-print flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
        over ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white/50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_UPLOAD}
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
      />
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
        {busy > 0 ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
      </div>
      {busy > 0 ? (
        <p className="text-sm font-medium text-slate-700">processing {busy} file{busy === 1 ? '' : 's'}…</p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700">
            drag &amp; drop documents, or{' '}
            <button onClick={() => inputRef.current?.click()} className="text-brand-600 underline">browse</button>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            pdf · docx · xlsx · txt · images — text is auto-extracted and matched to NCC clauses
          </p>
        </>
      )}
    </div>
  );
}

/* ----------------------------- register table ------------------------------ */

function RegisterTable({
  documents,
  onUpdate,
  onDelete,
  onAdd,
}: {
  documents: ProjectDocument[];
  onUpdate: (id: string, patch: Partial<ProjectDocument>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => `${d.type} ${d.number} ${d.title} ${(d.detectedClauseIds ?? []).join(' ')}`.toLowerCase().includes(q));
  }, [documents, search]);

  if (documents.length === 0) {
    return (
      <div className="px-5 py-8">
        <EmptyState
          icon={<FileText size={36} />}
          title="No documents yet"
          description="Upload your project documents above, or add register rows manually."
          action={<Button variant="primary" icon={<Plus size={15} />} onClick={onAdd}>Add document</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="no-print relative mb-3 w-64">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500" />
      </div>

      <datalist id="doc-types">{DOCUMENT_TYPES.map((t) => <option key={t} value={t} />)}</datalist>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 w-48">Document Type</th>
              <th className="px-3 py-2 w-32">No.</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2 w-56">Detected NCC References</th>
              <th className="px-2 py-2 w-10"> </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => <DocRow key={d.id} doc={d} onUpdate={onUpdate} onDelete={onDelete} />)}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">No documents match “{search}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocRow({
  doc: d,
  onUpdate,
  onDelete,
}: {
  doc: ProjectDocument;
  onUpdate: (id: string, patch: Partial<ProjectDocument>) => void;
  onDelete: (id: string) => void;
}) {
  const [addRef, setAddRef] = useState('');
  const [editingText, setEditingText] = useState(false);
  const [text, setText] = useState(d.content ?? '');
  const refs = d.detectedClauseIds ?? [];

  const saveText = () => {
    onUpdate(d.id, { content: text, detectedClauseIds: detectReferences(text), ocrPending: text.trim().length < 20 });
    setEditingText(false);
  };

  return (
    <>
      <tr className="group border-b border-slate-100 last:border-0 align-top hover:bg-slate-50/60">
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            {d.source === 'upload' && <FileText size={13} className="shrink-0 text-brand-500" />}
            <EditCell value={d.type} placeholder="e.g. Floor Plan" list="doc-types" onCommit={(v) => onUpdate(d.id, { type: v })} />
          </div>
        </td>
        <td className="px-2 py-1.5"><EditCell value={d.number} placeholder="A101" mono onCommit={(v) => onUpdate(d.id, { number: v })} /></td>
        <td className="px-2 py-1.5">
          <EditCell value={d.title} placeholder="Document title" onCommit={(v) => onUpdate(d.id, { title: v })} />
          {d.ocrPending && (
            <button onClick={() => setEditingText(true)} className="no-print mt-0.5 inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
              <AlertTriangle size={10} /> no text extracted — add manually
            </button>
          )}
        </td>
        <td className="px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {refs.map((r) => (
              <span key={r} className="inline-flex items-center gap-0.5 rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-700">
                {r}
                <button onClick={() => onUpdate(d.id, { detectedClauseIds: refs.filter((x) => x !== r) })} className="no-print text-brand-400 hover:text-rose-500"><X size={10} /></button>
              </span>
            ))}
            <input
              value={addRef}
              onChange={(e) => setAddRef(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addRef.trim()) {
                  const v = addRef.trim().toUpperCase();
                  if (!refs.includes(v)) onUpdate(d.id, { detectedClauseIds: [...refs, v] });
                  setAddRef('');
                }
              }}
              placeholder={refs.length ? '+ ref' : '+ add ref'}
              className="no-print w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] outline-none hover:border-slate-200 focus:border-brand-400"
            />
          </div>
        </td>
        <td className="px-2 py-1.5 text-center">
          <button onClick={() => onDelete(d.id)} className="no-print rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100" title="Remove document"><X size={15} /></button>
        </td>
      </tr>
      {editingText && (
        <tr className="no-print border-b border-slate-100 bg-amber-50/40">
          <td colSpan={5} className="px-3 py-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">Paste the document's text (e.g. from a scan / image) so it can be matched to NCC clauses:</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={cx(inputClass, 'resize-y')} />
            <div className="mt-2 flex gap-2">
              <Button variant="primary" className="py-1" onClick={saveText}>Save &amp; match</Button>
              <Button className="py-1" onClick={() => setEditingText(false)}>Cancel</Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------- dashboard -------------------------------- */

function Dashboard({ summary }: { summary: { total: number; documented: number; partial: number; notDocumented: number; na: number; missing: number; percentDocumented: number; overall: 'green' | 'amber' | 'red' | 'neutral'; overallLabel: string } }) {
  const considered = summary.total - summary.na;
  const pct = (n: number) => (considered > 0 ? Math.round((n / considered) * 100) : 0);
  const overallTone = { green: 'border-emerald-300 bg-emerald-50 text-emerald-800', amber: 'border-amber-300 bg-amber-50 text-amber-800', red: 'border-rose-300 bg-rose-50 text-rose-800', neutral: 'border-slate-300 bg-slate-50 text-slate-700' }[summary.overall];
  const overallBar = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', neutral: 'bg-slate-400' }[summary.overall];

  return (
    <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">compliance dashboard</h2>
        <div className={cx('flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold', overallTone)}>
          <span className={cx('h-2.5 w-2.5 rounded-full', overallBar)} /> {summary.overallLabel}
        </div>
      </div>
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{summary.percentDocumented}% documented</span>
          <span>{summary.documented} / {considered} applicable clauses</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={cx('h-full rounded-full transition-all', overallBar)} style={{ width: `${summary.percentDocumented}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total Clauses" value={summary.total} pct={null} tone="slate" />
        <Stat label="Documented" value={summary.documented} pct={pct(summary.documented)} tone="emerald" />
        <Stat label="Partially Documented" value={summary.partial} pct={pct(summary.partial)} tone="amber" />
        <Stat label="Not Documented" value={summary.notDocumented} pct={pct(summary.notDocumented)} tone="rose" />
        <Stat label="Missing Evidence" value={summary.missing} pct={pct(summary.missing)} tone="rose" />
        <Stat label="Not Applicable" value={summary.na} pct={null} tone="slate" />
      </div>
    </section>
  );
}

function Stat({ label, value, pct, tone }: { label: string; value: number; pct: number | null; tone: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const tones = { slate: 'border-slate-200 bg-white text-slate-900', emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800', amber: 'border-amber-200 bg-amber-50 text-amber-800', rose: 'border-rose-200 bg-rose-50 text-rose-800' }[tone];
  return (
    <div className={cx('rounded-xl border px-3 py-2.5 shadow-sm', tones)}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold">{value}</span>
        {pct !== null && <span className="text-xs font-medium opacity-70">{pct}%</span>}
      </div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

/* ------------------------------- review list ------------------------------- */

function ReviewList({ title, tone, items, empty }: { title: string; tone: 'emerald' | 'rose' | 'slate'; items: string[]; empty: string }) {
  const dot = { emerald: 'bg-emerald-500', rose: 'bg-rose-500', slate: 'bg-slate-400' }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className={cx('h-2 w-2 rounded-full', dot)} /> {title} <span className="text-xs font-normal text-slate-400">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 12).map((i, idx) => <li key={idx} className="truncate text-xs text-slate-600" title={i}>{i}</li>)}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------- clause row -------------------------------- */

function ClauseRow({
  clauseId,
  requirement,
  assessment,
  documents,
  suggestions,
  onAccept,
  onDocsChange,
  onVerifyToggle,
  onStatusChange,
  onNotesChange,
}: {
  clauseId: string;
  requirement: string;
  assessment: ClauseAssessment;
  documents: ProjectDocument[];
  suggestions: Suggestion[];
  onAccept: (docId: string) => void;
  onDocsChange: (ids: string[]) => void;
  onVerifyToggle: (v: boolean) => void;
  onStatusChange: (status: DocStatus) => void;
  onNotesChange: (notes: string) => void;
}) {
  const meta = DOC_STATUS_META[assessment.status];
  const missing = isMissing(assessment);
  const best = suggestions[0];

  return (
    <tr className={cx('border-b border-slate-100 align-top last:border-0', assessment.verified ? meta.row : '')}>
      <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700">{clauseId}</td>
      <td className="px-3 py-2 text-sm text-slate-600">{requirement}</td>

      {/* Suggested evidence */}
      <td className="px-3 py-2">
        {suggestions.length === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700" title="No uploaded documentation appears to address this NCC requirement. User review required.">
            <AlertTriangle size={11} /> no supporting evidence found
          </span>
        ) : (
          <div className="space-y-1">
            <span className={cx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold', CONFIDENCE_META[best.band].chip)}>
              {CONFIDENCE_LABEL[best.band]} · {best.score}%
            </span>
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 4).map((s) => {
                const doc = documents.find((d) => d.id === s.docId);
                if (!doc) return null;
                const added = assessment.docIds.includes(s.docId);
                return (
                  <button
                    key={s.docId}
                    onClick={() => onAccept(s.docId)}
                    disabled={added}
                    title={added ? 'Added as supporting document' : 'Accept as supporting document'}
                    className={cx(
                      'inline-flex max-w-[12rem] items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[11px]',
                      added ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700',
                    )}
                  >
                    {added ? <Check size={10} /> : <Plus size={10} />}
                    <span className="truncate">{doc.number || doc.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </td>

      {/* Supporting documents */}
      <td className="px-3 py-2">
        <DocMultiSelect documents={documents} selected={assessment.docIds} onChange={onDocsChange} />
        {missing && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">
            <AlertTriangle size={11} /> missing evidence
          </span>
        )}
      </td>

      {/* Verified */}
      <td className="px-3 py-2 text-center">
        <label className="inline-flex cursor-pointer flex-col items-center gap-0.5">
          <input type="checkbox" checked={assessment.verified} onChange={(e) => onVerifyToggle(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          <span className="text-[10px] font-medium text-slate-400">by user</span>
        </label>
      </td>

      {/* Status (gated on verification) */}
      <td className="px-3 py-2">
        <select
          value={assessment.status}
          disabled={!assessment.verified}
          onChange={(e) => onStatusChange(e.target.value as DocStatus)}
          title={!assessment.verified ? 'Tick “Verified by User” first' : undefined}
          className={cx('w-full rounded-lg border px-2 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50', meta.color)}
        >
          {DOC_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>

      <td className="px-3 py-2"><EditCell value={assessment.notes} placeholder="—" onCommit={onNotesChange} /></td>
    </tr>
  );
}

/* ----------------------------- doc multi-select ---------------------------- */

function DocMultiSelect({ documents, selected, onChange }: { documents: ProjectDocument[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const selectedDocs = selected.map((id) => documents.find((d) => d.id === id)).filter(Boolean) as ProjectDocument[];
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="no-print flex min-h-[28px] w-full max-w-[15rem] flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-left hover:border-brand-400">
        {selectedDocs.length === 0 ? <span className="text-xs text-slate-400">+ confirm document(s)</span> : selectedDocs.map((d) => (
          <Badge key={d.id} className="border-brand-200 bg-brand-50 font-mono text-brand-700">{d.number || d.title || '—'}</Badge>
        ))}
      </button>
      <span className="hidden text-xs text-slate-600 print:inline">{selectedDocs.map((d) => d.number || d.title).join(', ') || '—'}</span>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute z-30 mt-1 max-h-60 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
            {documents.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-400">The documentation register is empty. Upload or add documents above first.</p>
            ) : documents.map((d) => {
              const on = selected.includes(d.id);
              return (
                <button key={d.id} onClick={() => toggle(d.id)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50', on && 'bg-brand-50')}>
                  <span className={cx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>{on && <Check size={11} />}</span>
                  <span className="truncate"><span className="font-mono text-xs text-slate-500">{d.number || '—'}</span> {d.title}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- edit cell -------------------------------- */

function EditCell({ value, placeholder, mono, list, onCommit }: { value: string; placeholder?: string; mono?: boolean; list?: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <input
      value={local}
      placeholder={placeholder}
      list={list}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== value && onCommit(local)}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setLocal(value); }}
      className={cx('w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-slate-200 focus:border-brand-400 focus:bg-white', mono && 'font-mono')}
    />
  );
}
