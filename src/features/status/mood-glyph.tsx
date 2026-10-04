import Svg, { Path } from 'react-native-svg';
import type { Mood } from '@/api/contracts/status';
import { MOOD_GLYPHS } from './mood-glyphs';

export interface MoodGlyphProps {
  mood: Mood;
  size: number;
  color: string;
  /** In view-box units: thinner on the large orbs, heavier at list size. */
  strokeWidth?: number;
  testID?: string;
}

/** A mood's line glyph. Decorative: the mood's label is always shown or announced beside it. */
export function MoodGlyph({ mood, size, color, strokeWidth = 1.25, testID }: MoodGlyphProps) {
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Path
        d={MOOD_GLYPHS[mood]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The mark inside an empty orb: a plus where you can set a status, a dash where you cannot. */
export function EmptyOrbMark({
  kind,
  size,
  color,
}: {
  kind: 'plus' | 'dash';
  size: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Path
        d={kind === 'plus' ? 'M12 5v14M5 12h14' : 'M7 12h10'}
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}
