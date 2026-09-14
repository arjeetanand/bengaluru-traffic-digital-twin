import {
  MARATHAHALLI_SNAPSHOT_URL,
  MarathahalliDemoSnapshot
} from '../data/marathahalliDemo';

let cachedSnapshot: MarathahalliDemoSnapshot | null = null;
let snapshotRequest: Promise<MarathahalliDemoSnapshot> | null = null;

/**
 * Share the immutable local OSM snapshot between the drawable source layer and
 * source-road traffic. This keeps a single fetch and a single parsed payload
 * when both experiences mount together.
 */
export function loadMarathahalliSnapshot(): Promise<MarathahalliDemoSnapshot> {
  if (cachedSnapshot) return Promise.resolve(cachedSnapshot);
  if (snapshotRequest) return snapshotRequest;

  snapshotRequest = fetch(MARATHAHALLI_SNAPSHOT_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Marathahalli OSM snapshot request failed (${response.status})`);
      return response.json() as Promise<MarathahalliDemoSnapshot>;
    })
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      return snapshot;
    })
    .catch((error: unknown) => {
      snapshotRequest = null;
      throw error;
    });

  return snapshotRequest;
}
