import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { TONE_IDS, type DialVariant } from '@/theme/clock-themes';
import { TimeDial, arcPath, tallLine } from './time-dial';

const VARIANTS: DialVariant[] = ['classic', 'chrono', 'hairline'];

function styleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style);
}

describe('TimeDial', () => {
  it.each(VARIANTS)('renders the %s variant in every tone', (variant) => {
    for (const tone of TONE_IDS) {
      const { unmount } = render(
        <TimeDial value="۰۵" unit="سال" progress={0.5} tone={tone} variant={variant} />
      );
      expect(screen.getByTestId(`time-dial-face-${variant}`)).toBeTruthy();
      for (const other of VARIANTS.filter((v) => v !== variant)) {
        expect(screen.queryByTestId(`time-dial-face-${other}`)).toBeNull();
      }
      expect(screen.getByText('۰۵')).toBeTruthy();
      expect(screen.getByText('سال')).toBeTruthy();
      unmount();
    }
  });

  it('draws classic with ticks, a progress arc and a hand', () => {
    render(<TimeDial value="۰۵" unit="سال" progress={0.5} tone="dark" />);
    expect(screen.getByTestId('time-dial-ticks')).toBeTruthy();
    expect(screen.getByTestId('time-dial-arc').props.d).toBeTruthy();
    expect(screen.getByTestId('time-dial-hand').props.d).toBeTruthy();
    expect(screen.queryByTestId('time-dial-window')).toBeNull();
    expect(styleOf('۰۵')).toMatchObject({ fontSize: 38, fontFamily: 'NotoSansArabic-Medium' });
  });

  it('gives the chronograph a hand and a value window, and no arc', () => {
    render(<TimeDial value="۰۵" unit="سال" progress={0.5} tone="dark" variant="chrono" />);
    expect(screen.getByTestId('time-dial-ticks')).toBeTruthy();
    expect(screen.getByTestId('time-dial-hand').props.d).toBeTruthy();
    expect(screen.queryByTestId('time-dial-arc')).toBeNull();
    const window = StyleSheet.flatten(screen.getByTestId('time-dial-window').props.style);
    const value = styleOf('۰۵');
    expect(value.fontSize).toBe(24);
    // The value sits in its window, below the centre; the unit moves above it.
    expect(window.top).toBeGreaterThan(54);
    expect(value.top + value.height / 2).toBeCloseTo(window.top + window.height / 2, 1);
    expect(styleOf('سال').top + styleOf('سال').height / 2).toBeLessThan(54);
  });

  it('strips the hairline dial to a ring and an arc around a larger, lighter value', () => {
    render(<TimeDial value="۰۵" unit="سال" progress={0.5} tone="gray" variant="hairline" />);
    expect(screen.getByTestId('time-dial-arc').props).toMatchObject({ strokeWidth: 1.5 });
    expect(screen.queryByTestId('time-dial-ticks')).toBeNull();
    expect(screen.queryByTestId('time-dial-hand')).toBeNull();
    expect(styleOf('۰۵')).toMatchObject({ fontSize: 41, fontFamily: 'NotoSansArabic' });
  });

  it('shows sub-dial numerals only on a large chronograph', () => {
    const dial = (variant: DialVariant, size: number) => (
      <TimeDial
        value="۰۵"
        unit="سال"
        progress={0.5}
        tone="dark"
        variant={variant}
        size={size}
        marks="|3|9"
      />
    );
    const result = render(dial('chrono', 132));
    expect(screen.getAllByTestId('time-dial-mark')).toHaveLength(3);
    expect(screen.getByText('۳')).toBeTruthy();
    expect(screen.getByText('۹')).toBeTruthy();
    result.rerender(dial('chrono', 88));
    expect(screen.queryByTestId('time-dial-mark')).toBeNull();
    result.rerender(dial('classic', 132));
    expect(screen.queryByTestId('time-dial-mark')).toBeNull();
  });

  it('keeps the canvas text centre on a line no shorter than the font', () => {
    render(<TimeDial value="05" unit="Years" progress={0.5} tone="dark" />);
    const value = styleOf('05');
    // Canvas: a 38px box whose top is 4 + 0.863 × 38 above the centre of a 108px dial.
    expect(value.top + value.height / 2).toBeCloseTo(54 - 4 - 0.863 * 38 + 19, 1);
    expect(value.lineHeight).toBe(tallLine(38));
    expect(value.lineHeight).toBeGreaterThanOrEqual(38 * 2.112);
    expect(value.paddingTop).toBe(0);
  });

  it('omits the arc at zero progress', () => {
    render(<TimeDial value="00" unit="Years" progress={0} tone="dark" />);
    expect(screen.queryByTestId('time-dial-arc')).toBeNull();
  });

  it('draws half and full arcs', () => {
    expect(arcPath(50, 49, 0.5)).toBe('M50 1A49 49 0 0 1 50 99');
    expect(arcPath(50, 49, 1)).toContain('A49 49 0 1 1 50 99A49 49 0 1 1 50 1');
  });
});
