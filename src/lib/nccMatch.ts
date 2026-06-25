import type { NCCClause, ProjectDocument } from '../types';
import { NCC_CLAUSES } from '../data/nccClauses';

/**
 * A deterministic, offline "evidence assistant". It scores extracted document
 * text against NCC clauses using clause references, clause-title keywords and a
 * domain terminology dictionary. It only ever *suggests* — it never decides
 * compliance. The user confirms everything.
 */

export type Confidence = 'high' | 'medium' | 'low';

export interface Suggestion {
  docId: string;
  score: number; // 0–100
  band: Confidence;
}

/** Technical terminology grouped by NCC part title (lower-case keys). */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  structure: ['structural', 'as 1170', 'as 3600', 'as 4100', 'load', 'footing', 'beam', 'column', 'slab', 'bracing', 'engineer', 'steel', 'concrete', 'wind load'],
  'fire resistance': ['fire', 'frl', 'fire resistance level', 'fire-resistance', 'sprinkler', 'hydrant', 'hose reel', 'smoke', 'compartment', 'fire rating', 'non-combustible', 'fire strategy', 'fire engineering', 'as 1530'],
  'fire safety': ['fire', 'frl', 'fire separation', 'smoke alarm', 'fire strategy', 'non-combustible', 'as 3786', 'compartment'],
  'access and egress': ['accessible', 'as 1428', 'path of travel', 'accessible entrance', 'ramp', 'stair', 'handrail', 'balustrade', 'dda', 'exit', 'egress', 'travel distance', 'wheelchair', 'tgsi', 'tactile', 'luminous contrast', 'continuous accessible path'],
  'safe movement & access': ['stair', 'ramp', 'handrail', 'balustrade', 'barrier', 'as 1428', 'tread', 'riser', 'slip resistance'],
  'services & equipment': ['emergency lighting', 'exit sign', 'as 2293', 'fire hydrant', 'hose reel', 'sprinkler', 'as 2118', 'smoke detection', 'mechanical services', 'lift'],
  'health & amenity': ['waterproofing', 'as 3740', 'wet area', 'ventilation', 'natural light', 'sanitary', 'daylight', 'sound insulation', 'acoustic', 'stormwater', 'roof covering', 'weatherproof'],
  'damp & weatherproofing': ['waterproofing', 'weatherproof', 'damp', 'as 3740', 'wet area', 'flashing', 'membrane', 'moisture'],
  'ancillary provisions': ['swimming pool', 'pool barrier', 'as 1926', 'fireplace', 'chimney', 'heating appliance'],
  'energy efficiency': ['nathers', 'thermal', 'glazing', 'insulation', 'r-value', 'u-value', 'building fabric', 'energy efficiency', 'section j', 'building sealing', 'star rating', 'energy report'],
};

const STOPWORDS = new Set([
  'and', 'the', 'for', 'of', 'to', 'in', 'a', 'an', 'with', 'on', 'or', 'by', 'from',
  'required', 'provisions', 'general', 'individual', 'determination', 'resistance',
  'construction', 'forms', 'materials', 'parts', 'type', 'between',
]);

const SUGGEST_THRESHOLD = 35;

const normaliseId = (id: string) => id.replace(/[^a-z0-9]/gi, '').toLowerCase();

/** Word-ish tokens from a clause title that carry meaning. */
function titleKeywords(title: string): string[] {
  return [
    ...new Set(
      title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
    ),
  ];
}

export function confidenceBand(score: number): Confidence {
  if (score >= 90) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

/** Score one document's extracted text against a single clause (0–100). */
export function scoreClauseAgainstDoc(clause: NCCClause, content: string): number {
  if (!content) return 0;
  const text = content.toLowerCase();
  const compact = normaliseId(text);
  let score = 0;

  // 1 — direct clause reference (strongest signal)
  const idVariants = [clause.id.toLowerCase(), normaliseId(clause.id)];
  if (idVariants.some((v) => text.includes(v)) || compact.includes(normaliseId(clause.id))) {
    score += 60;
  }

  // 2 — clause-title keywords
  let titleHits = 0;
  for (const kw of titleKeywords(clause.title)) {
    if (text.includes(kw)) titleHits++;
  }
  score += Math.min(titleHits * 12, 36);

  // 3 — domain terminology for the clause's part
  const domain = DOMAIN_KEYWORDS[clause.partTitle.toLowerCase()] ?? [];
  let domainHits = 0;
  for (const kw of domain) {
    if (text.includes(kw)) domainHits++;
  }
  score += Math.min(domainHits * 10, 40);

  // 4 — compliance / standards terminology (small boost)
  if (/\bncc\b|\bbca\b|compliance|certif/.test(text)) score += 6;

  // 5 — drawing-style references present
  if (/\b[a-z]{1,3}[-\s]?\d{2,3}\b/.test(text)) score += 6;

  return Math.min(score, 100);
}

/** Suggested supporting documents for a clause, best first, above threshold. */
export function suggestionsForClause(clause: NCCClause, docs: ProjectDocument[]): Suggestion[] {
  return docs
    .map((d) => {
      const score = scoreClauseAgainstDoc(clause, d.content ?? '');
      return { docId: d.id, score, band: confidenceBand(score) };
    })
    .filter((s) => s.score >= SUGGEST_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

/** NCC clause references auto-detected in a document's text (for the register). */
export function detectReferences(content: string): string[] {
  if (!content) return [];
  const found: string[] = [];
  for (const c of NCC_CLAUSES) {
    const direct = content.toLowerCase().includes(c.id.toLowerCase());
    if (direct || scoreClauseAgainstDoc(c, content) >= 60) found.push(c.id);
  }
  return found.slice(0, 16);
}
