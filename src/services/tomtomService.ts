import { TrafficFlowData, ApiUsageStats } from '../types';
import { ACTIVE_COORDINATES } from '../config/location';
import { SIMULATION_CONFIG } from '../config/simulation';
import { getBakedDemoTrafficData } from './demoTrafficData';

const STORAGE_KEY = 'tomtom_api_usage_metrics';

export function getApiUsageStats(): ApiUsageStats {
  const dailyLimit = SIMULATION_CONFIG.tomtom.dailyQuotaLimit;
  const capPercent = SIMULATION_CONFIG.tomtom.safetyCapPercent;
  const capCount = Math.round((dailyLimit * capPercent) / 100);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isCapped = parsed.callCount >= capCount;
      return {
        callCount: parsed.callCount || 0,
        dailyLimit,
        capPercentage: capPercent,
        capCount,
        isCapped,
        lastCallTime: parsed.lastCallTime || null,
        lastError: parsed.lastError || null
      };
    }
  } catch (e) {
    console.warn('Could not read API usage from localStorage', e);
  }

  return {
    callCount: 0,
    dailyLimit,
    capPercentage: capPercent,
    capCount,
    isCapped: false,
    lastCallTime: null,
    lastError: null
  };
}

export function recordApiCall(error: string | null = null): ApiUsageStats {
  const current = getApiUsageStats();
  const updatedCount = current.callCount + 1;
  const isCapped = updatedCount >= current.capCount;

  const newStats: ApiUsageStats = {
    ...current,
    callCount: updatedCount,
    isCapped,
    lastCallTime: Date.now(),
    lastError: error
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      callCount: newStats.callCount,
      lastCallTime: newStats.lastCallTime,
      lastError: newStats.lastError
    }));
  } catch (e) {
    console.warn('Could not write API usage to localStorage', e);
  }

  return newStats;
}

export function resetApiUsage(): ApiUsageStats {
  const fresh: ApiUsageStats = {
    callCount: 0,
    dailyLimit: SIMULATION_CONFIG.tomtom.dailyQuotaLimit,
    capPercentage: SIMULATION_CONFIG.tomtom.safetyCapPercent,
    capCount: Math.round((SIMULATION_CONFIG.tomtom.dailyQuotaLimit * SIMULATION_CONFIG.tomtom.safetyCapPercent) / 100),
    isCapped: false,
    lastCallTime: null,
    lastError: null
  };

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not reset API usage in localStorage', e);
  }

  return fresh;
}

/**
 * Ephemeral fetch: fetches TomTom live data, computes metrics, and returns it.
 * Never stores or leaks live coordinates/keys.
 * Silently falls back to demo mode if key missing, network fails, or 30% safety cap is reached.
 */
export async function fetchTrafficFlow(forceDemo: boolean = false): Promise<{
  data: TrafficFlowData;
  usage: ApiUsageStats;
  notice?: string;
}> {
  const currentUsage = getApiUsageStats();

  // If user explicitly forced Demo mode
  if (forceDemo) {
    return {
      data: getBakedDemoTrafficData(),
      usage: currentUsage,
      notice: 'Demo mode active (simulated realistic traffic)'
    };
  }

  // Safety Stop: Stop when 30% of API usage quota is reached
  if (currentUsage.isCapped) {
    return {
      data: getBakedDemoTrafficData(),
      usage: currentUsage,
      notice: `TomTom Safety Cap reached (${currentUsage.callCount}/${currentUsage.dailyLimit} calls = ${currentUsage.capPercentage}%). Switched to demo mode.`
    };
  }

  const apiKey = import.meta.env.VITE_TOMTOM_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_tomtom_api_key_here') {
    return {
      data: getBakedDemoTrafficData(),
      usage: currentUsage,
      notice: 'Showing demo data — add your TomTom key to .env for live traffic'
    };
  }

  const { lat, lng } = ACTIVE_COORDINATES;
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${encodeURIComponent(
    apiKey.trim()
  )}&point=${lat},${lng}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = `TomTom API responded with HTTP ${res.status}`;
      const newUsage = recordApiCall(errText);
      return {
        data: getBakedDemoTrafficData(),
        usage: newUsage,
        notice: `Showing demo data — TomTom API returned HTTP ${res.status}`
      };
    }

    const json = await res.json();
    const newUsage = recordApiCall(null);

    // Strict null-guards for all expected fields
    const flow = json?.flowSegmentData;
    if (!flow || typeof flow.currentSpeed !== 'number') {
      return {
        data: getBakedDemoTrafficData(),
        usage: newUsage,
        notice: 'Showing demo data — Unexpected API response format'
      };
    }

    const currentSpeed = Math.max(1, flow.currentSpeed);
    const freeFlowSpeed = Math.max(currentSpeed, flow.freeFlowSpeed ?? 48);
    const currentTravelTime = flow.currentTravelTime ?? 300;
    const freeFlowTravelTime = flow.freeFlowTravelTime ?? Math.round((currentTravelTime * currentSpeed) / freeFlowSpeed);
    const confidence = typeof flow.confidence === 'number' ? flow.confidence : 1.0;
    const roadClosure = Boolean(flow.roadClosure);
    const congestionRatio = currentSpeed / freeFlowSpeed;
    const networkHealth = Math.min(100, Math.max(10, Math.round(congestionRatio * 100)));

    return {
      data: {
        currentSpeed,
        freeFlowSpeed,
        currentTravelTime,
        freeFlowTravelTime,
        confidence,
        roadClosure,
        frc: flow.frc || 'FRC2',
        timestamp: Date.now(),
        isDemo: false,
        congestionRatio,
        networkHealth
      },
      usage: newUsage
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    const newUsage = recordApiCall(message);
    return {
      data: getBakedDemoTrafficData(),
      usage: newUsage,
      notice: 'Showing demo data — Network connection fallback'
    };
  }
}
