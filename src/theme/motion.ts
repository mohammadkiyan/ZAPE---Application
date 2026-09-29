import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let lastKnown = false;

/**
 * Whether the OS asks for reduced motion. Decorative animation (thread draw-in, bead
 * pulses, bursts, pattern motion) must be skipped when true; functional updates such
 * as the ticking clock continue.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(lastKnown);
  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      lastKnown = value;
      if (active) setReduced(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
