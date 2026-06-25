import type { BuildingClass, NCCClause } from '../types';

// Shorthand class groups for readability
const V1_ALL: BuildingClass[] = [
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7a',
  'Class 7b',
  'Class 8',
  'Class 9a',
  'Class 9b',
  'Class 9c',
];
const V1_RES: BuildingClass[] = ['Class 2', 'Class 3', 'Class 4'];
const V1_PUBLIC: BuildingClass[] = ['Class 3', 'Class 5', 'Class 6', 'Class 9a', 'Class 9b', 'Class 9c'];
const V2_HOUSE: BuildingClass[] = ['Class 1a', 'Class 1b'];
const V2_ALL: BuildingClass[] = ['Class 1a', 'Class 1b', 'Class 10a', 'Class 10b', 'Class 10c'];

/**
 * Curated subset of the NCC 2022 clause set, indexed for the clause picker.
 * This is a representative working library — not the complete code. Clause IDs,
 * parts and titles follow NCC 2022 nomenclature.
 */
export const NCC_CLAUSES: NCCClause[] = [
  // ---- Volume 1 · Part A — Governing requirements ----
  { id: 'A2.1', volume: 'Volume 1', part: 'A', partTitle: 'Governing requirements', title: 'Compliance with the Performance Requirements', applicableClasses: V1_ALL },
  { id: 'A2.2', volume: 'Volume 1', part: 'A', partTitle: 'Governing requirements', title: 'Evidence of suitability — acceptable forms of evidence', applicableClasses: V1_ALL },
  { id: 'A5.1', volume: 'Volume 1', part: 'A', partTitle: 'Governing requirements', title: 'Classification of a building or part of a building by use', applicableClasses: V1_ALL },
  { id: 'A5.4', volume: 'Volume 1', part: 'A', partTitle: 'Governing requirements', title: 'Parts of buildings with different classifications', applicableClasses: V1_ALL },

  // ---- Volume 1 · Part B — Structure ----
  { id: 'B1.1', volume: 'Volume 1', part: 'B', partTitle: 'Structure', title: 'Structural provisions — resistance to actions', applicableClasses: V1_ALL },
  { id: 'B1.2', volume: 'Volume 1', part: 'B', partTitle: 'Structure', title: 'Determination of individual actions', applicableClasses: V1_ALL },
  { id: 'B1.4', volume: 'Volume 1', part: 'B', partTitle: 'Structure', title: 'Determination of structural resistance of materials and forms of construction', applicableClasses: V1_ALL },

  // ---- Volume 1 · Part C — Fire resistance ----
  { id: 'C1.1', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'Type of construction required', applicableClasses: V1_ALL },
  { id: 'C1.2', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'Calculation of rise in storeys', applicableClasses: V1_ALL },
  { id: 'C1.10', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'Fire hazard properties — linings, materials and assemblies', applicableClasses: V1_ALL },
  { id: 'C2.2', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'General floor area and volume limitations', applicableClasses: V1_ALL },
  { id: 'C3.2', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'Protection of openings in external walls', applicableClasses: V1_ALL },
  { id: 'C3.11', volume: 'Volume 1', part: 'C', partTitle: 'Fire resistance', title: 'Bounding construction — Class 2/3 and 4 parts', applicableClasses: V1_RES },

  // ---- Volume 1 · Part D — Access and egress ----
  { id: 'D1.2', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Number of exits required', applicableClasses: V1_ALL },
  { id: 'D1.4', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Exit travel distances', applicableClasses: V1_ALL },
  { id: 'D1.6', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Dimensions of exits and paths of travel to exits', applicableClasses: V1_ALL },
  { id: 'D2.13', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Treads and risers — stair construction', applicableClasses: V1_ALL },
  { id: 'D2.16', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Balustrades and other barriers', applicableClasses: V1_ALL },
  { id: 'D3.1', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'General building access requirements (DDA)', applicableClasses: V1_PUBLIC },
  { id: 'D3.3', volume: 'Volume 1', part: 'D', partTitle: 'Access and egress', title: 'Parts of buildings to be accessible', applicableClasses: V1_PUBLIC },

  // ---- Volume 1 · Part E — Services and equipment ----
  { id: 'E1.3', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Fire hydrants', applicableClasses: V1_ALL },
  { id: 'E1.4', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Fire hose reels', applicableClasses: V1_ALL },
  { id: 'E1.5', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Sprinklers', applicableClasses: V1_ALL },
  { id: 'E2.2', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Smoke hazard management', applicableClasses: V1_ALL },
  { id: 'E3.2', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Stretcher facility in lifts', applicableClasses: ['Class 9a', 'Class 9c'] },
  { id: 'E4.2', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Emergency lighting requirements', applicableClasses: V1_ALL },
  { id: 'E4.5', volume: 'Volume 1', part: 'E', partTitle: 'Services & equipment', title: 'Exit signs', applicableClasses: V1_ALL },

  // ---- Volume 1 · Part F — Health and amenity ----
  { id: 'F1.1', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Stormwater drainage', applicableClasses: V1_ALL },
  { id: 'F1.5', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Roof coverings — weatherproofing', applicableClasses: V1_ALL },
  { id: 'F1.7', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Waterproofing of wet areas', applicableClasses: V1_ALL },
  { id: 'F2.3', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Sanitary facilities — required number', applicableClasses: V1_ALL },
  { id: 'F4.1', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Provision of natural light', applicableClasses: V1_RES },
  { id: 'F4.5', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Ventilation of rooms', applicableClasses: V1_ALL },
  { id: 'F5.2', volume: 'Volume 1', part: 'F', partTitle: 'Health & amenity', title: 'Sound insulation — walls between sole-occupancy units', applicableClasses: V1_RES },

  // ---- Volume 1 · Part G — Ancillary provisions ----
  { id: 'G1.1', volume: 'Volume 1', part: 'G', partTitle: 'Ancillary provisions', title: 'Swimming pool access and barriers', applicableClasses: ['Class 2', 'Class 3'] },
  { id: 'G3.2', volume: 'Volume 1', part: 'G', partTitle: 'Ancillary provisions', title: 'Heating appliances, fireplaces and chimneys', applicableClasses: V1_ALL },

  // ---- Volume 1 · Part H — Special use buildings ----
  { id: 'H1.1', volume: 'Volume 1', part: 'H', partTitle: 'Special use buildings', title: 'Theatres, stages and public halls — provisions', applicableClasses: ['Class 9b'] },
  { id: 'H1.3', volume: 'Volume 1', part: 'H', partTitle: 'Special use buildings', title: 'Stage machinery, rigging and proscenium walls', applicableClasses: ['Class 9b'] },
  { id: 'H2.1', volume: 'Volume 1', part: 'H', partTitle: 'Special use buildings', title: 'Public transport buildings — access and egress', applicableClasses: ['Class 9b', 'Class 10a'] },
  { id: 'H3.1', volume: 'Volume 1', part: 'H', partTitle: 'Special use buildings', title: 'Farm buildings and farm sheds — concessions', applicableClasses: ['Class 7b', 'Class 8'] },

  // ---- Volume 1 · Part J — Energy efficiency ----
  { id: 'J1.2', volume: 'Volume 1', part: 'J', partTitle: 'Energy efficiency', title: 'Building fabric — thermal performance', applicableClasses: V1_ALL },
  { id: 'J1.3', volume: 'Volume 1', part: 'J', partTitle: 'Energy efficiency', title: 'Roof and ceiling construction', applicableClasses: V1_ALL },
  { id: 'J1.5', volume: 'Volume 1', part: 'J', partTitle: 'Energy efficiency', title: 'Walls and glazing', applicableClasses: V1_ALL },
  { id: 'J3.2', volume: 'Volume 1', part: 'J', partTitle: 'Energy efficiency', title: 'Building sealing', applicableClasses: V1_ALL },
  { id: 'J6.2', volume: 'Volume 1', part: 'J', partTitle: 'Energy efficiency', title: 'Artificial lighting — illumination power density', applicableClasses: V1_ALL },

  // ---- Volume 2 · Class 1 & 10 ----
  // Part A — Governing requirements
  { id: 'A2.1V2', volume: 'Volume 2', part: 'A', partTitle: 'Governing requirements', title: 'Compliance with the Performance Requirements (Volume Two)', applicableClasses: V2_ALL },
  { id: 'A5.1V2', volume: 'Volume 2', part: 'A', partTitle: 'Governing requirements', title: 'Classification of Class 1 and Class 10 buildings', applicableClasses: V2_ALL },
  { id: 'A2.2V2', volume: 'Volume 2', part: 'A', partTitle: 'Governing requirements', title: 'Evidence of suitability for housing construction', applicableClasses: V2_ALL },

  // Part H1 — Structure
  { id: 'H1D4', volume: 'Volume 2', part: 'H1', partTitle: 'Structure', title: 'Structural provisions for Class 1 & 10 buildings', applicableClasses: V2_ALL },
  { id: 'H2D2', volume: 'Volume 2', part: 'H2', partTitle: 'Damp & weatherproofing', title: 'Weatherproofing — external walls and roofs', applicableClasses: V2_HOUSE },
  { id: 'H2D5', volume: 'Volume 2', part: 'H2', partTitle: 'Damp & weatherproofing', title: 'Waterproofing of wet areas in housing', applicableClasses: V2_HOUSE },
  { id: 'H3D3', volume: 'Volume 2', part: 'H3', partTitle: 'Fire safety', title: 'Fire separation of external walls — Class 1', applicableClasses: V2_HOUSE },
  { id: 'H3D5', volume: 'Volume 2', part: 'H3', partTitle: 'Fire safety', title: 'Smoke alarms in dwellings', applicableClasses: V2_HOUSE },
  { id: 'H4D2', volume: 'Volume 2', part: 'H4', partTitle: 'Health & amenity', title: 'Room heights for habitable rooms', applicableClasses: V2_HOUSE },
  { id: 'H4D3', volume: 'Volume 2', part: 'H4', partTitle: 'Health & amenity', title: 'Facilities — sanitary, laundry and kitchen', applicableClasses: V2_HOUSE },
  { id: 'H4D5', volume: 'Volume 2', part: 'H4', partTitle: 'Health & amenity', title: 'Natural light and ventilation in housing', applicableClasses: V2_HOUSE },
  { id: 'H4D7', volume: 'Volume 2', part: 'H4', partTitle: 'Health & amenity', title: 'Sound insulation between Class 1 dwellings', applicableClasses: V2_HOUSE },
  { id: 'H5D2', volume: 'Volume 2', part: 'H5', partTitle: 'Safe movement & access', title: 'Stairway and ramp construction', applicableClasses: V2_HOUSE },
  { id: 'H5D3', volume: 'Volume 2', part: 'H5', partTitle: 'Safe movement & access', title: 'Barriers and handrails', applicableClasses: V2_ALL },
  { id: 'H6D2', volume: 'Volume 2', part: 'H6', partTitle: 'Energy efficiency', title: 'Building fabric — Class 1 energy efficiency (NatHERS)', applicableClasses: V2_HOUSE },
  { id: 'H6D5', volume: 'Volume 2', part: 'H6', partTitle: 'Energy efficiency', title: 'Services — heating, cooling and hot water', applicableClasses: V2_HOUSE },
  { id: 'H7D2', volume: 'Volume 2', part: 'H7', partTitle: 'Ancillary provisions', title: 'Swimming pool barriers (Class 10b)', applicableClasses: ['Class 10b'] },
  { id: 'H7D3', volume: 'Volume 2', part: 'H7', partTitle: 'Ancillary provisions', title: 'Class 10a non-habitable structures', applicableClasses: ['Class 10a'] },
];

/** Map for quick clause lookups by id. */
export const NCC_CLAUSE_MAP: Record<string, NCCClause> = Object.fromEntries(
  NCC_CLAUSES.map((c) => [c.id, c]),
);

/** A selectable NCC section = a Part within a Volume, with its clauses. */
export interface NCCSection {
  key: string; // `${volume}|${part}`
  volume: NCCClause['volume'];
  part: string;
  partTitle: string;
  label: string; // e.g. 'Part C — Fire resistance (Volume 1)'
  clauseIds: string[];
}

export const NCC_SECTIONS: NCCSection[] = (() => {
  const order: string[] = [];
  const map = new Map<string, NCCSection>();
  for (const c of NCC_CLAUSES) {
    const key = `${c.volume}|${c.part}`;
    if (!map.has(key)) {
      order.push(key);
      map.set(key, {
        key,
        volume: c.volume,
        part: c.part,
        partTitle: c.partTitle,
        label: `Part ${c.part} — ${c.partTitle} (${c.volume})`,
        clauseIds: [],
      });
    }
    map.get(key)!.clauseIds.push(c.id);
  }
  return order.map((k) => map.get(k)!);
})();
