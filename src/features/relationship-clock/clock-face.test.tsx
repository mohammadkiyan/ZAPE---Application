import { renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
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
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ClockFace } from './clock-face';

function TestRoot() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  seedOnboarded(client);
  client.setQueryData(RELATIONSHIP_QUERY_KEY, canvasRelationship);
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

describe('ClockFace', () => {
  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
    await setTestLocale('fa');
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows six dials, the milliseconds, the since line and a spoken summary', () => {
    render(
      <TestProviders>
        <ClockFace relationship={canvasRelationship} theme="constellation" background="orbits" />
      </TestProviders>
    );
    const face = screen.getByTestId('clock-face');
    expect(face.props.accessibilityLabel).toBe('زمان ما: ۰۵ سال، ۰۶ ماه، ۱۲ روز');
    for (const [unit, value] of [
      ['y', '۰۵'],
      ['mo', '۰۶'],
      ['d', '۱۲'],
      ['h', '۰۳'],
      ['mi', '۳۱'],
      ['s', '۱۱'],
    ]) {
      expect(within(screen.getByTestId(`clock-dial-${unit}`)).getByText(value!)).toBeTruthy();
    }
    expect(screen.getByTestId('clock-ms', { includeHiddenElements: true }).props.defaultValue).toBe(
      '۵۰۸'
    );
    expect(screen.getByText('از ۲۴ اسفند ۱۳۹۹')).toBeTruthy();
  });

  it('strings the dials on the thread in the canvas constellation', () => {
    const face = (theme: 'constellation' | 'mist') => (
      <TestProviders>
        <ClockFace
          relationship={canvasRelationship}
          theme={theme}
          background={theme === 'mist' ? 'contour' : 'orbits'}
        />
      </TestProviders>
    );
    const result = render(face('constellation'));
    const sizes = (['y', 'mo', 'd', 'h', 'mi', 's'] as const).map(
      (unit) =>
        StyleSheet.flatten(
          within(screen.getByTestId(`clock-dial-${unit}`)).getByTestId('time-dial').props.style
        ).width
    );
    expect(sizes).toEqual([132, 108, 108, 88, 92, 88]);
    // Months sit left of days in either writing direction.
    const left = (unit: string) =>
      StyleSheet.flatten(screen.getByTestId(`clock-dial-${unit}`).props.style).left;
    expect(left('mo')).toBeLessThan(left('d'));
    expect(screen.getByTestId('clock-thread').props.strokeWidth).toBe(1.75);
    expect(screen.getByTestId('backdrop-orbits', { includeHiddenElements: true })).toBeTruthy();

    result.rerender(face('mist'));
    expect(screen.getByTestId('clock-thread').props.strokeWidth).toBe(1.25);
    expect(screen.getByTestId('backdrop-contour', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('backdrop-orbits', { includeHiddenElements: true })).toBeNull();
  });

  it('writes the since line in Gregorian for English', async () => {
    await setTestLocale('en');
    render(
      <TestProviders>
        <ClockFace relationship={canvasRelationship} theme="ruler" background="graticule" />
      </TestProviders>
    );
    expect(screen.getByText('Since March 14, 2021')).toBeTruthy();
    expect(screen.getByTestId('clock-face').props.accessibilityLabel).toBe(
      'Time together: 05 years, 06 months, 12 days'
    );
  });

  it('renders the chrono variant over Sunburst for the Chronograph theme', async () => {
    preferencesStore.setState({ clockTheme: 'chronograph', background: 'auto' });
    renderRouter(routes, { initialUrl: '/clock' });
    await waitFor(() => expect(screen.getByTestId('clock-face')).toBeTruthy());
    expect(screen.getAllByTestId('time-dial-face-chrono')).toHaveLength(6);
    expect(screen.queryByTestId('time-dial-face-classic')).toBeNull();
    expect(screen.getByTestId('backdrop-sunburst', { includeHiddenElements: true })).toBeTruthy();
    // The Clock style panel follows the face.
    expect(screen.getByText('سبک ساعت')).toBeTruthy();
  });
});
