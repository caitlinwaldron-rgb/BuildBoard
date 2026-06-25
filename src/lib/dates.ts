/** Date helpers working in local time, using 'yyyy-mm-dd' ISO date strings. */

const pad = (n: number) => String(n).padStart(2, '0');

/** Local 'yyyy-mm-dd' for a Date. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today as 'yyyy-mm-dd' (local). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse 'yyyy-mm-dd' into a local Date (midnight). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Build a 6-week grid (42 cells) of Dates covering the given month, starting on
 * Monday. Cells outside the month are included so the grid is always rectangular.
 */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=Sun..6=Sat → offset so Monday is column 0.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** Friendly date label, e.g. '22 Jun 2026'. */
export function formatDateLong(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Days between two ISO dates (b - a), ignoring time. */
export function daysBetween(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Format 'HH:mm' to a friendly '9:30 am'. Returns '' for empty input. */
export function formatTime(t?: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const ampm = h < 12 ? 'am' : 'pm';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${pad(m || 0)} ${ampm}`;
}
