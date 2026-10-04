import { render, screen, within } from '@testing-library/react-native';
import { CANVAS_NOW, canvasRelationship } from '@/testing/relationship';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { THEMES, THEME_IDS, type FaceId, type ThemeId } from '@/theme/clock-themes';
import { ClockFace } from '../clock-face';
import { formatDayMs } from '../ticking-text';
import { baselineLift, ringArc, ringPoint } from './face-kit';

const FACE_IDS: FaceId[] = [
  'dials',
  'rings',
  'astrolabe',
  'ruler',
  'editorial',
  'flap',
  'bracelet',
];
const OWN_FACES = ['rings', 'astrolabe', 'ruler', 'editorial', 'flap', 'bracelet'] as const;

function renderFace(theme: ThemeId) {
  return render(
    <TestProviders tone={THEMES[theme].tone}>
      <ClockFace
        relationship={canvasRelationship}
        theme={theme}
        background={THEMES[theme].background}
      />
    </TestProviders>
  );
}

/** The text a unit shows, whatever the face splits it into (flap tiles are a digit each). */
function shown(unit: string): string {
  return within(screen.getByTestId(`clock-dial-${unit}`))
    .getAllByText(/[۰-۹0-9]/)
    .map((node) => node.props.children)
    .join('');
}

describe('theme faces', () => {
  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
    await setTestLocale('fa');
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(THEME_IDS)('draws %s with its own face and nothing of another', (theme) => {
    renderFace(theme);
    const drawn = FACE_IDS.filter((face) => screen.queryByTestId(`face-${face}`));
    expect(drawn).toEqual([THEMES[theme].face]);
    // The header and the spoken summary are the same on every face.
    expect(screen.getByText('شما')).toBeTruthy();
    expect(screen.getByText('همراه')).toBeTruthy();
    expect(screen.getByText('از ۲۴ اسفند ۱۳۹۹')).toBeTruthy();
    expect(screen.getByText('زمان ما')).toBeTruthy();
    expect(screen.getByTestId('clock-face').props.accessibilityLabel).toBe(
      'زمان ما: ۰۵ سال، ۰۶ ماه، ۱۲ روز'
    );
    expect(
      screen.getByTestId('clock-ms', { includeHiddenElements: true }).props.defaultValue
    ).toMatch(/^\.?۵۰۸$/);
  });

  it.each(['rings', 'ruler', 'flap', 'bracelet'] as const)('shows all six units on %s', (theme) => {
    renderFace(theme);
    expect(['y', 'mo', 'd', 'h', 'mi', 's'].map(shown)).toEqual([
      '۰۵',
      '۰۶',
      '۱۲',
      '۰۳',
      '۳۱',
      '۱۱',
    ]);
  });

  it('sets hours, minutes and seconds as one time on Astrolabe', () => {
    renderFace('astrolabe');
    expect(['y', 'mo', 'd'].map(shown)).toEqual(['۰۵', '۰۶', '۱۲']);
    expect(within(screen.getByTestId('clock-time')).getByText('۰۳:۳۱:۱۱')).toBeTruthy();
    expect(screen.getByText('ساعت · دقیقه · ثانیه')).toBeTruthy();
    // Years is the burgundy planet; the rest sit on their own orbits.
    for (const unit of ['y', 'mo', 'd', 'h', 'mi']) {
      expect(screen.getByTestId(`planet-${unit}`)).toBeTruthy();
    }
  });

  it('sets Editorial as text, with unpadded numbers and plural words', async () => {
    renderFace('editorial');
    expect(screen.getByTestId('editorial-years').props.children).toBe('۵');
    expect(screen.getByText('سال با هم')).toBeTruthy();
    expect(['mo', 'd'].map(shown)).toEqual(['۶', '۱۲']);
    expect(within(screen.getByTestId('clock-time')).getByText('۰۳:۳۱:۱۱')).toBeTruthy();

    await setTestLocale('en');
    renderFace('editorial');
    expect(screen.getByText('years together')).toBeTruthy();
    expect(screen.getByText('months')).toBeTruthy();
    expect(screen.getByText('Hours · Minutes · Seconds')).toBeTruthy();
  });

  it('gives Split-flap one tile per digit, inverted against the tone', () => {
    renderFace('flap');
    const tiles = screen.getAllByTestId('flap-tile');
    expect(tiles).toHaveLength(12);
    expect(tiles[0]!.props.style).toMatchObject({ backgroundColor: '#151515' });
  });

  it('hangs the Bracelet beads on two strands', () => {
    renderFace('bracelet');
    expect(screen.getAllByTestId('bracelet-thread')).toHaveLength(2);
    const y = (unit: string) => screen.getByTestId(`bead-${unit}`).props.cy;
    expect(Math.max(y('y'), y('mo'), y('d'))).toBeLessThan(Math.min(y('h'), y('mi'), y('s')));
    // Years is the largest bead.
    expect(screen.getByTestId('bead-y').props.r).toBeGreaterThan(
      screen.getByTestId('bead-s').props.r
    );
  });

  it('only gives the six later themes a face of their own', () => {
    for (const theme of ['constellation', 'porcelain', 'chronograph', 'mist'] as const) {
      expect(THEMES[theme].face).toBe('dials');
    }
    for (const theme of OWN_FACES) expect(THEMES[theme].face).toBe(theme);
  });
});

describe('face geometry', () => {
  it('draws progress clockwise from the top of a ring', () => {
    expect(ringArc(100, 100, 50, 0)).toBe('M0 0');
    expect(ringArc(100, 100, 50, 0.25)).toBe('M100 50A50 50 0 0 1 150 100');
    expect(ringArc(100, 100, 50, 0.75)).toBe('M100 50A50 50 0 1 1 50 100');
    expect(ringPoint(100, 100, 50, 0.5)).toEqual({ x: 100, y: 150 });
  });

  it('lifts a smaller line onto the baseline of a larger one', () => {
    // Same size and box: nothing to lift.
    expect(baselineLift({ size: 20, height: 24 }, { size: 20, height: 24 }, 'en')).toBe(0);
    expect(baselineLift({ size: 28, height: 34 }, { size: 15, height: 20 }, 'en')).toBeCloseTo(
      2.27,
      2
    );
  });

  it('formats the running fraction in either script', () => {
    expect(formatDayMs(1508, 'fraction', false)).toBe('.508');
    expect(formatDayMs(1508, 'fraction', true)).toBe('.۵۰۸');
  });
});
