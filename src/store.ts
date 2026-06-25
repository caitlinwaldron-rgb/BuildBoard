import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarEvent,
  ClauseAssessment,
  Drawing,
  Project,
  ProjectDocument,
} from './types';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => new Date().toISOString();

interface State {
  projects: Project[];
  drawings: Drawing[];
  events: CalendarEvent[];
  documents: ProjectDocument[];
  assessments: ClauseAssessment[];

  // Projects
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  /** Move `draggedId` to the position currently held by `targetId`. */
  reorderProject: (draggedId: string, targetId: string) => void;
  getProject: (id: string) => Project | undefined;

  // Drawings
  addDrawing: (projectId: string, data?: Partial<Drawing>) => string;
  addDrawings: (projectId: string, rows: Partial<Drawing>[]) => number;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  drawingsFor: (projectId: string) => Drawing[];

  // Calendar events
  addEvent: (projectId: string, data: Omit<CalendarEvent, 'id' | 'projectId'>) => string;
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'projectId'>>) => void;
  deleteEvent: (id: string) => void;
  eventsFor: (projectId: string) => CalendarEvent[];

  // Documentation register
  addDocument: (projectId: string, data?: Partial<ProjectDocument>) => string;
  addDocuments: (projectId: string, rows: Partial<ProjectDocument>[]) => number;
  updateDocument: (id: string, patch: Partial<ProjectDocument>) => void;
  deleteDocument: (id: string) => void;
  documentsFor: (projectId: string) => ProjectDocument[];

  // Bulk import — used by the sample project generator
  bulkImport: (data: {
    project: Project;
    drawings: Drawing[];
    documents: ProjectDocument[];
    assessments: ClauseAssessment[];
    events: CalendarEvent[];
  }) => void;

  // NCC clause self-assessments (keyed by projectId + clauseId)
  setAssessment: (
    projectId: string,
    clauseId: string,
    patch: Partial<Omit<ClauseAssessment, 'projectId' | 'clauseId'>>,
  ) => void;
  assessmentsFor: (projectId: string) => ClauseAssessment[];
}

const blankDrawing = (projectId: string, data?: Partial<Drawing>): Drawing => ({
  id: uid(),
  projectId,
  drawingNumber: '',
  title: '',
  discipline: 'A',
  revision: 'A',
  status: 'not_started',
  nccClauses: [],
  milestones: [],
  notes: '',
  tags: [],
  updatedAt: now(),
  ...data,
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projects: [],
      drawings: [],
      events: [],
      documents: [],
      assessments: [],

      createProject: (data) => {
        const id = uid();
        const project: Project = { ...data, id, createdAt: now(), updatedAt: now() };
        set((s) => ({ projects: [project, ...s.projects] }));
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          drawings: s.drawings.filter((d) => d.projectId !== id),
          events: s.events.filter((e) => e.projectId !== id),
          documents: s.documents.filter((d) => d.projectId !== id),
          assessments: s.assessments.filter((a) => a.projectId !== id),
        })),

      reorderProject: (draggedId, targetId) =>
        set((s) => {
          if (draggedId === targetId) return {};
          const arr = [...s.projects];
          const from = arr.findIndex((p) => p.id === draggedId);
          const to = arr.findIndex((p) => p.id === targetId);
          if (from === -1 || to === -1) return {};
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return { projects: arr };
        }),

      getProject: (id) => get().projects.find((p) => p.id === id),

      addDrawing: (projectId, data) => {
        const drawing = blankDrawing(projectId, data);
        set((s) => ({
          drawings: [...s.drawings, drawing],
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, updatedAt: now() } : p,
          ),
        }));
        return drawing.id;
      },

      addDrawings: (projectId, rows) => {
        const created = rows.map((r) => blankDrawing(projectId, r));
        set((s) => ({
          drawings: [...s.drawings, ...created],
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, updatedAt: now() } : p,
          ),
        }));
        return created.length;
      },

      updateDrawing: (id, patch) =>
        set((s) => {
          const target = s.drawings.find((d) => d.id === id);
          return {
            drawings: s.drawings.map((d) =>
              d.id === id ? { ...d, ...patch, updatedAt: now() } : d,
            ),
            projects: target
              ? s.projects.map((p) =>
                  p.id === target.projectId ? { ...p, updatedAt: now() } : p,
                )
              : s.projects,
          };
        }),

      deleteDrawing: (id) =>
        set((s) => ({ drawings: s.drawings.filter((d) => d.id !== id) })),

      drawingsFor: (projectId) => get().drawings.filter((d) => d.projectId === projectId),

      addEvent: (projectId, data) => {
        const event: CalendarEvent = { ...data, id: uid(), projectId };
        set((s) => ({
          events: [...s.events, event],
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, updatedAt: now() } : p,
          ),
        }));
        return event.id;
      },

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      eventsFor: (projectId) => get().events.filter((e) => e.projectId === projectId),

      addDocument: (projectId, data) => {
        const doc: ProjectDocument = {
          id: uid(),
          projectId,
          type: '',
          number: '',
          title: '',
          ...data,
        };
        set((s) => ({ documents: [...s.documents, doc] }));
        return doc.id;
      },

      addDocuments: (projectId, rows) => {
        const created = rows.map((r) => ({
          id: uid(),
          projectId,
          type: '',
          number: '',
          title: '',
          ...r,
        }));
        set((s) => ({ documents: [...s.documents, ...created] }));
        return created.length;
      },

      updateDocument: (id, patch) =>
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDocument: (id) =>
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
          // also drop this doc from any assessment's supporting-doc list
          assessments: s.assessments.map((a) =>
            a.docIds.includes(id) ? { ...a, docIds: a.docIds.filter((x) => x !== id) } : a,
          ),
        })),

      documentsFor: (projectId) => get().documents.filter((d) => d.projectId === projectId),

      setAssessment: (projectId, clauseId, patch) =>
        set((s) => {
          const existing = s.assessments.find(
            (a) => a.projectId === projectId && a.clauseId === clauseId,
          );
          if (existing) {
            return {
              assessments: s.assessments.map((a) =>
                a === existing ? { ...a, ...patch } : a,
              ),
            };
          }
          const created: ClauseAssessment = {
            projectId,
            clauseId,
            docIds: [],
            status: 'not_documented',
            notes: '',
            verified: false,
            ...patch,
          };
          return { assessments: [...s.assessments, created] };
        }),

      assessmentsFor: (projectId) =>
        get().assessments.filter((a) => a.projectId === projectId),

      bulkImport: (data) =>
        set((s) => ({
          projects:    [data.project, ...s.projects],
          drawings:    [...s.drawings,    ...data.drawings],
          documents:   [...s.documents,   ...data.documents],
          events:      [...s.events,      ...data.events],
          assessments: [...s.assessments, ...data.assessments],
        })),
    }),
    { name: 'buildboard-store-v1' },
  ),
);
