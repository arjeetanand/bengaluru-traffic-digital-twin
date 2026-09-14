import { TrafficFlowData } from '../types';

export function getBakedDemoTrafficData(timeOffsetMinutes: number = 0): TrafficFlowData {
  // Realistic Bengaluru Marathahalli traffic profile
  // Free-flow speed on Outer Ring Road is typically ~45-50 km/h;
  // Peak rush hours slow to 14-22 km/h; off-peak runs at 28-36 km/h.
  const date = new Date(Date.now() + timeOffsetMinutes * 60000);
  const hour = date.getHours() + date.getMinutes() / 60;

  // Wave simulation: morning peak (8:30 - 11:30 AM), evening peak (5:30 - 9:00 PM)
  let congestionSeverity = 0.45; // default moderate
  if (hour >= 8.5 && hour <= 11.5) {
    congestionSeverity = 0.78; // Morning peak
  } else if (hour >= 17.5 && hour <= 21.0) {
    congestionSeverity = 0.85; // Evening peak
  } else if (hour >= 12.0 && hour <= 16.5) {
    congestionSeverity = 0.50; // Afternoon
  } else if (hour >= 22.0 || hour <= 6.0) {
    congestionSeverity = 0.18; // Late night / early morning
  }

  const freeFlowSpeed = 48; // km/h
  // Add subtle sinusoidal variance
  const variance = Math.sin(Date.now() / 15000) * 3;
  const currentSpeed = Math.max(12, Math.round(freeFlowSpeed * (1 - congestionSeverity * 0.72) + variance));

  const baseTravelTime = 340; // seconds for segment
  const currentTravelTime = Math.round(baseTravelTime * (freeFlowSpeed / currentSpeed));
  const congestionRatio = currentSpeed / freeFlowSpeed;
  const networkHealth = Math.min(100, Math.max(15, Math.round(congestionRatio * 100)));

  return {
    currentSpeed,
    freeFlowSpeed,
    currentTravelTime,
    freeFlowTravelTime: baseTravelTime,
    confidence: 0.94,
    roadClosure: false,
    frc: 'FRC2',
    timestamp: Date.now(),
    isDemo: true,
    congestionRatio,
    networkHealth
  };
}
