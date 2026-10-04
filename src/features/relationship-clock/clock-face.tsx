import type { ComponentType } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Backdrop } from '@/features/clock-themes/backdrop';
import { usePreferences } from '@/preferences/preferences';
import {
  BURGUNDY,
  THEMES,
  TONES,
  type BackgroundId,
  type FaceId,
  type ThemeId,
} from '@/theme/clock-themes';
import { dialProgress } from './elapsed';
import { AstrolabeFace } from './faces/astrolabe-face';
import { BraceletFace } from './faces/bracelet-face';
import { DialsFace } from './faces/dials-face';
import { EditorialFace } from './faces/editorial-face';
import {
  FACE_HEIGHT,
  FACE_WIDTH,
  Line,
  directionOf,
  unitType,
  type FaceProps,
} from './faces/face-kit';
import { FlapFace } from './faces/flap-face';
import { RingsFace } from './faces/rings-face';
import { RulerFace } from './faces/ruler-face';
import { dialValue, formatStartDate } from './format';
import { useRelationshipClock } from './use-clock-tick';

/**
 * Each face and the point its backdrop is centred on, measured from the names row. The six
 * dials come from the mobile canvas `ClockFace` part; the other faces are the RelTime device
 * canvas `Face*` parts, re-composed from its landscape screen for a phone.
 */
const FACES: Record<FaceId, { Face: ComponentType<FaceProps>; centerY: number }> = {
  dials: { Face: DialsFace, centerY: 312 },
  rings: { Face: RingsFace, centerY: 228 },
  astrolabe: { Face: AstrolabeFace, centerY: 262 },
  ruler: { Face: RulerFace, centerY: 312 },
  editorial: { Face: EditorialFace, centerY: 312 },
  flap: { Face: FlapFace, centerY: 312 },
  bracelet: { Face: BraceletFace, centerY: 312 },
};
/** The backdrop ends a little below the face, under the top of the Clock style panel. */
const BACKDROP_BOTTOM = 582;
/** It also runs up behind the tab header and status bar; the scroll view clips the rest. */
const BACKDROP_BLEED = 240;
const BEAD = { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BURGUNDY };

export interface ClockFaceProps {
  relationship: Pick<Relationship, 'start' | 'calendar'>;
  /** The clock style: tone, face and dial variant all come from the theme. */
  theme: ThemeId;
  background: BackgroundId;
  /** False while the screen is not focused: ticking stops. */
  visible?: boolean;
}

/**
 * The Rel Clock face: «شما» and «همراه» joined by a bar, the since line and the title, then
 * the theme's face over its backdrop. The header and the running clock are shared; a theme
 * only chooses how the time is drawn.
 */
export function ClockFace({ relationship, theme, background, visible = true }: ClockFaceProps) {
  const { t } = useTranslation('relationship');
  const locale = usePreferences((state) => state.locale);
  const { width: windowWidth } = useWindowDimensions();
  const { tone, face } = THEMES[theme];
  const { Face, centerY } = FACES[face];
  const palette = TONES[tone];
  const clock = useRelationshipClock(relationship.start, { visible });
  const e = clock.elapsed;
  const summary = t('clock.summary', {
    y: dialValue(e.y, locale),
    mo: dialValue(e.mo, locale),
    d: dialValue(e.d, locale),
  });

  const fa = locale === 'fa';
  // Narrow phones scale the artboard down; wider ones centre it.
  const k = Math.min(1, windowWidth / FACE_WIDTH);
  const width = FACE_WIDTH * k;
  const row = (top: number, height: number) =>
    ({
      position: 'absolute',
      top,
      left: 0,
      width: FACE_WIDTH,
      height,
      alignItems: 'center',
      justifyContent: 'center',
      direction: directionOf(locale),
    }) as const;

  return (
    <View
      testID="clock-face"
      accessible
      accessibilityLabel={summary}
      // Artboard coordinates are physical: left is left in either writing direction.
      style={{ width, height: FACE_HEIGHT * k, alignSelf: 'center', direction: 'ltr' }}>
      <Backdrop
        background={background}
        tone={tone}
        width={windowWidth}
        height={BACKDROP_BLEED + BACKDROP_BOTTOM * k}
        cx={windowWidth / 2}
        cy={BACKDROP_BLEED + centerY * k}
        scale={k}
        style={{ position: 'absolute', top: -BACKDROP_BLEED, left: (width - windowWidth) / 2 }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: FACE_WIDTH,
          height: FACE_HEIGHT,
          transform: [{ scale: k }],
          transformOrigin: 'top left',
        }}>
        <Face
          theme={theme}
          tone={tone}
          locale={locale}
          elapsed={e}
          progress={dialProgress(e)}
          secondProgress={clock.secondProgress}
          dayMs={clock.dayMs}
        />
        <View style={[row(0, 20), { flexDirection: 'row', gap: 12 }]}>
          <Line {...unitType(locale, { fa: 13, en: 11 })} height={20} color={palette.fg2}>
            {t('clock.you')}
          </Line>
          <View style={{ width: 72, flexDirection: 'row', alignItems: 'center' }}>
            <View style={BEAD} />
            <View style={{ flex: 1, height: 1.5, backgroundColor: BURGUNDY }} />
            <View style={BEAD} />
          </View>
          <Line {...unitType(locale, { fa: 13, en: 11 })} height={20} color={palette.fg2}>
            {t('clock.partner')}
          </Line>
        </View>
        <View style={row(26, fa ? 26 : 22)}>
          <Line size={fa ? 16 : 15} height={fa ? 26 : 22} color={palette.fg2}>
            {t('clock.since', {
              date: formatStartDate(relationship.start, relationship.calendar, locale),
            })}
          </Line>
        </View>
        <View style={row(70, 20)}>
          <Line
            {...unitType(locale, { fa: 13, en: 12 })}
            tracking={fa ? 0 : 2.4}
            height={20}
            color={palette.muted}>
            {t('clock.title')}
          </Line>
        </View>
      </View>
    </View>
  );
}
