import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalendarEvent, Drawing, Project, ProjectDocument } from '../types';
import {
  DISCIPLINES,
  EVENT_CATEGORY_LABEL,
  MILESTONE_ISSUED_STATUS,
  MILESTONES,
  STATUS_LABEL,
} from '../constants';
import { formatDateLong, formatTime } from './dates';

const disciplineLabel = (d: string) =>
  DISCIPLINES.find((x) => x.value === d)?.label ?? d;

function safeName(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'project';
}

/* ----------------------------- Drawing register ---------------------------- */

const registerHeaders = [
  'Drawing No.',
  'Title',
  'Discipline',
  'Rev',
  'Status',
  'Due Date',
  'Milestones',
  'NCC Clauses',
  'Tags',
  'Notes',
];

function registerRow(d: Drawing): (string | number)[] {
  return [
    d.drawingNumber,
    d.title,
    `${d.discipline} — ${disciplineLabel(d.discipline)}`,
    d.revision,
    STATUS_LABEL[d.status],
    d.dueDate ? formatDateLong(d.dueDate) : '',
    d.milestones.join(', '),
    d.nccClauses.join(', '),
    d.tags.join(', '),
    d.notes,
  ];
}

export function exportRegisterExcel(project: Project, drawings: Drawing[]) {
  const wb = XLSX.utils.book_new();
  const aoa = [
    [`Drawing Register — ${project.name}`],
    [project.address],
    [`Building class: ${project.buildingClasses.join(', ')}  |  NCC: ${project.nccVolumes.join(', ')}`],
    [],
    registerHeaders,
    ...drawings.map(registerRow),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 34 },
    { wch: 20 },
    { wch: 6 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Drawing Register');
  XLSX.writeFile(wb, `${safeName(project.name)}_drawing_register.xlsx`);
}

export function exportRegisterPdf(project: Project, drawings: Drawing[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  pdfHeader(doc, project, 'Drawing Register');
  autoTable(doc, {
    startY: 96,
    head: [registerHeaders],
    body: drawings.map(registerRow),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    columnStyles: { 1: { cellWidth: 150 }, 9: { cellWidth: 130 } },
    margin: { left: 28, right: 28 },
  });
  doc.save(`${safeName(project.name)}_drawing_register.pdf`);
}

/* ------------------------------- NCC matrix -------------------------------- */

interface MatrixData {
  clauseIds: string[];
  drawings: Drawing[];
}

export function buildMatrix(drawings: Drawing[]): MatrixData {
  const set = new Set<string>();
  drawings.forEach((d) => d.nccClauses.forEach((c) => set.add(c)));
  const clauseIds = [...set].sort();
  return { clauseIds, drawings };
}

export function exportMatrixExcel(project: Project, drawings: Drawing[]) {
  const { clauseIds } = buildMatrix(drawings);
  const head = ['Drawing No.', 'Title', ...clauseIds];
  const body = drawings.map((d) => [
    d.drawingNumber,
    d.title,
    ...clauseIds.map((c) => (d.nccClauses.includes(c) ? '●' : '')),
  ]);
  const coverage = ['', 'Coverage count', ...clauseIds.map((c) =>
    drawings.filter((d) => d.nccClauses.includes(c)).length,
  )];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`NCC Compliance Matrix — ${project.name}`],
    [],
    head,
    ...body,
    [],
    coverage,
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'NCC Matrix');
  XLSX.writeFile(wb, `${safeName(project.name)}_ncc_matrix.xlsx`);
}

export function exportMatrixPdf(project: Project, drawings: Drawing[]) {
  const { clauseIds } = buildMatrix(drawings);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  pdfHeader(doc, project, 'NCC Compliance Matrix');
  autoTable(doc, {
    startY: 96,
    head: [['Drawing', ...clauseIds]],
    body: drawings.map((d) => [
      d.drawingNumber || d.title,
      ...clauseIds.map((c) => (d.nccClauses.includes(c) ? 'X' : '')),
    ]),
    styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    columnStyles: { 0: { halign: 'left', cellWidth: 80 } },
    margin: { left: 28, right: 28 },
  });
  doc.save(`${safeName(project.name)}_ncc_matrix.pdf`);
}

/* --------------------------- Deliverable tracker --------------------------- */

const trackerHeaders = ['Milestone', 'Drawing No.', 'Title', 'Discipline', 'Rev', 'Status', 'Issued?'];

function trackerRows(drawings: Drawing[]): (string)[][] {
  const rows: string[][] = [];
  MILESTONES.forEach((m) => {
    const inMilestone = drawings.filter((d) => d.milestones.includes(m));
    inMilestone.forEach((d) => {
      const issued = MILESTONE_ISSUED_STATUS[m].includes(d.status);
      rows.push([
        m,
        d.drawingNumber,
        d.title,
        d.discipline,
        d.revision,
        STATUS_LABEL[d.status],
        issued ? 'Yes' : 'No',
      ]);
    });
  });
  return rows;
}

