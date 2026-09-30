import { AppState, type AppStateStatus } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import { TickingText, formatDayMs } from './ticking-text';
import { useClockTick, useRelationshipClock } from './use-clock-tick';

type Listener = (status: AppStateStatus) => void;

function mockAppState(initial: AppStateStatus) {
  let listener: Listener = () => undefined;
  Object.defineProperty(AppState, 'currentState', { value: initial, configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    listener = handler as Listener;
    return { remove: jest.fn() } as never;
  });
  return (status: AppStateStatus) => act(() => listener(status));
}

describe('frame callback activity', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is inactive while the app is in the background and resumes on return', () => {
    const setStatus = mockAppState('active');
    const created: { setActive: jest.Mock; isActive: boolean }[] = [];
    const original = jest.requireMock('react-native-reanimated').useFrameCallback;
    jest
      .spyOn(jest.requireMock('react-native-reanimated'), 'useFrameCallback')
      .mockImplementation((...args: unknown[]) => {
        const handle = original(...args);
        if (!created.includes(handle)) created.push(handle);
        return handle;
      });

    const { result, rerender } = renderHook(
      ({ visible }: { visible: boolean }) => useClockTick(visible),
      {
        initialProps: { visible: true },
      }
    );
    const frame = created[0]!;
    expect(frame.isActive).toBe(true);

    const before = result.current.get();
    setStatus('background');
    expect(frame.isActive).toBe(false);

    jest.spyOn(Date, 'now').mockReturnValue(before + 60_000);
    setStatus('active');
    expect(frame.isActive).toBe(true);
    // On return the value jumps to the current time.
    expect(result.current.get()).toBe(before + 60_000);

    rerender({ visible: false });
    expect(frame.isActive).toBe(false);
  });
});

describe('useRelationshipClock', () => {
  it('derives the running time of day from the elapsed value', () => {
    // 2026-09-26 23:31:11.508 Tehran; the canvas start is 20:00, so 03:31:11.508 of day 12.
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 8, 26, 20, 1, 11, 508));
    const { result } = renderHook(() =>
      useRelationshipClock({ date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' })
    );
    expect(result.current.elapsed).toMatchObject({ y: 5, mo: 6, d: 12 });
    jest.restoreAllMocks();
  });
});

describe('TickingText', () => {
  it('formats hh:mm:ss.mmm in either script', () => {
    const ms = ((3 * 60 + 31) * 60 + 11) * 1000 + 508;
    expect(formatDayMs(ms, 'full', false)).toBe('03:31:11.508');
    expect(formatDayMs(ms, 'full', true)).toBe('۰۳:۳۱:۱۱.۵۰۸');
    expect(formatDayMs(ms, 'ms', false)).toBe('508');
  });

  it('renders the current value and stays out of the accessibility tree', () => {
    render(<TickingText testID="readout" dayMs={{ get: () => 1508 } as never} locale="en" />);
    const readout = screen.getByTestId('readout', { includeHiddenElements: true });
    expect(readout.props.defaultValue).toBe('00:00:01.508');
    expect(readout.props.accessible).toBe(false);
  });
});
