import { useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { RelationshipStart } from '@/api/contracts/relationship';
import { dialProgress, elapsed, wallClock, type Elapsed } from './elapsed';

const DAY = 86_400_000;

function isForeground(status: AppStateStatus | null | undefined): boolean {
  return status !== 'background';
}

/** Whether the app is in the foreground. */
export function useAppForeground(): boolean {
  const [foreground, setForeground] = useState(() => isForeground(AppState.currentState));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) =>
      setForeground(isForeground(status))
    );
    return () => subscription.remove();
  }, []);
  return foreground;
}

/**
 * The current time (epoch ms) as a shared value, advanced on every frame while `visible` and the
 * app is in the foreground. Nothing is computed otherwise; on return it jumps to now.
 */
export function useClockTick(visible = true): SharedValue<number> {
  const [mountedAt] = useState(Date.now);
  const now = useSharedValue(mountedAt);
  const running = useAppForeground() && visible;
  const frame = useFrameCallback(() => {
    now.set(Date.now());
  }, false);
  useEffect(() => {
    if (running) now.set(Date.now());
    frame.setActive(running);
  }, [running, frame, now]);
  return now;
}

export interface RelationshipClock {
  /** Recomputed in React once per `resolution`; drives the dial values. */
  elapsed: Elapsed;
  now: SharedValue<number>;
  /** Wall-clock ms elapsed within the current day, advanced every frame. */
  dayMs: SharedValue<number>;
  /** Seconds-dial progress, advanced every frame. */
  secondProgress: SharedValue<number>;
}

/**
 * Live time together. Only this hook's owner re-renders, once per second (or minute); the
 * milliseconds and the seconds arc read shared values and never re-render React.
 */
export function useRelationshipClock(
  start: RelationshipStart,
  {
    visible = true,
    resolution = 'second',
  }: { visible?: boolean; resolution?: 'second' | 'minute' } = {}
): RelationshipClock {
  const now = useClockTick(visible);
  const unit = resolution === 'minute' ? 60_000 : 1000;
  const [instant, setInstant] = useState(() => Date.now());
  useAnimatedReaction(
    () => Math.floor(now.get() / unit),
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setInstant, current * unit);
    },
    [unit]
  );
  const { date, time, timeZone } = start;
  const value = useMemo(
    () => elapsed({ date, time, timeZone }, instant),
    [date, time, timeZone, instant]
  );

  // `dayMs` = (now in the relationship's wall clock) − (start of the current elapsed day).
  const base = useMemo(() => {
    const wall = wallClock(instant, timeZone);
    const intoDay = ((value.h * 60 + value.mi) * 60 + value.s) * 1000 + value.ms;
    return { offset: wall - instant, dayStart: wall - intoDay };
  }, [instant, timeZone, value]);
  const offset = useSharedValue(base.offset);
  const dayStart = useSharedValue(base.dayStart);
  useEffect(() => {
    offset.set(base.offset);
    dayStart.set(base.dayStart);
  }, [base, offset, dayStart]);

  const dayMs = useDerivedValue(() => {
    const rest = now.get() + offset.get() - dayStart.get();
    return ((rest % DAY) + DAY) % DAY;
  });
  const secondProgress = useDerivedValue(() => (dayMs.get() % 60_000) / 60_000);
  return { elapsed: value, now, dayMs, secondProgress };
}

export { dialProgress };
