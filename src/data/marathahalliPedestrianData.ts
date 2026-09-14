/**
 * Compact pedestrian navigation data copied from the compiled OSM snapshot.
 *
 * This is intentionally limited to routes and supports that affect person
 * mode. It is not a second map database: every entry keeps its source way or
 * node reference so a later snapshot refresh can be audited and replaced.
 */

export interface SourceWalkRoute {
  sourceWayIds: readonly string[];
  points: readonly [number, number][];
  width: number;
  elevation: number;
  connectedToGrade: boolean;
}

export const SOURCE_GROUND_WALK_ROUTES: readonly SourceWalkRoute[] = [
  {
    sourceWayIds: ['way/1072948599'],
    points: [
      [-333.3, -5.5], [-260.4, 9.7], [-232.4, 14.8], [-184.4, 15],
      [-152.8, 11.5], [-120.7, 9.7], [-110.5, 8.9], [-91, 7.1],
      [-52.2, 2.5], [-43.2, 1.2], [-32.9, -0.1], [-31.9, -2],
      [-30.6, -5.4], [-29.8, -11.3], [-32.3, -25.9], [-41.4, -56],
      [-46.3, -72.3], [-48.2, -78.5], [-59.9, -113], [-68.3, -139.9],
      [-69.6, -144.8], [-77.6, -177.3], [-81.3, -191.2], [-86.5, -211.1],
      [-95.8, -247.4], [-106.7, -288.8], [-115.3, -321.7], [-123.9, -359.3],
      [-134.3, -402.2], [-135.4, -408.4], [-136.1, -410.6], [-149.1, -464.7],
      [-157.7, -499], [-158, -501.8], [-167.3, -541.4], [-169, -547.9],
      [-171.4, -556.5], [-178.8, -582.9], [-180.9, -598.8], [-181.8, -605.2],
      [-183.3, -615.1], [-183.5, -632.3], [-185.7, -650.5], [-186.6, -658.1],
      [-194.9, -713.2], [-195.7, -719], [-203.8, -758.5], [-213.3, -805.3],
      [-219.5, -844.6], [-225.7, -873.4], [-232, -906.8], [-241.5, -943.3],
      [-253.5, -983.1], [-255.3, -988.8]
    ],
    width: 2.0,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1075360679'],
    points: [
      [-101, -478.2], [-84.5, -396.3], [-84, -393.8], [-69.2, -329.1],
      [-37.3, -205.6], [-24.3, -148.2], [-3.7, -87.1], [5.7, -63.7],
      [15.6, -26.5], [19.3, -17.2], [25.9, -8]
    ],
    width: 2.0,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1092536516'],
    points: [[-457.4, -1582.1], [-485, -1630.6], [-529.2, -1704.2], [-532.2, -1708.9], [-559.4, -1752]],
    width: 2.2,
    elevation: 0,
    connectedToGrade: true
  },
  {
    // Source footway linking the Kodibeesanahalli/Marathahalli approach to
    // the Oracle access footway. The user-facing preset calls this area
    // Kadubeesanahalli; the source itself does not name this way.
    sourceWayIds: ['way/1092536518'],
    points: [[-361.4, -1347.2], [-389.2, -1429.6], [-408.2, -1480.9], [-424.9, -1521.2], [-448.2, -1567.1], [-456.2, -1580.1]],
    width: 2.0,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1290202950'],
    points: [[38.2, 322.8], [47.2, 377.5], [55.3, 442.8], [55.5, 445]],
    width: 1.8,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1311089011'],
    points: [[857.7, -20.8], [857.2, -18.2], [835.9, 78.8], [832.9, 97], [882.7, 115.3]],
    width: 1.8,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1225572737'],
    points: [[226.6, 5.1], [338.7, -1.3]],
    width: 2.6,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/1225572744'],
    points: [[337.2, -23.1], [246.7, -19.4]],
    width: 2.6,
    elevation: 0,
    connectedToGrade: true
  }
] as const;

