export function nearestRoadVertexMeters(point: { lat: number; lng: number }, coordinates: unknown): number | undefined {
  if (!Array.isArray(coordinates)) return undefined;
  let nearest = Infinity;
  const longitudeScale = 111195 * Math.cos(point.lat * Math.PI / 180);
  for (const coordinate of coordinates) {
    if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') continue;
    const distance = Math.hypot(
      (coordinate.latitude - point.lat) * 111195,
      (coordinate.longitude - point.lng) * longitudeScale
    );
    nearest = Math.min(nearest, distance);
  }
  return Number.isFinite(nearest) ? nearest : undefined;
}
