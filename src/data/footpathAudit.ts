import { FootpathWalkabilityMetrics } from '../types';

export interface FootpathAuditSummary extends FootpathWalkabilityMetrics {
  segmentCount: number;
}

// Derived from the 26 authored corridor segments in Footpaths.tsx. These are
// modelled condition estimates, separate from OSM's mapped footway geometry.
export const FOOTPATH_AUDIT_SUMMARY: FootpathAuditSummary = {
  totalMeters: 1554,
  pavedWalkablePct: 58,
  missingUnpavedPct: 14,
  blockedEncroachedPct: 28,
  segmentCount: 26
};

