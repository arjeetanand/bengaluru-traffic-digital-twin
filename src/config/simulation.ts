export const SIMULATION_CONFIG = {
  // Target vehicle count (1,000 - 2,000)
  defaultVehicleCount: 1400,
  minVehicleCount: 600,
  maxVehicleCount: 2200,

  // Bengaluru vehicle fleet distribution (authentic local traffic mix)
  vehicleDistribution: {
    twoWheeler: 0.38,  // 38% bikes & scooters
    car: 0.40,         // 40% hatchbacks, sedans, SUVs
    auto: 0.16,        // 16% auto-rickshaws
    bus: 0.06          // 6% BMTC transit buses
  },

  // Base speeds (in simulation units per second)
  baseSpeeds: {
    twoWheeler: 14.5,
    car: 13.0,
    auto: 10.5,
    bus: 9.0
  },

  // Traffic signal phase durations (seconds)
  signalDurations: {
    nsGreen: 38,
    nsAmber: 4,
    ewGreen: 32,
    ewAmber: 4
  },

  // TomTom API limits & safety cap
  tomtom: {
    fetchIntervalMs: 180000,       // 180s (3 minutes) as requested
    dailyQuotaLimit: 2500,         // Free tier daily limit
    safetyCapPercent: 30,          // STOP live fetches when 30% is reached
    safetyCapCount: 750            // 30% of 2500 = 750 calls
  },

  // Emission & Fuel modeling factors (for stationary/idling vehicles in queue)
  // Modeled estimates based on urban Indian traffic fleet averages
  emissions: {
    fuelConsumptionIdleLitersPerHr: 1.15, // L/hr per queued vehicle
    co2KgPerLiterFuel: 2.39              // kg CO2 per liter burned
  }
};
