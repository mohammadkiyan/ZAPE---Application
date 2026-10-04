import { render } from '@testing-library/react-native';
import { Appearance, Text } from 'react-native';
import { THEMES, TONES } from './clock-themes';
import { ToneProvider, contrastRatio, flatten, toneVariables, useTone } from './theme';

function ToneProbe() {
  const { tone, palette } = useTone();
  return <Text>{`${tone}:${palette.bg}`}</Text>;
}

describe('tone theming', () => {
  it('gives Porcelain and Constellation different background variables', () => {
    const constellation = toneVariables(THEMES.constellation.tone);
    const porcelain = toneVariables(THEMES.porcelain.tone);
    expect(constellation['--background']).toBe('0 0% 8.2%');
    expect(porcelain['--background']).toBe('0 0% 100%');
    expect(constellation['--foreground']).not.toBe(porcelain['--foreground']);
  });

  it('never uses burgundy for the focus ring on the dark tone', () => {
    expect(toneVariables('dark')['--ring']).not.toBe(toneVariables('dark')['--primary']);
    expect(toneVariables('light')['--ring']).toBe(toneVariables('light')['--primary']);
  });

  it('keeps muted text at 4.5:1 or better on every tone', () => {
    for (const palette of Object.values(TONES)) {
      const muted = flatten(palette.muted, palette.bg);
      const bg = flatten(palette.bg, palette.bg);
      expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('leaves the native appearance alone when switching between light and gray', () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
    const result = render(<ToneProvider tone="light">{null}</ToneProvider>);
    expect(setColorScheme).toHaveBeenLastCalledWith('light');
    setColorScheme.mockClear();

    result.rerender(<ToneProvider tone="gray">{null}</ToneProvider>);
    result.rerender(<ToneProvider tone="light">{null}</ToneProvider>);
    expect(setColorScheme).not.toHaveBeenCalled();

    result.rerender(<ToneProvider tone="dark">{null}</ToneProvider>);
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    setColorScheme.mockRestore();
  });

  it('exposes the tone to descendants and lets onboarding force the light tone', () => {
    const result = render(
      <ToneProvider tone="dark">
        <ToneProbe />
        <ToneProvider tone="light">
          <ToneProbe />
        </ToneProvider>
      </ToneProvider>
    );
    expect(result.getByText('dark:#151515')).toBeTruthy();
    expect(result.getByText('light:#ffffff')).toBeTruthy();
    expect(result.getByTestId('tone-dark')).toBeTruthy();
    expect(result.getByTestId('tone-light')).toBeTruthy();
  });
});