export function exportTrackerExcel(project: Project, drawings: Drawing[]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Deliverable Status Tracker — ${project.name}`],
    [],
    trackerHeaders,
    ...trackerRows(drawings),
  ]);
  ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 34 }, { wch: 10 }, { wch: 6 }, { wch: 18 }, { wch: 9 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Deliverable Tracker');
  XLSX.writeFile(wb, `${safeName(project.name)}_deliverable_tracker.xlsx`);
}

export function exportTrackerPdf(project: Project, drawings: Drawing[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  pdfHeader(doc, project, 'Deliverable Status Tracker');
  autoTable(doc, {
    startY: 96,
    head: [trackerHeaders],
    body: trackerRows(drawings),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    margin: { left: 28, right: 28 },
  });
  doc.save(`${safeName(project.name)}_deliverable_tracker.pdf`);
}

/* ------------------------------ Calendar / schedule ------------------------ */

const calendarHeaders = ['Date', 'Time', 'Type', 'Item', 'Detail'];

interface ScheduleRow {
  date: string;
  time: string;
  type: string;
  item: string;
  detail: string;
}

function scheduleRows(project: Project, drawings: Drawing[], events: CalendarEvent[]): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

  if (project.dueDate) {
    rows.push({
      date: project.dueDate,
      time: '',
      type: 'Project deadline',
      item: project.name,
      detail: '',
    });
  }

  drawings
    .filter((d) => d.dueDate)
    .forEach((d) =>
      rows.push({
        date: d.dueDate!,
        time: '',
        type: 'Drawing due',
        item: `${d.drawingNumber}${d.title ? ` — ${d.title}` : ''}`,
        detail: STATUS_LABEL[d.status],
      }),
    );

  events.forEach((e) => {
    const time = [e.startTime, e.endTime].filter(Boolean).map(formatTime).join(' – ');
    rows.push({
      date: e.date,
      time,
      type: EVENT_CATEGORY_LABEL[e.category],
      item: e.title,
      detail: [e.attendees && `Attendees: ${e.attendees}`, e.notes].filter(Boolean).join(' · '),
    });
  });

  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function exportCalendarExcel(project: Project, drawings: Drawing[], events: CalendarEvent[]) {
  const rows = scheduleRows(project, drawings, events);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Project Calendar / Schedule — ${project.name}`],
    [project.address],
    [],
    calendarHeaders,
    ...rows.map((r) => [formatDateLong(r.date), r.time, r.type, r.item, r.detail]),
  ]);
  ws['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 36 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Calendar');
  XLSX.writeFile(wb, `${safeName(project.name)}_calendar.xlsx`);
}

export function exportCalendarPdf(project: Project, drawings: Drawing[], events: CalendarEvent[]) {
  const rows = scheduleRows(project, drawings, events);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  pdfHeader(doc, project, 'Project Calendar / Schedule');
  autoTable(doc, {
    startY: 96,
    head: [calendarHeaders],
    body: rows.map((r) => [formatDateLong(r.date), r.time, r.type, r.item, r.detail]),
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    columnStyles: { 0: { cellWidth: 80 }, 3: { cellWidth: 150 } },
    margin: { left: 28, right: 28 },
  });
  doc.save(`${safeName(project.name)}_calendar.pdf`);
}

/* ----------------------- NCC self-assessment report ------------------------ */

export interface AssessmentRow {
  clauseId: string;
  requirement: string;
  suggested: string; // joined suggested-evidence document refs
  confidence: string; // best confidence band label
  docs: string; // joined confirmed supporting document numbers
  verified: boolean; // user-verified
  statusLabel: string;
  notes: string;
  missingEvidence: boolean;
}

export interface AssessmentSummary {
  total: number;
  documented: number;
  partial: number;
  notDocumented: number;
  missing: number;
  na: number;
  percentDocumented: number;
  overallLabel: string;
}

export interface AssessmentReport {
  sectionLabel: string;
  documents: ProjectDocument[];
  rows: AssessmentRow[];
  summary: AssessmentSummary;
  generatedAt: string; // human-readable
}

const summaryAoa = (s: AssessmentSummary) => [
  ['Total clauses', s.total],
  ['Documented', s.documented],
  ['Partially documented', s.partial],
  ['Not documented', s.notDocumented],
  ['Missing evidence', s.missing],
  ['Not applicable', s.na],
  ['% documented', `${s.percentDocumented}%`],
  ['Overall status', s.overallLabel],
];

