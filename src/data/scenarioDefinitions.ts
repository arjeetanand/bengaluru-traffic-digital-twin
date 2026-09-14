import { ScenarioDefinition } from '../types';

const at = (hours: number, minutes: number) => hours * 60 * 60 + minutes * 60;

const DEFAULT_PROVENANCE = {
  network: 'DERIVED',
  demand: 'DERIVED',
  driverBehavior: 'ASSUMED'
} as const;

export const SCENARIO_DEFINITIONS: readonly ScenarioDefinition[] = [
  {
    id: 'marathahalli_lane_closure_01',
    title: 'Close one lane',
    type: 'lane_closure',
    description: 'Close the rightmost lane on the ORR eastbound approach during the morning peak.',
    targetEdgeId: 'orr_eastbound',
    targetLabel: 'ORR · eastbound approach',
    affectedLane: 'Rightmost lane (L3)',
    window: { startSeconds: at(8, 30), endSeconds: at(9, 0) },
    parameters: { lanesClosed: 1, capacityReduction: 0.33 },
    spillover: [
      { edgeId: 'bellandur_approach', label: 'Bellandur approach', relativeImpact: 'medium', queueMeters: 410 },
      { edgeId: 'doddanekundi_approach', label: 'Doddanekundi approach', relativeImpact: 'low', queueMeters: 230 }
    ],
    provenance: DEFAULT_PROVENANCE
  },
  {
    id: 'marathahalli_road_closure_01',
    title: 'Close approach road',
    type: 'road_closure',
    description: 'Close the eastbound approach and force traffic onto parallel service roads.',
    targetEdgeId: 'orr_eastbound',
    targetLabel: 'ORR · eastbound approach',
    affectedLane: 'All approach lanes',
    window: { startSeconds: at(8, 30), endSeconds: at(9, 15) },
    parameters: { closed: true, diversionRequired: true },
    spillover: [
      { edgeId: 'bellandur_approach', label: 'Bellandur approach', relativeImpact: 'high', queueMeters: 920 },
      { edgeId: 'doddanekundi_approach', label: 'Doddanekundi approach', relativeImpact: 'medium', queueMeters: 580 }
    ],
    provenance: DEFAULT_PROVENANCE
  },
  {
    id: 'marathahalli_flooding_01',
    title: 'Flood one segment',
    type: 'flooding',
    description: 'Reduce capacity on the underpass after a flooding incident.',
    targetEdgeId: 'marathahalli_underpass',
    targetLabel: 'Marathahalli underpass',
    affectedLane: 'Two lanes unavailable',
    window: { startSeconds: at(8, 45), endSeconds: at(9, 30) },
    parameters: { capacityReduction: 0.55, roadSurface: 'flooded' },
    spillover: [
      { edgeId: 'bellandur_approach', label: 'Bellandur approach', relativeImpact: 'high', queueMeters: 760 },
      { edgeId: 'doddanekundi_approach', label: 'Doddanekundi approach', relativeImpact: 'medium', queueMeters: 640 }
    ],
    provenance: DEFAULT_PROVENANCE
  },
  {
    id: 'marathahalli_signal_plan_01',
    title: 'Change signal timing',
    type: 'signal_timing_change',
    description: 'Give the east-west movement an additional ten seconds of green time.',
    targetEdgeId: 'marathahalli_signal',
    targetLabel: 'Marathahalli signal junction',
    affectedLane: 'E-W phase · +10s green',
    window: { startSeconds: at(8, 30), endSeconds: at(9, 0) },
    parameters: { ewGreenDeltaSeconds: 10, nsGreenDeltaSeconds: -10 },
    spillover: [
      { edgeId: 'orr_eastbound', label: 'ORR eastbound', relativeImpact: 'low', queueMeters: 190 },
      { edgeId: 'bellandur_approach', label: 'Bellandur approach', relativeImpact: 'low', queueMeters: 150 }
    ],
    provenance: DEFAULT_PROVENANCE
  },
  {
    id: 'marathahalli_demand_surge_01',
    title: 'Increase tech-park demand',
    type: 'demand_increase',
    description: 'Increase inbound office-hour demand from the technology-park cluster.',
    targetEdgeId: 'tech_park_access',
    targetLabel: 'Technology park access roads',
    affectedLane: '+20% inbound demand',
    window: { startSeconds: at(8, 15), endSeconds: at(9, 15) },
    parameters: { demandMultiplier: 1.2, attractor: 'technology_parks' },
    spillover: [
      { edgeId: 'orr_eastbound', label: 'ORR eastbound', relativeImpact: 'high', queueMeters: 690 },
      { edgeId: 'doddanekundi_approach', label: 'Doddanekundi approach', relativeImpact: 'medium', queueMeters: 360 }
    ],
    provenance: DEFAULT_PROVENANCE
  },
  {
    id: 'marathahalli_bus_priority_01',
    title: 'Prioritize buses',
    type: 'bus_priority',
    description: 'Prioritize BMTC movements through the signal while holding general traffic capacity constant.',
    targetEdgeId: 'marathahalli_signal',
    targetLabel: 'Marathahalli signal junction',
    affectedLane: 'BMTC priority window',
    window: { startSeconds: at(8, 30), endSeconds: at(9, 0) },
    parameters: { busPriority: true, prioritySeconds: 6 },
    spillover: [
      { edgeId: 'orr_eastbound', label: 'ORR eastbound', relativeImpact: 'low', queueMeters: 130 },
      { edgeId: 'bellandur_approach', label: 'Bellandur approach', relativeImpact: 'low', queueMeters: 110 }
    ],
    provenance: DEFAULT_PROVENANCE
  }
] as const;

export const DEFAULT_SCENARIO_ID = SCENARIO_DEFINITIONS[0].id;

export function getScenarioDefinition(id: string) {
  return SCENARIO_DEFINITIONS.find((scenario) => scenario.id === id) || SCENARIO_DEFINITIONS[0];
}
