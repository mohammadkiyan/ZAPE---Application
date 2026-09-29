import { render } from '@testing-library/react-native';
import { BACKGROUND_IDS } from '@/theme/clock-themes';
import { Backdrop, buildPattern } from './backdrop';

describe('backdrop patterns', () => {
  it.each(BACKGROUND_IDS)('renders the %s pattern', (background) => {
    const result = render(
      <Backdrop background={background} tone="dark" width={390} height={480} solid />
    );
    const backdrop = result.getByTestId(`backdrop-${background}`, { includeHiddenElements: true });
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);
    expect(backdrop.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('draws geometry for every pattern except plain', () => {
    for (const background of BACKGROUND_IDS) {
      const g = buildPattern(background, 390, 480, 195, 285, 1);
      const drawn = Boolean(g.a || g.b || g.dots || g.dots2);
      expect(drawn).toBe(background !== 'plain');
    }
  });

  it('is deterministic for seeded patterns', () => {
    expect(buildPattern('stars', 112, 70, 56, 40, 0.3)).toEqual(
      buildPattern('stars', 112, 70, 56, 40, 0.3)
    );
  });
});
