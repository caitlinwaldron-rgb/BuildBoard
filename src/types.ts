export type BuildingClass =
  | 'Class 1a'
  | 'Class 1b'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7a'
  | 'Class 7b'
  | 'Class 8'
  | 'Class 9a'
  | 'Class 9b'
  | 'Class 9c'
  | 'Class 10a'
  | 'Class 10b'
  | 'Class 10c';

export type DrawingStatus =
  | 'not_started'
  | 'in_progress'
  | 'issued_for_review'
  | 'issued_for_da'
  | 'issued_for_cc'
  | 'construction_issue'
  | 'as_built';

export type Discipline = 'A' | 'S' | 'M' | 'E' | 'C' | 'L' | 'P' | 'ID';

export type DeliverableMilestone = 'DA' | 'CC' | 'Construction' | 'As-built' | 'Tender';

export type NCCVolume = 'Volume 1' | 'Volume 2';

export type EventCategory =
  | 'meeting'
  | 'milestone'
  | 'site-visit'
  | 'submission'
  | 'deadline'
  | 'other';

export interface Project {
  id: string;
  name: string;
  address: string;
  buildingClasses: BuildingClass[];
  nccVolumes: NCCVolume[];
  daNumber?: string;
  ccNumber?: string;
  certifier?: string;
  dueDate?: string; // ISO date (yyyy-mm-dd) — key project deadline
  color?: string; // folder tint id (see FOLDER_TINTS); falls back to a stable hash
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface Drawing {
  id: string;
  projectId: string;
  drawingNumber: string; // e.g. 'A-001'
  title: string;
  discipline: Discipline;
  revision: string; // e.g. 'A', 'P1', '01'
  status: DrawingStatus;
  nccClauses: string[]; // e.g. ['C1.1', 'D1.1', 'F1.5']
  milestones: DeliverableMilestone[];
  dueDate?: string; // ISO date (yyyy-mm-dd) — when this drawing is due
  notes: string;
  tags: string[]; // custom freeform tags
  updatedAt: string;
}

export interface NCCClause {
  id: string; // e.g. 'C1.1'
  volume: NCCVolume;
  part: string; // e.g. 'C' (fire resistance)
  partTitle: string;
  title: string;
  applicableClasses: BuildingClass[];
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  category: EventCategory;
  date: string; // ISO date (yyyy-mm-dd)
  startTime?: string; // 'HH:mm'
  endTime?: string; // 'HH:mm'
  attendees?: string; // free text, comma-separated
  notes?: string;
}

/** An entry in the Project Documentation Register — the evidence for compliance. */
export interface ProjectDocument {
  id: string;
  projectId: string;
  type: string; // e.g. 'Site Plan', 'Floor Plan', 'Elevation'
  number: string; // e.g. 'A001'
  title: string; // e.g. 'Ground Floor Plan'
  // Upload + auto-extraction fields (optional; only set for uploaded files)
  source?: 'manual' | 'upload';
  fileName?: string;
  mime?: string;
  content?: string; // extracted text (capped)
  detectedClauseIds?: string[]; // auto-detected NCC references (user-editable)
  ocrPending?: boolean; // true for images / scans with no auto-extracted text
}

export type DocStatus = 'documented' | 'partial' | 'not_documented' | 'na';

/** A user's self-assessment of one NCC clause against the documentation register. */
export interface ClauseAssessment {
  projectId: string;
  clauseId: string;
  docIds: string[]; // supporting ProjectDocument ids
  status: DocStatus;
  notes: string;
  verified: boolean; // user has actively confirmed the evidence
}
