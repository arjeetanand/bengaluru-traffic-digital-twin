import { FootpathWalkabilityMetrics } from '../types';

export interface FootpathAuditSummary extends FootpathWalkabilityMetrics {
  segmentCount: number;
}

// Derived from the 25 authored/modelled audit segments in Footpaths.tsx. These
// are condition estimates, separate from OSM's mapped footway geometry; the
// Spice Garden entries now follow source-coordinate traces but still require
// field verification for their condition labels.
export const FOOTPATH_AUDIT_SUMMARY: FootpathAuditSummary = {
  totalMeters: 2228,
  pavedWalkablePct: 58,
  missingUnpavedPct: 14,
  blockedEncroachedPct: 28,
  segmentCount: 25
};
