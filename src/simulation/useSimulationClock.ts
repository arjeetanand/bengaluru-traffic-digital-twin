import { useEffect, useState } from 'react';
import { SIMULATION_CLOCK } from './scenarioEngine';

interface UseSimulationClockOptions {
  isPlaying: boolean;
  speed: 1 | 10 | 60;
}

export function useSimulationClock({ isPlaying, speed }: UseSimulationClockOptions) {
  const [simulationTimeSeconds, setSimulationTimeSeconds] = useState(SIMULATION_CLOCK.startSeconds);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setSimulationTimeSeconds((previous) => {
        const next = previous + SIMULATION_CLOCK.stepSeconds * speed * 10;
        return next > SIMULATION_CLOCK.endSeconds ? SIMULATION_CLOCK.startSeconds : next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isPlaying, speed]);

  const setTime = (nextTime: number) => {
    setSimulationTimeSeconds(Math.min(SIMULATION_CLOCK.endSeconds, Math.max(SIMULATION_CLOCK.startSeconds, nextTime)));
  };

  const restart = () => setSimulationTimeSeconds(SIMULATION_CLOCK.startSeconds);

  return { simulationTimeSeconds, setTime, restart };
}
