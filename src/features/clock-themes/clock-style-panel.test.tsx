import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createPreferencesStore, preferencesStore } from '@/preferences/preferences';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { ClockStylePanel } from './clock-style-panel';

function renderPanel() {
  return render(
    <TestProviders tone="stored">
      <ClockStylePanel />
    </TestProviders>
  );
}

describe('clock style panel', () => {
  beforeEach(async () => {
    preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
    await setTestLocale('fa');
  });

  it('lists ten themes with the current one marked', () => {
    const result = renderPanel();
    expect(result.getAllByTestId(/^theme-[a-z]+$/)).toHaveLength(10);
    expect(result.getByTestId('theme-constellation')).toBeSelected();
    expect(result.getByTestId('theme-constellation-check')).toBeTruthy();
    expect(result.getByLabelText('صورت فلکی، انتخاب فعلی')).toBeTruthy();
    expect(result.getByTestId('tone-dark')).toBeTruthy();
  });

  it('picking Mist sets the gray tone and resets the background to auto', async () => {
    preferencesStore.setState({ background: 'stars' });
    const result = renderPanel();
    fireEvent.press(result.getByText('مه'));
    await waitFor(() => expect(result.getByTestId('tone-gray')).toBeTruthy());
    expect(preferencesStore.getState()).toMatchObject({ clockTheme: 'mist', background: 'auto' });
    expect(result.getByTestId('theme-mist')).toBeSelected();

    fireEvent.press(result.getByTestId('clock-style-background'));
    expect(result.getByTestId('background-contour')).toBeSelected();
  });

  it('shows ten backgrounds and applies an explicit pick', async () => {
    const result = renderPanel();
    fireEvent.press(result.getByTestId('clock-style-background'));
    expect(result.getByTestId('clock-style-background')).toBeSelected();
    expect(result.getAllByTestId(/^background-[a-z]+$/)).toHaveLength(10);
    expect(result.getByTestId('background-orbits')).toBeSelected();

    fireEvent.press(result.getByText('نقطه‌ها'));
    await waitFor(() => expect(result.getByTestId('background-dots')).toBeSelected());
    expect(preferencesStore.getState()).toMatchObject({
      clockTheme: 'constellation',
      background: 'dots',
    });
  });

  it.each(['porcelain', 'mist'] as const)('keeps %s across a relaunch', async (theme) => {
    const result = renderPanel();
    fireEvent.press(result.getByTestId(`theme-${theme}`));
    await waitFor(() => expect(result.getByTestId(`theme-${theme}`)).toBeSelected());
    await waitFor(async () => expect(await AsyncStorage.getItem('zape.clock-theme')).toBe(theme));

    // The next launch starts from a fresh store reading the same device storage.
    const relaunched = createPreferencesStore();
    await relaunched.getState().hydrate();
    expect(relaunched.getState()).toMatchObject({ clockTheme: theme, background: 'auto' });
  });

  it('uses English names in English', async () => {
    await setTestLocale('en');
    const result = renderPanel();
    expect(result.getByText('Split-flap')).toBeTruthy();
    expect(result.getByText('Theme')).toBeTruthy();
  });
});
