import type { Discipline, Drawing, DrawingStatus } from '../types';
import { DISCIPLINES, MILESTONES, STATUSES } from '../constants';

/** Minimal RFC-4180-ish CSV parser (handles quoted fields and embedded commas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // ignore — handled by \n
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const STATUS_VALUES = STATUSES.map((s) => s.value);
const DISCIPLINE_VALUES = DISCIPLINES.map((d) => d.value);

function normaliseStatus(raw: string): DrawingStatus {
  const t = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if ((STATUS_VALUES as string[]).includes(t)) return t as DrawingStatus;
  const byLabel = STATUSES.find((s) => s.label.toLowerCase() === raw.trim().toLowerCase());
  return byLabel?.value ?? 'not_started';
}

function normaliseDiscipline(raw: string): Discipline {
  const t = raw.trim().toUpperCase();
  if ((DISCIPLINE_VALUES as string[]).includes(t)) return t as Discipline;
  return 'A';
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Coerce a date string into local 'yyyy-mm-dd'. Accepts ISO or D/M/YYYY. */
function normaliseDate(raw: string): string | undefined {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // D/M/YYYY or D-M-YYYY (Australian convention: day first).
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${pad(Number(mo))}-${pad(Number(d))}`;
  }
  const parsed = new Date(v);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return undefined;
}

const HEADER_ALIASES: Record<string, keyof Drawing> = {
  'drawing number': 'drawingNumber',
  'drawing no': 'drawingNumber',
  'drawing no.': 'drawingNumber',
  number: 'drawingNumber',
  'dwg no': 'drawingNumber',
  title: 'title',
  name: 'title',
  discipline: 'discipline',
  revision: 'revision',
  rev: 'revision',
  status: 'status',
  'due date': 'dueDate',
  due: 'dueDate',
  deadline: 'dueDate',
  notes: 'notes',
  note: 'notes',
};

/**
 * Convert parsed CSV rows into partial Drawings. The first row is treated as a
 * header; recognised columns map to drawing fields. Milestone/clause/tag columns
 * accept comma- or semicolon-separated values.
 */
export function rowsToDrawings(rows: string[][]): { drawings: Partial<Drawing>[]; warnings: string[] } {
  const warnings: string[] = [];
  if (rows.length === 0) return { drawings: [], warnings: ['No rows found.'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const body = rows.slice(1);

  const colMap = header.map((h) => {
    if (HEADER_ALIASES[h]) return HEADER_ALIASES[h];
    if (h.includes('milestone') || h.includes('deliverable')) return 'milestones' as const;
    if (h.includes('ncc') || h.includes('clause')) return 'nccClauses' as const;
    if (h.includes('tag')) return 'tags' as const;
    return null;
  });

  const splitList = (v: string) =>
    v
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean);

  const drawings: Partial<Drawing>[] = body.map((r) => {
    const d: Partial<Drawing> = {};
    colMap.forEach((field, idx) => {
      if (!field) return;
      const value = (r[idx] ?? '').trim();
      if (!value) return;
      switch (field) {
        case 'status':
          d.status = normaliseStatus(value);
          break;
        case 'discipline':
          d.discipline = normaliseDiscipline(value);
          break;
        case 'milestones':
          d.milestones = splitList(value).filter((m) =>
            (MILESTONES as string[]).includes(m),
          ) as Drawing['milestones'];
          break;
        case 'nccClauses':
          d.nccClauses = splitList(value);
          break;
        case 'tags':
          d.tags = splitList(value);
          break;
        case 'dueDate':
          d.dueDate = normaliseDate(value);
          break;
        default:
          (d as Record<string, unknown>)[field] = value;
      }
    });
    return d;
  });

  const valid = drawings.filter((d) => d.drawingNumber || d.title);
  if (valid.length < drawings.length) {
    warnings.push(`${drawings.length - valid.length} row(s) skipped — no drawing number or title.`);
  }
  if (!colMap.includes('drawingNumber') && !colMap.includes('title')) {
    warnings.push('No "Drawing number" or "Title" column detected — check your header row.');
  }
  return { drawings: valid, warnings };
}

export const CSV_TEMPLATE =
  'Drawing Number,Title,Discipline,Revision,Status,Due Date,Milestones,NCC Clauses,Tags,Notes\n' +
  'A-001,Cover Sheet & Drawing Index,A,A,issued_for_da,2026-07-15,DA,,General,\n' +
  'A-101,Ground Floor Plan,A,B,in_progress,2026-08-01,"DA, CC",C1.1; D1.4,Plans,Awaiting survey\n' +
  'A-201,North & South Elevations,A,A,not_started,2026-08-10,DA,F1.5,Elevations,\n';
