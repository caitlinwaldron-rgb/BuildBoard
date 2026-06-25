import type {
  BuildingClass,
  CalendarEvent,
  ClauseAssessment,
  DeliverableMilestone,
  Discipline,
  DocStatus,
  Drawing,
  DrawingStatus,
  EventCategory,
  NCCVolume,
  Project,
  ProjectDocument,
} from '../types';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
};
const dateStr = (d: Date) => d.toISOString().split('T')[0];
const fromNow = (days: number) => dateStr(new Date(Date.now() + days * 86_400_000));
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectType =
  | 'residential_house'
  | 'multi_residential'
  | 'commercial_office'
  | 'education'
  | 'mixed_use';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residential_house: 'Residential House',
  multi_residential: 'Multi-Residential Apartment',
  commercial_office: 'Commercial Office',
  education: 'Education Building',
  mixed_use: 'Mixed Use Development',
};

export interface GeneratedSample {
  projectType: ProjectType;
  typeLabel: string;
  project: Project;
  drawings: Drawing[];
  documents: ProjectDocument[];
  assessments: ClauseAssessment[];
  events: CalendarEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing template format: [number, title, discipline, milestones, nccClauses]
// ─────────────────────────────────────────────────────────────────────────────
type DT = [string, string, Discipline, DeliverableMilestone[], string[]];

const RESIDENTIAL_DRAWINGS: DT[] = [
  ['A-001', 'Cover Sheet & Project Information',        'A', ['DA', 'CC'], []],
  ['A-002', 'Site Analysis & Context Plan',             'A', ['DA'], []],
  ['A-003', 'Demolition & Existing Conditions Plan',    'A', ['DA', 'CC'], []],
  ['A-004', 'Site Plan',                                'A', ['DA', 'CC'], ['H2D2']],
  ['A-005', 'Ground Floor Plan',                        'A', ['DA', 'CC', 'Construction'], ['H4D2', 'H4D3']],
  ['A-006', 'First Floor Plan',                         'A', ['DA', 'CC', 'Construction'], ['H4D2']],
  ['A-007', 'Roof Plan',                                'A', ['DA', 'CC', 'Construction'], ['H2D2']],
  ['A-008', 'North Elevation',                          'A', ['DA', 'CC'], []],
  ['A-009', 'South Elevation',                          'A', ['DA', 'CC'], []],
  ['A-010', 'East Elevation',                           'A', ['DA', 'CC'], []],
  ['A-011', 'West Elevation',                           'A', ['DA', 'CC'], []],
  ['A-012', 'Section A-A (Longitudinal)',               'A', ['DA', 'CC'], ['H4D2']],
  ['A-013', 'Section B-B (Transverse)',                 'A', ['CC', 'Construction'], ['H4D2']],
  ['A-014', 'Stair & Balustrade Details',               'A', ['CC', 'Construction'], ['H5D2', 'H5D3']],
  ['A-015', 'Waterproofing Details — Wet Areas',        'A', ['CC', 'Construction'], ['H2D5']],
  ['A-016', 'Wall Section Details',                     'A', ['CC', 'Construction'], ['H6D2']],
  ['A-017', 'Door Schedule & Details',                  'A', ['CC', 'Construction'], []],
  ['A-018', 'Window Schedule & Glazing Notes',          'A', ['CC', 'Construction'], ['H4D5']],
  ['A-019', 'Finishes Schedule',                        'A', ['CC', 'Construction'], []],
  ['A-020', 'Accessibility Plan',                       'A', ['DA', 'CC'], []],
  ['S-001', 'Structural Footing & Foundation Plan',     'S', ['CC', 'Construction'], ['H1D4']],
  ['S-002', 'Structural Framing Plan',                  'S', ['CC', 'Construction'], ['H1D4']],
  ['P-001', 'Site Drainage & Hydraulic Plan',           'P', ['CC', 'Construction'], ['H2D2']],
];

const MULTI_RES_DRAWINGS: DT[] = [
  ['A-001', 'Cover Sheet & Project Summary',            'A', ['DA', 'CC'], []],
  ['A-002', 'Site Plan',                                'A', ['DA', 'CC'], []],
  ['A-003', 'Demolition Plan',                          'A', ['DA'], []],
  ['A-004', 'Ground Floor Plan',                        'A', ['DA', 'CC', 'Construction'], ['D1.2', 'D3.1', 'F1.7']],
  ['A-005', 'Level 1 — Typical Floor Plan',             'A', ['DA', 'CC', 'Construction'], ['C3.11', 'D1.2']],
  ['A-006', 'Level 2 — Typical Floor Plan',             'A', ['CC', 'Construction'], ['C3.11']],
  ['A-007', 'Level 3 Floor Plan',                       'A', ['CC', 'Construction'], []],
  ['A-008', 'Level 4 / Rooftop Amenity Plan',           'A', ['DA', 'CC'], []],
  ['A-009', 'Roof Plan',                                'A', ['DA', 'CC'], []],
  ['A-010', 'North Elevation',                          'A', ['DA', 'CC'], ['J1.5']],
  ['A-011', 'South Elevation',                          'A', ['DA', 'CC'], ['J1.5']],
  ['A-012', 'East Elevation',                           'A', ['DA', 'CC'], []],
  ['A-013', 'West Elevation',                           'A', ['DA', 'CC'], []],
  ['A-014', 'Section A-A (Building)',                   'A', ['DA', 'CC'], ['D1.4', 'C2.2']],
  ['A-015', 'Section B-B (Stair & Lift)',               'A', ['CC', 'Construction'], ['D1.2']],
  ['A-016', 'Unit Type A — 1 Bed Plans',                'A', ['DA', 'CC'], ['F5.2']],
  ['A-017', 'Unit Type B — 2 Bed Plans',                'A', ['DA', 'CC'], ['F5.2']],
  ['A-018', 'Unit Type C — 3 Bed Plans',                'A', ['DA', 'CC'], []],
  ['A-019', 'Accessibility & DDA Plan',                 'A', ['DA', 'CC'], ['D3.1', 'D3.3']],
  ['A-020', 'Fire Safety & Egress Plan',                'A', ['DA', 'CC'], ['C1.1', 'D1.2', 'E4.5']],
  ['A-021', 'Balcony & External Details',               'A', ['CC', 'Construction'], []],
  ['A-022', 'Wall Section Details',                     'A', ['CC', 'Construction'], ['J1.2', 'F5.2']],
  ['A-023', 'Stair & Balustrade Details',               'A', ['CC', 'Construction'], ['D2.13', 'D2.16']],
  ['A-024', 'Door & Window Schedule',                   'A', ['CC', 'Construction'], ['J1.5']],
  ['A-025', 'Finishes & Materials Schedule',            'A', ['CC', 'Construction'], []],
  ['S-001', 'Ground Floor Structure Plan',              'S', ['CC', 'Construction'], ['B1.1']],
  ['S-002', 'Typical Floor Structure Plan',             'S', ['CC', 'Construction'], ['B1.1']],
  ['M-001', 'Mechanical Services Coordination Plan',    'M', ['CC'], ['E2.2', 'F4.5']],
  ['E-001', 'Electrical Services Coordination Plan',    'E', ['CC'], ['E4.2', 'E4.5']],
  ['P-001', 'Hydraulic Services Plan',                  'P', ['CC'], ['F1.7', 'F2.3']],
];

const COMMERCIAL_DRAWINGS: DT[] = [
  ['A-001', 'Cover Sheet & Project Data',               'A', ['DA', 'CC'], []],
  ['A-002', 'Site Plan & Context',                      'A', ['DA', 'CC'], []],
  ['A-003', 'Ground Floor — Lobby & Core Plan',         'A', ['DA', 'CC', 'Construction'], ['D3.1', 'D1.2']],
  ['A-004', 'Typical Office Floor Plan (Levels 2–8)',   'A', ['DA', 'CC'], ['D1.4']],
  ['A-005', 'Level 9 — Executive Suite Plan',           'A', ['CC', 'Construction'], []],
  ['A-006', 'Level 10 — Plant Room & Roof Plan',        'A', ['CC', 'Construction'], []],
  ['A-007', 'North & South Elevations',                 'A', ['DA', 'CC'], ['J1.5', 'C3.2']],
  ['A-008', 'East & West Elevations',                   'A', ['DA', 'CC'], ['J1.5']],
  ['A-009', 'Building Section A-A',                     'A', ['DA', 'CC'], ['C2.2', 'D1.4']],
  ['A-010', 'Building Section B-B',                     'A', ['CC', 'Construction'], []],
  ['A-011', 'Core Plan — Stair & Lift',                 'A', ['CC', 'Construction'], ['D1.2', 'D2.13']],
  ['A-012', 'Accessibility & DDA Compliance Plan',      'A', ['DA', 'CC'], ['D3.1', 'D3.3']],
  ['A-013', 'Fire Safety & Egress Plan',                'A', ['DA', 'CC'], ['C1.1', 'E4.5', 'E1.5']],
  ['A-014', 'Facade Detail — Typical Bay',              'A', ['CC', 'Construction'], ['J1.5', 'J3.2']],
  ['A-015', 'Ground Floor Lobby Details',               'A', ['CC', 'Construction'], ['D3.1']],
  ['A-016', 'Toilet & Amenity Plans',                   'A', ['CC', 'Construction'], ['F2.3']],
  ['A-017', 'Stair Details & Handrails',                'A', ['CC', 'Construction'], ['D2.13', 'D2.16']],
  ['A-018', 'Door & Hardware Schedule',                 'A', ['CC', 'Construction'], []],
  ['A-019', 'Window & Glazing Schedule',                'A', ['CC', 'Construction'], ['J1.5']],
  ['A-020', 'Internal Finishes Schedule',               'A', ['CC', 'Construction'], []],
  ['S-001', 'Ground Floor & Basement Structure',        'S', ['CC', 'Construction'], ['B1.1']],
  ['S-002', 'Typical Floor Structure Plan',             'S', ['CC', 'Construction'], ['B1.1']],
  ['M-001', 'Mechanical Coordination Plan',             'M', ['CC'], ['E2.2', 'F4.5']],
  ['E-001', 'Electrical Coordination Plan',             'E', ['CC'], ['E4.2', 'E4.5', 'J6.2']],
  ['P-001', 'Hydraulic & Fire Services Plan',           'P', ['CC'], ['E1.3', 'E1.4', 'F2.3']],
];

const EDUCATION_DRAWINGS: DT[] = [
  ['A-001', 'Cover Sheet & Project Data',               'A', ['DA', 'CC'], []],
  ['A-002', 'Site Plan',                                'A', ['DA', 'CC'], []],
  ['A-003', 'Demolition Plan',                          'A', ['DA'], []],
  ['A-004', 'Ground Floor — Classroom Block',           'A', ['DA', 'CC', 'Construction'], ['D3.1', 'D1.2']],
  ['A-005', 'Ground Floor — Hall & Administration',     'A', ['DA', 'CC', 'Construction'], ['H1.1', 'D1.2']],
  ['A-006', 'First Floor Plan',                         'A', ['DA', 'CC'], ['D1.4']],
  ['A-007', 'Roof Plan',                                'A', ['DA', 'CC'], []],
  ['A-008', 'North Elevation',                          'A', ['DA', 'CC'], ['J1.5']],
  ['A-009', 'South Elevation',                          'A', ['DA', 'CC'], []],
  ['A-010', 'East Elevation',                           'A', ['DA', 'CC'], []],
  ['A-011', 'West Elevation',                           'A', ['DA', 'CC'], []],
  ['A-012', 'Section A-A (Classroom Block)',            'A', ['DA', 'CC'], ['H1.1', 'C2.2']],
  ['A-013', 'Section B-B (Hall)',                       'A', ['CC', 'Construction'], ['H1.1']],
  ['A-014', 'Accessibility & DDA Plan',                 'A', ['DA', 'CC'], ['D3.1', 'D3.3']],
  ['A-015', 'Fire Safety & Egress Plan',                'A', ['DA', 'CC'], ['E4.5', 'E2.2', 'C1.1']],
  ['A-016', 'Classroom Joinery & Fitout Details',       'A', ['CC', 'Construction'], ['F4.5']],
  ['A-017', 'Toilet & Amenity Plans',                   'A', ['CC', 'Construction'], ['F2.3', 'D3.3']],
  ['A-018', 'Wall Section Details',                     'A', ['CC', 'Construction'], ['J1.2']],
  ['A-019', 'Door & Window Schedule',                   'A', ['CC', 'Construction'], ['J1.5']],
  ['A-020', 'Finishes Schedule',                        'A', ['CC', 'Construction'], []],
  ['S-001', 'Ground Floor Structure Plan',              'S', ['CC', 'Construction'], ['B1.1']],
  ['M-001', 'Mechanical Coordination Plan',             'M', ['CC'], ['F4.5']],
  ['E-001', 'Electrical Coordination Plan',             'E', ['CC'], ['E4.2', 'E4.5', 'J6.2']],
];

const MIXED_USE_DRAWINGS: DT[] = [
  ['A-001', 'Cover Sheet & Project Data',               'A', ['DA', 'CC'], []],
  ['A-002', 'Site Plan',                                'A', ['DA', 'CC'], []],
  ['A-003', 'Demolition & Survey Plan',                 'A', ['DA'], []],
  ['A-004', 'Ground Floor — Retail Plan',               'A', ['DA', 'CC', 'Construction'], ['D1.2', 'D3.1']],
  ['A-005', 'Ground Floor — Services & BOH',            'A', ['CC'], []],
  ['A-006', 'Level 1 — Retail Mezzanine / Lobby',       'A', ['DA', 'CC'], ['D3.1', 'D3.3']],
  ['A-007', 'Level 2 — Residential Floor (Typical)',    'A', ['DA', 'CC', 'Construction'], ['C3.11', 'F5.2']],
  ['A-008', 'Level 3 — Residential Floor Plan',         'A', ['CC', 'Construction'], []],
  ['A-009', 'Level 4 — Residential Floor Plan',         'A', ['CC', 'Construction'], []],
  ['A-010', 'Level 5 — Rooftop Amenity & Plant',        'A', ['DA', 'CC'], []],
  ['A-011', 'Roof Plan',                                'A', ['DA', 'CC'], []],
  ['A-012', 'North & East Elevations',                  'A', ['DA', 'CC'], ['J1.5']],
  ['A-013', 'South & West Elevations',                  'A', ['DA', 'CC'], ['J1.5']],
  ['A-014', 'Section A-A (Full Building)',              'A', ['DA', 'CC'], ['C2.2', 'D1.4', 'C1.1']],
  ['A-015', 'Section B-B',                              'A', ['CC', 'Construction'], []],
  ['A-016', 'Unit Type A & B Plans',                    'A', ['DA', 'CC'], ['F5.2']],
  ['A-017', 'Retail Tenancy Layout Schedule',           'A', ['DA', 'CC'], []],
  ['A-018', 'Accessibility & DDA Plan',                 'A', ['DA', 'CC'], ['D3.1', 'D3.3']],
  ['A-019', 'Fire Safety & Egress Plan',                'A', ['DA', 'CC'], ['C1.1', 'E4.5', 'E1.5']],
  ['A-020', 'Wall Section — Retail/Residential Interface', 'A', ['CC', 'Construction'], ['F5.2', 'J1.2']],
  ['A-021', 'Facade Detail',                            'A', ['CC', 'Construction'], ['J1.5', 'J3.2']],
  ['A-022', 'Door, Window & Hardware Schedule',         'A', ['CC', 'Construction'], []],
  ['A-023', 'Internal Finishes Schedule — Residential', 'A', ['CC', 'Construction'], []],
  ['A-024', 'Internal Finishes Schedule — Retail',      'A', ['CC', 'Construction'], []],
  ['S-001', 'Ground Floor & Podium Structure Plan',     'S', ['CC', 'Construction'], ['B1.1']],
  ['S-002', 'Residential Tower Structure Plan',         'S', ['CC', 'Construction'], ['B1.1']],
  ['M-001', 'Mechanical Coordination Plan',             'M', ['CC'], ['E2.2', 'F4.5']],
  ['E-001', 'Electrical Coordination Plan',             'E', ['CC'], ['E4.2', 'J6.2']],
  ['P-001', 'Hydraulic & Fire Services Plan',           'P', ['CC'], ['E1.3', 'F1.7', 'F2.3']],
];

// ─────────────────────────────────────────────────────────────────────────────
// NCC clause sets per project type
// ─────────────────────────────────────────────────────────────────────────────
const NCC_CLAUSES: Record<ProjectType, string[]> = {
  residential_house: ['A2.1V2','A2.2V2','A5.1V2','H1D4','H2D2','H2D5','H3D3','H3D5','H4D2','H4D3','H4D5','H5D2','H5D3','H6D2','H6D5'],
  multi_residential: ['A2.1','A2.2','B1.1','C1.1','C1.10','C2.2','C3.11','D1.2','D1.4','D2.13','D2.16','D3.1','D3.3','E1.5','E2.2','E4.2','E4.5','F1.7','F2.3','F4.5','F5.2','J1.2','J1.5','J3.2'],
  commercial_office:  ['A2.1','A2.2','B1.1','C1.1','C2.2','C3.2','D1.2','D1.4','D1.6','D2.13','D2.16','D3.1','D3.3','E1.3','E1.4','E1.5','E2.2','E4.2','E4.5','F2.3','F4.5','J1.2','J1.5','J3.2','J6.2'],
  education:          ['A2.1','A2.2','B1.1','C1.1','C2.2','D1.2','D1.4','D1.6','D2.13','D2.16','D3.1','D3.3','E1.5','E2.2','E4.2','E4.5','F2.3','F4.5','H1.1','J1.2','J1.5','J6.2'],
  mixed_use:          ['A2.1','A2.2','B1.1','C1.1','C2.2','C3.11','D1.2','D1.4','D1.6','D3.1','D3.3','E1.5','E2.2','E4.2','E4.5','F1.7','F2.3','F5.2','J1.2','J1.5','J3.2','J6.2'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Document templates per project type: [type, number, title]
// ─────────────────────────────────────────────────────────────────────────────
type DocT = [string, string, string];
const DOCUMENTS: Record<ProjectType, DocT[]> = {
  residential_house: [
    ['Report',        'RPT-001', 'Geotechnical Investigation Report'],
    ['Report',        'RPT-002', 'NatHERS Energy Efficiency Assessment'],
    ['Report',        'RPT-003', 'Bushfire Attack Level (BAL) Assessment'],
    ['Specification', 'SPEC-001', 'Project Specification — Architectural Works'],
    ['Certificate',   'CERT-001', 'Structural Engineering Certificate — Footings'],
    ['Report',        'RPT-004', 'Stormwater Management Plan'],
    ['Drawing',       'SK-001', 'Surveyor Identification Survey Plan'],
    ['Report',        'RPT-005', 'Section J Energy Efficiency Report'],
    ['Certificate',   'CERT-002', 'Smoke Alarm Compliance Certificate'],
  ],
  multi_residential: [
    ['Report',        'RPT-001', 'Geotechnical Investigation Report'],
    ['Report',        'RPT-002', 'BASIX Certificate'],
    ['Report',        'RPT-003', 'Acoustic Assessment Report'],
    ['Report',        'RPT-004', 'Fire Engineering Report'],
    ['Report',        'RPT-005', 'Access Consultant Report (DDA)'],
    ['Specification', 'SPEC-001', 'Project Specification — Architectural'],
    ['Specification', 'SPEC-002', 'Fire Resistance Level Specification'],
    ['Certificate',   'CERT-001', 'Structural Engineering Certificate'],
    ['Report',        'RPT-006', 'Hydraulic Engineering Report'],
    ['Report',        'RPT-007', 'Wind Engineering Report'],
  ],
  commercial_office: [
    ['Report',        'RPT-001', 'Fire Engineering Brief & Report'],
    ['Report',        'RPT-002', 'Access Consultant Report (DDA)'],
    ['Report',        'RPT-003', 'Acoustic Report — Mechanical Services'],
    ['Report',        'RPT-004', 'Section J Energy Efficiency Report'],
    ['Report',        'RPT-005', 'Wind Engineering Report'],
    ['Specification', 'SPEC-001', 'Project Specification — Architectural'],
    ['Specification', 'SPEC-002', 'Facade Engineering Specification'],
    ['Certificate',   'CERT-001', 'Structural Engineering Certificate'],
    ['Report',        'RPT-006', 'Hydraulic Engineering Report'],
    ['Certificate',   'CERT-002', 'AS 1428 Accessibility Compliance Certificate'],
  ],
  education: [
    ['Report',        'RPT-001', 'Geotechnical Investigation Report'],
    ['Report',        'RPT-002', 'Acoustic Assessment — Classroom Noise Criteria'],
    ['Report',        'RPT-003', 'Access Consultant Report (DDA)'],
    ['Report',        'RPT-004', 'Fire Safety Engineering Report'],
    ['Specification', 'SPEC-001', 'Project Specification — Architectural'],
    ['Certificate',   'CERT-001', 'Structural Engineering Certificate'],
    ['Report',        'RPT-005', 'Section J Energy Efficiency Report'],
    ['Report',        'RPT-006', 'Hydraulic Engineering Report'],
  ],
  mixed_use: [
    ['Report',        'RPT-001', 'Geotechnical Investigation Report'],
    ['Report',        'RPT-002', 'BASIX Certificate — Residential Component'],
    ['Report',        'RPT-003', 'Acoustic Assessment Report'],
    ['Report',        'RPT-004', 'Fire Engineering Report'],
    ['Report',        'RPT-005', 'Access Consultant Report (DDA)'],
    ['Specification', 'SPEC-001', 'Project Specification — Architectural'],
    ['Certificate',   'CERT-001', 'Structural Engineering Certificate'],
    ['Report',        'RPT-006', 'Hydraulic Engineering Report'],
    ['Report',        'RPT-007', 'Wind Engineering Report'],
    ['Report',        'RPT-008', 'Section J Energy Efficiency Report'],
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Calendar event templates: [category, title, daysFromNow, notes]
// ─────────────────────────────────────────────────────────────────────────────
type EvT = [EventCategory, string, number, string];
const EVENTS: Record<ProjectType, EvT[]> = {
  residential_house: [
    ['milestone',  'Project Commencement',                  -90, 'Signed fee agreement. Project briefing held.'],
    ['milestone',  'Concept Design — Complete',             -60, 'Concept layouts reviewed and approved by client.'],
    ['milestone',  'Schematic Design — Complete',           -21, 'Schematic package issued to client for review.'],
    ['meeting',    'Design Development Review Meeting',       7, 'Client review of DD package. Agenda: finishes, materials, window selections.'],
    ['milestone',  'Design Development — Complete',          21, 'DD package finalised and signed off.'],
    ['milestone',  'DA Documentation — Issue',               45, 'DA drawings issued to certifier/council for lodgement.'],
    ['submission', 'Development Application — Lodgement',    55, 'DA lodged with local council.'],
    ['milestone',  'DA Approval — Expected',                120, 'Anticipated council determination date.'],
    ['meeting',    'Consultant Coordination Meeting',        90, 'Structural, hydraulic and energy consultants. Review CC scope.'],
    ['milestone',  'Construction Certificate Documentation', 135,'CC drawings and specs issued for approval.'],
    ['submission', 'Construction Certificate — Lodgement',  155, 'CC lodged with private certifier.'],
    ['milestone',  'Tender Issue',                          170, 'Construction drawings and specification issued for tender.'],
    ['milestone',  'Construction Commencement',             210, 'Site establishment and demolition.'],
    ['site-visit', 'Frame Stage Inspection',                270, 'Principal Certifier inspection — frame stage.'],
    ['site-visit', 'Pre-Lining Inspection',                 300, 'Inspection prior to internal lining installation.'],
    ['milestone',  'Practical Completion',                  365, 'Final inspection and defects list issued.'],
  ],
  multi_residential: [
    ['milestone',  'Project Commencement',                 -120, 'Project briefing and inception meeting held.'],
    ['milestone',  'Concept Design — Complete',             -90, 'Concept design approved. Planning pre-lodgement scheduled.'],
    ['milestone',  'Schematic Design — Complete',           -45, 'Schematic package reviewed by client and planning consultant.'],
    ['meeting',    'Planning Pre-Lodgement Meeting',        -30, 'Pre-DA meeting with council. Key planning issues identified.'],
    ['milestone',  'Design Development — Complete',          14, 'DD package finalised.'],
    ['meeting',    'Consultant Coordination — DD Stage',     20, 'Structural, hydraulic, acoustic, fire consultants.'],
    ['submission', 'Development Application — Lodgement',   42, 'DA lodged with council.'],
    ['meeting',    'Community Consultation Event',           60, 'Public exhibition period. Neighbour notification.'],
    ['milestone',  'DA Approval — Expected',               150, 'Anticipated council determination.'],
    ['meeting',    'Post-DA Review Meeting',               158, 'Review conditions of consent and scope amendments.'],
    ['milestone',  'CC Documentation — Issue',             180, 'CC drawings, specs and structural engineering issued.'],
    ['meeting',    'Consultant Coordination — CC Stage',   190, 'Coordinate fire, mechanical, electrical, hydraulic.'],
    ['submission', 'Construction Certificate — Lodgement', 220, 'CC lodged with private certifier.'],
    ['milestone',  'Tender Issue',                         250, 'Construction drawings and specification issued for tender.'],
    ['milestone',  'Construction Commencement',            310, 'Site establishment and bulk excavation.'],
    ['site-visit', 'Foundation & Footing Inspection',      370, 'Inspection of foundation works.'],
    ['site-visit', 'Structural Frame Inspection — L3',     450, 'Inspect structural frame at level 3.'],
    ['milestone',  'Practical Completion',                 730, 'Final inspection and handover to client.'],
  ],
  commercial_office: [
    ['milestone',  'Project Commencement',                 -100, 'Project inception. Brief confirmed.'],
    ['milestone',  'Concept Design — Complete',             -70, 'Concept design presented to client board.'],
    ['milestone',  'Schematic Design — Complete',           -35, 'Schematic package reviewed and approved.'],
    ['meeting',    'Planning Pre-Lodgement Meeting',        -20, 'Meeting with council re: DA requirements.'],
    ['milestone',  'Design Development — Complete',          21, 'DD package finalised and issued.'],
    ['meeting',    'Facade Consultant Workshop',             30, 'Facade engineering review and glazing performance assessment.'],
    ['submission', 'Development Application — Lodgement',   50, 'DA lodged with council.'],
    ['milestone',  'DA Approval — Expected',               140, 'Anticipated council determination.'],
    ['meeting',    'Consultant Coordination — CC Stage',   160, 'Coordinate structural, mechanical, electrical, hydraulic, fire.'],
    ['milestone',  'CC Documentation — Issue',             180, 'Full CC package issued for approval.'],
    ['submission', 'Construction Certificate — Lodgement', 200, 'CC lodged.'],
    ['milestone',  'Tender Issue',                         225, 'Tender drawings, specification and BQ issued.'],
    ['milestone',  'Construction Commencement',            280, 'Site establishment.'],
    ['site-visit', 'Structural Frame Inspection',          380, 'Inspect structural frame at level 5.'],
    ['site-visit', 'Facade Inspection — Sample Panel',    420, 'Review installed facade sample panel.'],
    ['milestone',  'Practical Completion',                 550, 'Final inspection and handover.'],
  ],
  education: [
    ['milestone',  'Project Commencement',                 -80, 'Project briefing with school executive and DfE liaison.'],
    ['milestone',  'Concept Design — Complete',            -55, 'Concept design approved by school board.'],
    ['milestone',  'Schematic Design — Complete',          -20, 'Schematic package reviewed.'],
    ['meeting',    'Community Consultation Meeting',       -10, 'Presentation to parents and community.'],
    ['milestone',  'Design Development — Complete',         18, 'DD package finalised.'],
    ['meeting',    'Consultant Coordination Meeting',       25, 'Structural, acoustic, hydraulic, fire consultants.'],
    ['submission', 'Development Application — Lodgement',  42, 'DA lodged with council.'],
    ['milestone',  'DA Approval — Expected',              110, 'Council determination.'],
    ['meeting',    'Post-DA Coordination Meeting',         120,'Review conditions of consent.'],
    ['milestone',  'CC Documentation — Issue',            145, 'CC drawings and specs issued.'],
    ['submission', 'Construction Certificate — Lodgement',165, 'CC lodged with private certifier.'],
    ['milestone',  'Tender Issue',                         185, 'Tender package issued to select panel.'],
    ['milestone',  'Construction Commencement',            230, 'Site establishment. School holidays schedule noted.'],
    ['site-visit', 'Structural Frame Inspection',          300, 'Inspect structural frame and slab.'],
    ['milestone',  'Practical Completion',                 420, 'Final inspection and handover before school term.'],
  ],
  mixed_use: [
    ['milestone',  'Project Commencement',                -110, 'Inception meeting. Project brief finalised.'],
    ['milestone',  'Concept Design — Complete',            -75, 'Concept approved by developer.'],
    ['milestone',  'Schematic Design — Complete',          -40, 'Schematic reviewed by planning consultant.'],
    ['meeting',    'Planning Pre-Lodgement Meeting',       -25, 'Council pre-DA meeting.'],
    ['milestone',  'Design Development — Complete',         16, 'DD package issued.'],
    ['meeting',    'Retail Tenant Coordination Meeting',    28, 'Review tenancy layouts with leasing agent.'],
    ['submission', 'Development Application — Lodgement',  48, 'DA lodged with council.'],
    ['meeting',    'Community Consultation Event',          65, 'Public exhibition period.'],
    ['milestone',  'DA Approval — Expected',              155, 'Anticipated determination.'],
    ['meeting',    'Post-DA Review Meeting',               163, 'Review conditions of consent and scope.'],
    ['milestone',  'CC Documentation — Issue',             190, 'CC drawings issued.'],
    ['meeting',    'Consultant Coordination — CC Stage',   198, 'All consultants review CC package.'],
    ['submission', 'Construction Certificate — Lodgement', 225, 'CC lodged.'],
    ['milestone',  'Tender Issue',                         255, 'Construction documents issued for tender.'],
    ['milestone',  'Construction Commencement',            315, 'Site establishment and excavation.'],
    ['site-visit', 'Podium Slab Inspection',              400, 'Inspect podium slab and retail framing.'],
    ['site-visit', 'Level 3 Frame Inspection',            460, 'Residential tower frame inspection.'],
    ['milestone',  'Practical Completion',                 750, 'Final inspection and strata handover.'],
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Project type metadata
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_META: Record<ProjectType, {
  names: string[];
  addresses: string[];
  buildingClasses: BuildingClass[][];
  nccVolumes: NCCVolume[];
  colors: string[];
}> = {
  residential_house: {
    names: ['Harrington Residence','Nguyen House','Fitzgerald Dwelling','McKay Family Home','Okafor Residence','Chen House','Wallaby Creek Dwelling'],
    addresses: ['14 Banksia Crescent, Manly NSW 2095','7 Ironbark Close, Kenmore QLD 4069','32 Wattle Drive, Brighton VIC 3186','19 Acacia Way, Nedlands WA 6009','55 Grevillea Street, Norwood SA 5067'],
    buildingClasses: [['Class 1a'], ['Class 1a', 'Class 10a']],
    nccVolumes: ['Volume 2'],
    colors: ['honeydew', 'lightcyan'],
  },
  multi_residential: {
    names: ['Riverside Apartments','Parkview Residences','Central Quarter Apartments','Harbour Views','Garden Terrace Apartments','Elm Street Residences'],
    addresses: ['22 Riverside Drive, Pyrmont NSW 2009','105 Park Street, South Yarra VIC 3141','8 Quay Street, Southbank QLD 4101','14 Harbour Road, Fremantle WA 6160'],
    buildingClasses: [['Class 2'], ['Class 2', 'Class 4']],
    nccVolumes: ['Volume 1'],
    colors: ['frosted', 'wisteria'],
  },
  commercial_office: {
    names: ['Parramatta Commercial Centre','Meridian Office Park','Pacific Business Hub','Tech Quarter Office','Central Business Plaza'],
    addresses: ['200 George Street, Parramatta NSW 2150','88 Business Park Drive, Macquarie Park NSW 2113','1 Collins Street, Melbourne VIC 3000','240 Queen Street, Brisbane QLD 4000'],
    buildingClasses: [['Class 5'], ['Class 5', 'Class 6']],
    nccVolumes: ['Volume 1'],
    colors: ['slateblue', 'wisteria'],
  },
  education: {
    names: ['Wattle Primary School Extension','Banksia Secondary College Upgrade','Eucalyptus Early Learning Centre','TAFE Campus Building C','Jacaranda Community School'],
    addresses: ['45 School Road, Baulkham Hills NSW 2153','110 Education Drive, Doncaster VIC 3108','22 Learning Lane, Carindale QLD 4152','5 Campus Way, Joondalup WA 6027'],
    buildingClasses: [['Class 9b'], ['Class 9b', 'Class 10a']],
    nccVolumes: ['Volume 1'],
    colors: ['lightcyan', 'frosted'],
  },
  mixed_use: {
    names: ['Fitzroy Mixed Use Development','Central Station Precinct','Newtown Quarter','Eastside Village','Waterfront Mixed Use'],
    addresses: ['120 Brunswick Street, Fitzroy VIC 3065','55 Station Street, Newtown NSW 2042','33 Eastside Boulevard, Fortitude Valley QLD 4006'],
    buildingClasses: [['Class 2', 'Class 6'], ['Class 2', 'Class 5', 'Class 6']],
    nccVolumes: ['Volume 1'],
    colors: ['wisteria', 'slateblue'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Assessment notes pools
// ─────────────────────────────────────────────────────────────────────────────
const NOTES_DOCUMENTED = [
  'Addressed via DTS provisions. Referenced drawings confirm compliance.',
  'Compliance demonstrated through supporting documentation.',
  'Performance requirement met — refer to referenced drawings and engineer\'s report.',
  'Deemed-to-Satisfy pathway adopted. Evidence sighted and confirmed.',
  'Compliant per relevant Australian Standard. Refer supporting documentation.',
];
const NOTES_PARTIAL = [
  'Partially addressed. Consultant report to confirm remaining items at CC stage.',
  'Evidence partially compiled. Additional drawings required before issue.',
  'Compliance pathway confirmed but final documentation pending.',
  'DTS solution adopted — specification reference to be added before CC lodgement.',
  'Partially addressed. Acoustic / energy report to be finalised.',
];
const NOTES_MISSING = [
  'Documentation to be prepared at next design stage.',
  'Compliance pathway to be confirmed with specialist consultant.',
  'Performance requirement identified. Assessment deferred to CC documentation stage.',
  'Not yet addressed — schedule for resolution prior to CC lodgement.',
  'Compliance method to be confirmed. Performance solution may be required.',
];

// ─────────────────────────────────────────────────────────────────────────────
// Status distribution helper
// ─────────────────────────────────────────────────────────────────────────────
function assessmentPick(): { status: DocStatus; verified: boolean; notes: string } {
  const r = Math.random();
  if (r < 0.40) return { status: 'documented',     verified: true,  notes: pick(NOTES_DOCUMENTED) };
  if (r < 0.70) return { status: 'partial',        verified: false, notes: pick(NOTES_PARTIAL) };
  return              { status: 'not_documented',  verified: false, notes: pick(NOTES_MISSING) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing status helper (earlier in list = further along in production)
// ─────────────────────────────────────────────────────────────────────────────
function drawingStatus(i: number, total: number): DrawingStatus {
  const pct = i / total;
  if (pct < 0.15) return 'issued_for_da';
  if (pct < 0.30) return 'issued_for_review';
  if (pct < 0.60) return 'in_progress';
  return 'not_started';
}

function revisionFor(status: DrawingStatus): string {
  if (status === 'issued_for_da')     return pick(['P1', 'A']);
  if (status === 'issued_for_review') return pick(['A', 'B']);
  return 'A';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────────────────────
export function generateSampleProject(forceType?: ProjectType): GeneratedSample {
  const ALL_TYPES = Object.keys(TYPE_META) as ProjectType[];
  const projectType: ProjectType = forceType ?? pick(ALL_TYPES);
  const meta = TYPE_META[projectType];

  const projectId = uid();
  const today = new Date();

  // Project
  const project: Project = {
    id: projectId,
    name: pick(meta.names),
    address: pick(meta.addresses),
    buildingClasses: pick(meta.buildingClasses),
    nccVolumes: meta.nccVolumes,
    daNumber: `DA ${today.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    certifier: pick(['ABC Certifiers Pty Ltd', 'Statewide Building Certification', 'Premier Certifiers', 'PCA Building Approvals']),
    dueDate: fromNow(pick([150, 180, 200, 240])),
    color: pick(meta.colors),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  // Drawings
  const drawingTemplates: DT[] = {
    residential_house: RESIDENTIAL_DRAWINGS,
    multi_residential: MULTI_RES_DRAWINGS,
    commercial_office: COMMERCIAL_DRAWINGS,
    education:         EDUCATION_DRAWINGS,
    mixed_use:         MIXED_USE_DRAWINGS,
  }[projectType];

  const drawings: Drawing[] = drawingTemplates.map((dt, i) => {
    const status = drawingStatus(i, drawingTemplates.length);
    return {
      id: uid(),
      projectId,
      drawingNumber: dt[0],
      title: dt[1],
      discipline: dt[2],
      milestones: dt[3],
      nccClauses: dt[4],
      revision: revisionFor(status),
      status,
      dueDate: status === 'not_started' ? fromNow(pick([30, 45, 60])) : fromNow(pick([-30, -14, 0, 14])),
      notes: '',
      tags: [],
      updatedAt: nowIso(),
    };
  });

  // Documents
  const docTemplates = DOCUMENTS[projectType];
  const documents: ProjectDocument[] = docTemplates.map(([type, number, title]) => ({
    id: uid(),
    projectId,
    type,
    number,
    title,
    source: 'manual' as const,
  }));

  // NCC Assessments — link to document IDs where documented/partial
  const clauseIds = NCC_CLAUSES[projectType];
  const docIds = documents.map((d) => d.id);

  const assessments: ClauseAssessment[] = clauseIds.map((clauseId) => {
    const { status, verified, notes } = assessmentPick();
    const supporting =
      status === 'documented' ? pickN(docIds, pick([1, 2, 3])) :
      status === 'partial'    ? pickN(docIds, pick([1, 2])) :
      [];
    return { projectId, clauseId, status, verified, notes, docIds: supporting };
  });

  // Calendar events
  const eventTemplates = EVENTS[projectType];
  const events: CalendarEvent[] = eventTemplates.map((et) => ({
    id: uid(),
    projectId,
    category: et[0],
    title: et[1],
    date: fromNow(et[2]),
    notes: et[3],
  }));

  return {
    projectType,
    typeLabel: PROJECT_TYPE_LABELS[projectType],
    project,
    drawings,
    documents,
    assessments,
    events,
  };
}
