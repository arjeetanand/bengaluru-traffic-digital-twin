import { getOrrOffsetPointAtZ } from './RealRoadData';

export type LanePoint = [number, number, number];

export interface UTurnConnector {
  id: string;
  points: LanePoint[];
  stopT: number;
}

const orrLanePoint = (z: number, lateralOffset: number): LanePoint => {
  const [x, projectedZ] = getOrrOffsetPointAtZ(z, lateralOffset);
  return [x, 0.12, projectedZ];
};

// Surface U-turn connectors model the scenario loop around the signal island.
// They are shared by the traffic simulation and the painted road layer so a
// vehicle route cannot drift away from the visible connector. OSM turn
// restrictions are preserved separately in the compiled snapshot and must be
// reconciled with this scenario network before any route is treated as legal.
export const U_TURN_CONNECTORS: { north: UTurnConnector; south: UTurnConnector } = {
  north: {
    id: 'surface-u-turn-north',
    stopT: 0.34,
    points: [
      orrLanePoint(-52, -14.5),
      orrLanePoint(18, -14.5),
      [39.11, 0.12, 38.63],
      [33.47, 0.12, 31.73],
      [30.31, 0.12, 29.04],
      [24.45, 0.12, 25.80],
      [17.50, 0.12, 23.35],
      [13.47, 0.12, 22.30],
      [5.33, 0.12, 21.45],
      [-5.27, 0.12, 21.93],
      [-13.02, 0.12, 23.19],
      [-14.63, 0.12, 24.15],
      [-17.89, 0.12, 28.46],
      [-17.06, 0.12, 38.27],
      orrLanePoint(18, 14.5),
      orrLanePoint(-52, 14.5)
    ]
  },
  south: {
    id: 'surface-u-turn-south',
    stopT: 0.34,
    points: [
      orrLanePoint(52, 14.5),
      orrLanePoint(-14, 14.5),
      [-25.27, 0.12, -10.24],
      [-22.53, 0.12, -5.83],
      [-21.73, 0.12, -4.89],
      [-18.25, 0.12, -2.19],
      [-13.57, 0.12, -0.19],
      [-7.27, 0.12, -0.01],
      [-0.26, 0.12, -0.31],
      [5.66, 0.12, -2.57],
      [10.86, 0.12, -5.80],
      [12.99, 0.12, -7.57],
      [13.56, 0.12, -13.33],
      orrLanePoint(-14, -14.5),
      orrLanePoint(52, -14.5)
    ]
  }
};
