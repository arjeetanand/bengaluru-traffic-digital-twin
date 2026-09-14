import { FootpathWalkabilityMetrics } from '../types';

export interface FootpathAuditSummary extends FootpathWalkabilityMetrics {
  segmentCount: number;
}

// Derived from the ten source-mapped audit groups rendered by Footpaths.tsx.
// These condition labels remain field-verification scenarios; the geometry is
// kept separate from OSM's authoritative road/footway surface layer.
export const FOOTPATH_AUDIT_SUMMARY: FootpathAuditSummary = {
  totalMeters: 1548,
  pavedWalkablePct: 47,
  missingUnpavedPct: 15,
  blockedEncroachedPct: 38,
  segmentCount: 10
};
