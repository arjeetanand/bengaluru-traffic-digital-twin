import { useState, useEffect } from 'react';
import { SignalPhase, SignalStatus } from '../../../types';
type ExtendedPhase = SignalPhase | 'NS_ALL_RED' | 'EW_ALL_RED';
import { SIMULATION_CONFIG } from '../../../config/simulation';

interface UseTrafficSignalsOptions {
  simSpeedMultiplier: number;
}

export function useTrafficSignals({ simSpeedMultiplier }: UseTrafficSignalsOptions): SignalStatus {
  const [phase, setPhase] = useState<ExtendedPhase>('NS_GREEN');
  const [timer, setTimer] = useState(SIMULATION_CONFIG.signalDurations.nsGreen);

  useEffect(() => {
    const intervalMs = 100;
    const interval = setInterval(() => {
      const deltaSeconds = (intervalMs / 1000) * simSpeedMultiplier;

      setTimer((prev) => {
        const next = prev - deltaSeconds;
        if (next <= 0) {
          // Switch to next phase in state machine
          setPhase((currentPhase) => {
            switch (currentPhase) {
              case 'NS_GREEN':
                return 'NS_AMBER';
              case 'NS_AMBER':
                return 'NS_ALL_RED';   // Insert 2s all-red clearance
              case 'NS_ALL_RED':
                return 'EW_GREEN';
              case 'EW_GREEN':
                return 'EW_AMBER';
              case 'EW_AMBER':
                return 'EW_ALL_RED';   // Insert 2s all-red clearance
              case 'EW_ALL_RED':
                return 'NS_GREEN';
            }
          });

          // Reset timer for next phase
          if (phase === 'NS_GREEN') return SIMULATION_CONFIG.signalDurations.nsAmber;
          if (phase === 'NS_AMBER') return 2; // 2 second all-red
          if (phase === 'NS_ALL_RED') return SIMULATION_CONFIG.signalDurations.ewGreen;
          if (phase === 'EW_GREEN') return SIMULATION_CONFIG.signalDurations.ewAmber;
          if (phase === 'EW_AMBER') return 2; // 2 second all-red
          if (phase === 'EW_ALL_RED') return SIMULATION_CONFIG.signalDurations.nsGreen;
          return SIMULATION_CONFIG.signalDurations.nsGreen;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [simSpeedMultiplier, phase]);

  let nsColor: 'green' | 'amber' | 'red' = 'red';
  let ewColor: 'green' | 'amber' | 'red' = 'red';

  if (phase === 'NS_GREEN') {
    nsColor = 'green';
    ewColor = 'red';
  } else if (phase === 'NS_AMBER') {
    nsColor = 'amber';
    ewColor = 'red';
  } else if (phase === 'EW_GREEN') {
    nsColor = 'red';
    ewColor = 'green';
  } else if (phase === 'EW_AMBER') {
    nsColor = 'red';
    ewColor = 'amber';
  } else if (phase === 'NS_ALL_RED' || phase === 'EW_ALL_RED') {
    nsColor = 'red';
    ewColor = 'red';
  }

  return {
    phase: (phase === 'NS_ALL_RED' ? 'NS_AMBER' : phase === 'EW_ALL_RED' ? 'EW_AMBER' : phase) as SignalPhase,
    timer: Math.max(0, Math.ceil(timer)),
    nsColor,
    ewColor
  };
}
