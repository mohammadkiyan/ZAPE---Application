import { View } from 'react-native';
import Svg from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Text } from '@/components/ui/text';
import { TimeDial } from '@/features/shell/time-dial';
import { Thread } from '@/features/shell/thread';
import { usePreferences } from '@/preferences/preferences';
import type { DialVariant, Tone } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { dialProgress } from './elapsed';
import { dialValue, formatStartDate } from './format';
import { TickingText } from './ticking-text';
import { useRelationshipClock } from './use-clock-tick';

const DIAL_SIZE = 104;

export interface ClockFaceProps {
  relationship: Pick<Relationship, 'start' | 'calendar'>;
  tone: Tone;
  variant: DialVariant;
  /** False while the screen is not focused: ticking stops. */
  visible?: boolean;
}

/** «شما» and «همراه» joined by the thread. Decorative; the face's label carries the meaning. */
function Names() {
  const { t } = useTranslation('relationship');
  return (
    <View className="flex-row items-center justify-center gap-3">
      <Text className="text-sm font-medium text-muted-foreground">{t('clock.you')}</Text>
      <Svg width={120} height={16}>
        <Thread d="M2 8C32 14 88 14 118 8" length={118} strokeWidth={1.5} />
      </Svg>
      <Text className="text-sm font-medium text-muted-foreground">{t('clock.partner')}</Text>
    </View>
  );
}

/**
 * The Rel Clock face: names, title, six dials with progress toward their next unit, the
 * running milliseconds and the since line, in the theme's dial variant.
 */
export function ClockFace({ relationship, tone, variant, visible = true }: ClockFaceProps) {
  const { t } = useTranslation('relationship');
  const locale = usePreferences((state) => state.locale);
  const { palette } = useTone();
  const clock = useRelationshipClock(relationship.start, { visible });
  const e = clock.elapsed;
  const progress = dialProgress(e);
  const dials = [
    { unit: 'y', value: e.y, progress: progress.y },
    { unit: 'mo', value: e.mo, progress: progress.mo },
    { unit: 'd', value: e.d, progress: progress.d },
    { unit: 'h', value: e.h, progress: progress.h },
    { unit: 'mi', value: e.mi, progress: progress.mi },
    { unit: 's', value: e.s, progress: clock.secondProgress },
  ] as const;
  const summary = t('clock.summary', {
    y: dialValue(e.y, locale),
    mo: dialValue(e.mo, locale),
    d: dialValue(e.d, locale),
  });

  return (
    <View
      testID="clock-face"
      accessible
      accessibilityLabel={summary}
      className="items-center gap-5 px-4">
      <Names />
      <Text className="text-xl font-semibold">{t('clock.title')}</Text>
      <View
        className="flex-row flex-wrap justify-center"
        style={{ gap: 14, maxWidth: DIAL_SIZE * 3 + 28 }}>
        {dials.map((dial) => (
          <View key={dial.unit} testID={`clock-dial-${dial.unit}`}>
            <TimeDial
              value={dialValue(dial.value, locale)}
              unit={t(`clock.${dial.unit}`)}
              progress={dial.progress}
              tone={tone}
              variant={variant}
              size={DIAL_SIZE}
              valueSize={34}
              solid={false}
            />
          </View>
        ))}
      </View>
      <View className="flex-row items-baseline gap-2">
        <TickingText
          testID="clock-ms"
          dayMs={clock.dayMs}
          format="ms"
          locale={locale}
          style={{ fontSize: 22, color: palette.fg, minWidth: 48 }}
        />
        <Text className="text-xs text-muted-foreground">{t('clock.ms')}</Text>
      </View>
      <Text className="text-sm text-muted-foreground">
        {t('clock.since', {
          date: formatStartDate(relationship.start, relationship.calendar, locale),
        })}
      </Text>
    </View>
  );
}