export const SOURCE_ELEVATED_WALK_ROUTES: readonly SourceWalkRoute[] = [
  {
    sourceWayIds: ['way/1225572736'],
    points: [[338.7, -1.3], [414.9, -6.8]],
    width: 2.6,
    elevation: 8.54,
    connectedToGrade: false
  },
  {
    sourceWayIds: ['way/1225572743'],
    points: [[413.3, -29.1], [337.2, -23.1]],
    width: 2.6,
    elevation: 8.54,
    connectedToGrade: false
  }
] as const;

// Source bridge:support=pier nodes that sit near the current Namma Metro
// Phase 2A mainline ways. OSM identifies these as ORR / Marathahalli /
// Kodibeesanahalli road structures rather than explicitly tagging them as
// metro supports. Person mode treats their mapped concrete footprints as
// solid obstacles; the metro renderer uses its own modelled pier stations.
export const SOURCE_BRIDGE_PIER_POINTS: readonly [number, number][] = [
  [-190.1, -834.6], [-195.4, -862.1], [-200.7, -889.5], [-206.4, -916.4],
  [-5.4, -21.4], [-11.8, -44.5], [-20.3, -74.1], [-36.3, -123.1],
  [-43.9, -147.6], [-50.6, -174.5], [-30.1, -103.5], [-57.4, -202],
  [-64.2, -229.6], [-71.4, -256.7], [-78.2, -286.2], [-84.7, -314],
  [-91.1, -342.1], [-572.4, -1807.4], [-586.8, -1833.1], [-600.5, -1856.8],
  [-613.3, -1879.3], [-630.1, -1903.3], [-658.9, -1946.5], [-676.7, -1968.2],
  [-691.1, -1984.2], [-706.5, -2000.5], [-207.6, -855.7], [-212.8, -883.4],
  [-219, -910.9], [-225.4, -937.7], [-232.8, -965], [-240.8, -992.1],
  [-249.4, -1017.3], [-257.4, -1040.7], [40.3, 472.5], [36.4, 445.1],
  [32.5, 417], [28.1, 389.5], [24.1, 363.2], [20.9, 338.7],
  [14.2, 286.8], [12.3, 265.8], [11.4, 243.1], [11.1, 202.6],
  [12.1, 191.3], [11.9, 173], [12.1, 152.7], [11.2, 134.6],
  [11, 114.4], [9.9, 95.8], [6.9, 74.1], [6, 58.3],
  [4.7, 39.5], [-74.6, -271.7], [-98.3, -368.9], [-105, -395.6],
  [-112.1, -422.1], [-118.6, -449.1], [-124.9, -477.2], [-129.3, -504.1],
  [-136.8, -531.7], [-142.1, -559.1], [-146.9, -586.4], [-152.1, -614.5],
  [-156.6, -641.1], [-162.3, -669.1], [-166.4, -696.9], [-171, -724.6],
  [-176.1, -752.5], [-180.6, -779.8], [-185.8, -807], [-213.3, -944.4],
  [-220.4, -971.7], [-228.5, -999.3], [-236.4, -1022.3], [-244.3, -1045.6],
  [-252.3, -1068.8], [-265.2, -1064.2], [-260.7, -1093.3], [-273.8, -1089.5],
  [-268.7, -1117.7], [-281.6, -1114.1], [-276.4, -1141.1], [-291.4, -1136.1],
  [-285.3, -1165.9], [-288.9, -1177.9], [-304.2, -1221.5], [-306.1, -1227.6],
  [-313.5, -1249.1], [-319, -1267], [-325.6, -1284.1], [-330.8, -1303.3],
  [-337.9, -1321.2], [-343.6, -1339.6], [-350.3, -1357.4], [-355.1, -1373.4],
  [-364.3, -1399], [-372.6, -1425.9], [-382.5, -1452.3], [-391.6, -1478.7],
  [-401.6, -1504.5], [-408.7, -1521.1], [-417.2, -1539], [-425.6, -1555.1],
  [-439.1, -1579.2], [-453.8, -1604.5], [-466.9, -1626.2], [-479.2, -1647.5],
  [-487.2, -1661.5], [-501.4, -1685.1], [-515.4, -1708.7], [-528.9, -1733.1],
  [-542.8, -1756.6], [-557.7, -1783.1], [-726, -2020.5], [-746.4, -2040.6],
  [-767.6, -2059], [-786.2, -2078.6]
] as const;
