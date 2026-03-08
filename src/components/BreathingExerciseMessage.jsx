import { useEffect, useMemo, useState } from 'react';

const BREATHING_PHASES = [
  { key: 'inhale', label: 'Inhale slowly', durationMs: 4000 },
  { key: 'hold', label: 'Hold', durationMs: 4000 },
  { key: 'exhale', label: 'Exhale gently', durationMs: 6000 },
];

const TOTAL_CYCLE_MS = BREATHING_PHASES.reduce((sum, phase) => sum + phase.durationMs, 0);

function getPhaseSnapshot(elapsedMs) {
  const cycleMs = elapsedMs % TOTAL_CYCLE_MS;
  let cursor = cycleMs;

  for (const phase of BREATHING_PHASES) {
    if (cursor < phase.durationMs) {
      return {
        phase,
        progress: phase.durationMs > 0 ? cursor / phase.durationMs : 0,
      };
    }

    cursor -= phase.durationMs;
  }

  return {
    phase: BREATHING_PHASES[0],
    progress: 0,
  };
}

function getBreathScale(phaseKey, progress) {
  if (phaseKey === 'inhale') {
    return 0.78 + progress * 0.34;
  }

  if (phaseKey === 'hold') {
    return 1.12;
  }

  return 1.12 - progress * 0.34;
}

const BreathingExerciseMessage = ({ onStop }) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const tick = (timestamp) => {
      setElapsedMs(timestamp - start);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const snapshot = useMemo(() => getPhaseSnapshot(elapsedMs), [elapsedMs]);
  const scale = getBreathScale(snapshot.phase.key, snapshot.progress);

  return (
    <article className="breathing-card" aria-live="polite" aria-label="Guided breathing exercise">
      <header className="breathing-header">
        <h3>Guided Breathing</h3>
        <button type="button" className="breathing-stop-btn" onClick={onStop}>
          Stop Exercise
        </button>
      </header>

      <div className="breathing-visual-wrap">
        <div
          className="breathing-circle"
          style={{ transform: `scale(${scale.toFixed(3)})` }}
          aria-hidden="true"
        />
      </div>

      <p className="breathing-phase">{snapshot.phase.label}</p>
      <p className="breathing-meta">4s inhale • 4s hold • 6s exhale</p>
    </article>
  );
};

export default BreathingExerciseMessage;
