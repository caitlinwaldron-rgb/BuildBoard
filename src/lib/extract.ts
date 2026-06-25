import * as XLSX from 'xlsx';

/** Cap stored/extracted text so localStorage doesn't blow its quota. */
const MAX_CHARS = 60_000;

export interface ExtractResult {
  text: string;
  /** True when the file is an image / scan we can't read text from offline. */
  ocrPending: boolean;
}

const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export const ACCEPTED_UPLOAD =
  '.pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.jpg,.jpeg,.png,application/pdf,image/*,text/plain';

const cap = (s: string) => (s.length > MAX_CHARS ? s.slice(0, MAX_CHARS) : s).trim();

/** Extract readable text from an uploaded file, dispatching by extension. */
export async function extractText(file: File): Promise<ExtractResult> {
  const e = ext(file.name);
  try {
    if (['txt', 'md', 'csv', 'log'].includes(e) || file.type.startsWith('text/')) {
      return { text: cap(await file.text()), ocrPending: false };
    }
    if (['xlsx', 'xls'].includes(e)) {
      return { text: cap(await extractSpreadsheet(file)), ocrPending: false };
    }
    if (e === 'docx') {
      return { text: cap(await extractDocx(file)), ocrPending: false };
    }
    if (e === 'pdf' || file.type === 'application/pdf') {
      const text = await extractPdf(file);
      // A text-less PDF is almost certainly a scan — flag for manual/OCR review.
      return { text: cap(text), ocrPending: text.trim().length < 20 };
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e) || file.type.startsWith('image/')) {
      // Offline OCR is not bundled — accept the file but flag for manual text entry.
      return { text: '', ocrPending: true };
    }
  } catch (err) {
    console.warn('extractText failed for', file.name, err);
  }
  return { text: '', ocrPending: true };
}

async function extractSpreadsheet(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const parts: string[] = [];
  wb.SheetNames.forEach((name) => {
    parts.push(`# ${name}`);
    parts.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]));
  });
  return parts.join('\n');
}

async function extractDocx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const docXml = zip.file('word/document.xml');
  if (!docXml) return '';
  const xml = await docXml.async('string');
  // Turn paragraph/break tags into newlines, then strip the rest.
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n');
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Bundle the worker locally (Vite ?url) so extraction works offline.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const out: string[] = [];
  const maxPages = Math.min(doc.numPages, 40);
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out.push(
      content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' '),
    );
    if (out.join(' ').length > MAX_CHARS) break;
  }
  return out.join('\n');
}
