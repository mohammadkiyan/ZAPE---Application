import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import RelClock from '@/app/(main)/(tabs)/clock';
import Status from '@/app/(main)/(tabs)/status';
import Note from '@/app/(main)/(tabs)/note';
import More from '@/app/(main)/(tabs)/more';
import { RELATIONSHIP_QUERY_KEY } from '@/features/relationship/use-relationship';
import { preferencesStore } from '@/preferences/preferences';
import { CANVAS_NOW, canvasRelationship } from '@/testing/relationship';
import { seedOnboarded } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { BACKGROUND_IDS, TONE_IDS, type DialVariant, type ThemeId } from '@/theme/clock-themes';

let client: QueryClient;

function TestRoot() {
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="stored">
        <Slot />
      </TestProviders>
    </QueryClientProvider>
  );
}

const routes = {
  _layout: TestRoot,
  '(main)/_layout': MainLayout,
  '(main)/(tabs)/_layout': TabsLayout,
  '(main)/(tabs)/index': Home,
  '(main)/(tabs)/clock': RelClock,
  '(main)/(tabs)/status': Status,
  '(main)/(tabs)/note': Note,
  '(main)/(tabs)/more': More,
};

const VARIANTS: DialVariant[] = ['classic', 'chrono', 'hairline'];

/** What each style looks like on the Rel Clock, from the canvas theme, dial and face parts. */
const LOOK = {
  constellation: {
    tone: 'dark',
    dial: 'classic',
    backdrop: 'orbits',
    ink: '#ffffff',
    hands: 6,
    thread: 1.75,
  },
  porcelain: {
    tone: 'light',
    dial: 'classic',
    backdrop: 'plain',
    ink: '#151515',
    hands: 6,
    thread: 1.75,
  },
  mist: {
    tone: 'gray',
    dial: 'hairline',
    backdrop: 'contour',
    ink: '#151515',
    hands: 0,
    thread: 1.25,
  },
} as const satisfies Partial<Record<ThemeId, object>>;
type Style = keyof typeof LOOK;

const CANVAS_DIALS = [
  ['y', '۰۵'],
  ['mo', '۰۶'],
  ['d', '۱۲'],
  ['h', '۰۳'],
  ['mi', '۳۱'],
  ['s', '۱۱'],
] as const;

function expectClockStyle(style: Style) {
  const look = LOOK[style];
  const face = within(screen.getByTestId('clock-face'));
  for (const variant of VARIANTS) {
    expect(face.queryAllByTestId(`time-dial-face-${variant}`)).toHaveLength(
      variant === look.dial ? 6 : 0
    );
  }
  expect(face.queryAllByTestId('time-dial-hand')).toHaveLength(look.hands);
  expect(face.queryAllByTestId('time-dial-ticks')).toHaveLength(look.hands);
  expect(face.getByTestId('clock-thread').props.strokeWidth).toBe(look.thread);
  const backdrops = BACKGROUND_IDS.filter(
    (id) => screen.queryAllByTestId(`backdrop-${id}`, { includeHiddenElements: true }).length > 0
  );
  expect(backdrops).toEqual([look.backdrop]);
  for (const [unit] of CANVAS_DIALS) {
    const value = within(screen.getByTestId(`clock-dial-${unit}`)).getAllByText(/[۰-۹]/)[0]!;
    expect(StyleSheet.flatten(value.props.style).color).toBe(look.ink);
  }
  expect(screen.getByTestId(`theme-${style}`)).toBeSelected();
  // One theme for the phone: the rest of the app takes the clock theme's tone.
  expect(TONE_IDS.filter((tone) => screen.queryByTestId(`tone-${tone}`))).toEqual([look.tone]);
}

function expectCanvasTime() {
  expect(screen.getByTestId('clock-face').props.accessibilityLabel).toBe(
    'زمان ما: ۰۵ سال، ۰۶ ماه، ۱۲ روز'
  );
  for (const [unit, value] of CANVAS_DIALS) {
    expect(within(screen.getByTestId(`clock-dial-${unit}`)).getByText(value)).toBeTruthy();
  }
  expect(screen.getByTestId('clock-ms', { includeHiddenElements: true }).props.defaultValue).toBe(
    '۵۰۸'
  );
  expect(screen.getByText('از ۲۴ اسفند ۱۳۹۹')).toBeTruthy();
}

