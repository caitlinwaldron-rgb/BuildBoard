# BuildBoard

An offline-first drawing register, NCC clause tracker, **deliverable planner and project calendar**
for architects working on NCC-compliant projects in Australia. All data lives in your browser
(localStorage) — no account, no backend.

## Quick start

```bash
cd buildboard
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # type-checks + bundles to dist/
npm run preview  # serve the production build locally
```

## What it does

| Area | Capability |
|---|---|
| **Projects** | Create projects with building class(es); NCC volume is derived automatically. Optional key deadline. Dashboard shows drawing counts, last-modified and the project due date (overdue flagged red). |
| **Drawing register** | Flat, sortable table with inline editing of number, title, discipline, revision, status, **due date** and notes. Overdue rows highlighted. Search, filter (status / discipline / milestone) and group-by. |
| **Discipline & milestone tagging** | A / S / M / E / C / L / P / ID chips and DA / CC / Construction / As-built / Tender milestones per drawing. |
| **NCC clause tagging** | Searchable clause picker filtered to the project's building class & volume (NCC 2022 library, Vol 1 Parts B–J and Vol 2 Parts H1–H7). |
| **NCC compliance matrix** | Clause × drawing grid; applicable clauses with no coverage are flagged amber. |
| **Deliverable tracker** | Drawings grouped by milestone with an issued / outstanding % rollup. |
| **Calendar** | Monthly grid (Mon-start) of drawing due dates, the project deadline, and categorised events (meeting / milestone / site-visit / submission / deadline / other) with start/end times and attendees. Today highlighted; overdue items flagged red; "Upcoming" sidebar. Add events or drawing due dates inline. |
| **Bulk import** | Paste or upload a CSV (header-aware, including a Due Date column; downloadable template included). |
| **Exports** | Drawing Register, NCC Matrix, Deliverable Tracker and **Calendar / Schedule** → both `.xlsx` (SheetJS) and `.pdf` (jsPDF). |

## Tech stack

Vite 6 · React 18 + TypeScript (strict) · Tailwind CSS v4 · Zustand (+ `persist`) ·
React Router v6 (hash router) · SheetJS · jsPDF + jspdf-autotable · lucide-react.

## Project structure

```
src/
  data/nccClauses.ts     Curated NCC 2022 clause library
  lib/export.ts          PDF + Excel generation for all four outputs
  lib/csv.ts             CSV parser + import-template
  lib/dates.ts           Local-time ISO-date helpers + month-grid builder
  pages/                 Dashboard, NewProject, Register, Matrix, Tracker, Calendar, Outputs, Settings
  components/            ui primitives, NccClausePicker, ImportModal, ProjectHeader
  store.ts               Zustand store with localStorage persistence (projects, drawings, events)
  types.ts               Domain types (Project, Drawing, NCCClause, CalendarEvent, …)
  constants.ts           Building classes, disciplines, statuses, milestones, event categories
```

## Notes & next steps

- The NCC clause library is a curated, representative subset (~50 clauses) — expand or replace
  `src/data/nccClauses.ts` with a fuller set as needed.
- Drawing numbers are free text (no enforced convention).
- Stores the current revision only — revision history is a future addition.
- Dates are stored as local `yyyy-mm-dd` strings; overdue = due date in the past and the drawing
  has not yet reached an "issued" status.
- Roadmap candidates: JSON backup/import, multi-project portfolio view, revision history,
  tailored certifier report format, recurring calendar events.

> **Zustand note:** selectors must not return freshly-created arrays/objects (e.g. `s.drawings.filter(...)`)
> directly — under React 18's `useSyncExternalStore` that triggers an infinite render loop. Select the
> stable array and derive with `useMemo` (see any page component).
