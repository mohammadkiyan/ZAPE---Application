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
        <ClockFace relationship={canvasRelationship} tone="dark" variant="classic" />
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

  it('writes the since line in Gregorian for English', async () => {
    await setTestLocale('en');
    render(
      <TestProviders>
        <ClockFace relationship={canvasRelationship} tone="light" variant="hairline" />
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