export function exportAssessmentExcel(project: Project, report: AssessmentReport) {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    [`NCC Self-Assessment — ${project.name}`],
    [project.address],
    [`Section: ${report.sectionLabel}`],
    [`Generated: ${report.generatedAt}`],
    [`Building class: ${project.buildingClasses.join(', ')}  |  NCC: ${project.nccVolumes.join(', ')}`],
    [],
    ['Summary'],
    ...summaryAoa(report.summary),
  ]);
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const regSheet = XLSX.utils.aoa_to_sheet([
    ['Document Type', 'Number', 'Title'],
    ...report.documents.map((d) => [d.type, d.number, d.title]),
  ]);
  regSheet['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, regSheet, 'Documentation Register');

  const verifySheet = XLSX.utils.aoa_to_sheet([
    ['NCC Clause', 'Requirement', 'Suggested Evidence', 'Confidence', 'Supporting Document(s)', 'Verified', 'Documentation Status', 'Missing Evidence', 'Notes'],
    ...report.rows.map((r) => [
      r.clauseId,
      r.requirement,
      r.suggested,
      r.confidence,
      r.docs,
      r.verified ? 'YES' : '',
      r.statusLabel,
      r.missingEvidence ? 'YES' : '',
      r.notes,
    ]),
  ]);
  verifySheet['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
    { wch: 9 },
    { wch: 20 },
    { wch: 14 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, verifySheet, 'Verification');

  const missing = report.rows.filter((r) => r.missingEvidence);
  const missingSheet = XLSX.utils.aoa_to_sheet([
    ['NCC Clause', 'Requirement'],
    ...(missing.length ? missing.map((r) => [r.clauseId, r.requirement]) : [['— none —', '']]),
  ]);
  missingSheet['!cols'] = [{ wch: 12 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(wb, missingSheet, 'Missing Evidence');

  XLSX.writeFile(wb, `${safeName(project.name)}_ncc_assessment.xlsx`);
}

export function exportAssessmentPdf(project: Project, report: AssessmentReport) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  pdfHeader(doc, project, 'NCC Self-Assessment');

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Section: ${report.sectionLabel}`, 28, 104);
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated ${report.generatedAt}`, 28, 118);

  const s = report.summary;
  autoTable(doc, {
    startY: 130,
    head: [['Summary', '']],
    body: summaryAoa(s).map(([k, v]) => [String(k), String(v)]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    columnStyles: { 0: { cellWidth: 160, fontStyle: 'bold' } },
    margin: { left: 28, right: 28 },
  });

  // Documentation register
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18,
    head: [['Documentation Register', '', '']],
    body: [],
    theme: 'plain',
    headStyles: { fontSize: 11, textColor: [15, 23, 42], fontStyle: 'bold' },
    margin: { left: 28, right: 28 },
  });
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2,
    head: [['Type', 'Number', 'Title']],
    body: report.documents.length
      ? report.documents.map((d) => [d.type, d.number, d.title])
      : [['— register empty —', '', '']],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    margin: { left: 28, right: 28 },
  });

  // Verification table
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18,
    head: [['Clause', 'Requirement', 'Suggested (conf.)', 'Supporting Doc(s)', 'Verified', 'Status']],
    body: report.rows.map((r) => [
      r.clauseId + (r.missingEvidence ? '  ⚠' : ''),
      r.requirement,
      r.suggested ? `${r.suggested}\n(${r.confidence})` : r.confidence,
      r.docs,
      r.verified ? 'Yes' : '—',
      r.statusLabel,
    ]),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [74, 71, 176], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 130 },
      2: { cellWidth: 95 },
      3: { cellWidth: 80 },
      4: { cellWidth: 42, halign: 'center' },
    },
    margin: { left: 28, right: 28 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && String(data.cell.raw ?? '').includes('⚠')) {
        data.cell.styles.textColor = [190, 30, 45];
      }
    },
  });

  // Missing evidence list
  const missing = report.rows.filter((r) => r.missingEvidence);
  if (missing.length) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18,
      head: [['Missing Evidence — clauses without supporting documentation']],
      body: missing.map((r) => [`${r.clauseId} — ${r.requirement}`]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [190, 30, 45], textColor: 255 },
      margin: { left: 28, right: 28 },
    });
  }

  doc.save(`${safeName(project.name)}_ncc_assessment.pdf`);
}

/* --------------------------------- helpers --------------------------------- */

function pdfHeader(doc: jsPDF, project: Project, title: string) {
  doc.setFontSize(16);
  doc.setTextColor(91, 89, 207);
  doc.text('BuildBoard', 28, 34);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 28, 54);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${project.name}  ·  ${project.address}`, 28, 70);
  doc.text(
    `Building class: ${project.buildingClasses.join(', ')}   |   NCC: ${project.nccVolumes.join(
      ', ',
    )}   |   Generated ${new Date().toLocaleDateString()}`,
    28,
    84,
  );
}
