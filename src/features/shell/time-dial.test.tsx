import { render, screen } from '@testing-library/react-native';
import { TONE_IDS, type DialVariant } from '@/theme/clock-themes';
import { TimeDial, arcPath } from './time-dial';

const VARIANTS: DialVariant[] = ['classic', 'chrono', 'hairline'];

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
      expect(screen.getByTestId('time-dial-arc').props.d).toBeTruthy();
      expect(screen.getByText('۰۵')).toBeTruthy();
      expect(screen.getByText('سال')).toBeTruthy();
      unmount();
    }
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