async function pick(style: Style) {
  fireEvent.press(screen.getByTestId(`theme-${style}`));
  await waitFor(() => expect(screen.getByTestId(`theme-${style}`)).toBeSelected());
}

describe('Rel Clock style switching', () => {
  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
    client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    seedOnboarded(client);
    client.setQueryData(RELATIONSHIP_QUERY_KEY, canvasRelationship);
    preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
    await setTestLocale('fa');
  });
  afterEach(() => jest.restoreAllMocks());

  it('redraws the clock for each style and leaves nothing of the previous one', async () => {
    renderRouter(routes, { initialUrl: '/clock' });
    await waitFor(() => expect(screen.getByTestId('clock-face')).toBeTruthy());
    expectClockStyle('constellation');

    for (const style of ['porcelain', 'mist', 'constellation', 'mist'] as const) {
      await pick(style);
      expectClockStyle(style);
      expectCanvasTime();
    }
  });

  it('swaps the whole face for themes that have their own, without restarting the clock', async () => {
    const reanimated = jest.requireMock('react-native-reanimated');
    const original = reanimated.useFrameCallback;
    const frames = new Set<{ isActive: boolean }>();
    jest.spyOn(reanimated, 'useFrameCallback').mockImplementation((...args: unknown[]) => {
      const frame = original(...args);
      frames.add(frame);
      return frame;
    });

    renderRouter(routes, { initialUrl: '/clock' });
    await waitFor(() => expect(screen.getByTestId('clock-face')).toBeTruthy());
    const face = screen.getByTestId('clock-face');
    const mounted = [...frames];
    const faces = ['dials', 'rings', 'astrolabe', 'ruler', 'editorial', 'flap', 'bracelet'];

    for (const theme of ['rings', 'astrolabe', 'ruler', 'editorial', 'flap', 'bracelet'] as const) {
      fireEvent.press(screen.getByTestId(`theme-${theme}`));
      await waitFor(() => expect(screen.getByTestId(`theme-${theme}`)).toBeSelected());
      expect(faces.filter((id) => screen.queryByTestId(`face-${id}`))).toEqual([theme]);
      expect(screen.queryByTestId('time-dial')).toBeNull();
      expect(screen.getByTestId('clock-face')).toBe(face);
      expect([...frames]).toEqual(mounted);
      expect(screen.getByText('از ۲۴ اسفند ۱۳۹۹')).toBeTruthy();
    }

    await pick('constellation');
    expectClockStyle('constellation');
    expectCanvasTime();
    expect(screen.getByTestId('clock-face')).toBe(face);
  });

  it('keeps the same running clock and the same relationship data while switching', async () => {
    const reanimated = jest.requireMock('react-native-reanimated');
    const original = reanimated.useFrameCallback;
    const frames = new Set<{ isActive: boolean }>();
    jest.spyOn(reanimated, 'useFrameCallback').mockImplementation((...args: unknown[]) => {
      const frame = original(...args);
      frames.add(frame);
      return frame;
    });

    renderRouter(routes, { initialUrl: '/clock' });
    await waitFor(() => expect(screen.getByTestId('clock-face')).toBeTruthy());
    const face = screen.getByTestId('clock-face');
    const mounted = [...frames];
    expect(mounted.length).toBeGreaterThan(0);
    const relationship = client.getQueryData(RELATIONSHIP_QUERY_KEY);
    const { locale } = preferencesStore.getState();

    for (const style of ['porcelain', 'mist', 'constellation', 'mist'] as const) {
      await pick(style);
      // A remount would start a new frame callback and reset the clock's own state.
      expect(screen.getByTestId('clock-face')).toBe(face);
      expect([...frames]).toEqual(mounted);
      expect(mounted.every((frame) => frame.isActive)).toBe(true);
      expect(client.getQueryData(RELATIONSHIP_QUERY_KEY)).toBe(relationship);
      expectCanvasTime();
    }
    expect(preferencesStore.getState()).toMatchObject({
      locale,
      clockTheme: 'mist',
      background: 'auto',
    });
  });
});
