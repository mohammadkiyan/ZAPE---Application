import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Text } from '@/components/ui/text';
import { TimeDial } from '@/features/shell/time-dial';
import { usePreferences } from '@/preferences/preferences';
import type { DialVariant, Tone } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { dialValue, formatStartDate } from './format';
import { TickingText } from './ticking-text';
import { useRelationshipClock } from './use-clock-tick';

export interface ClockHeroProps {
  relationship: Pick<Relationship, 'start' | 'calendar'>;
  tone: Tone;
  variant: DialVariant;
  visible?: boolean;
}

function UnitValue({ value, unit, testID }: { value: string; unit: string; testID: string }) {
  return (
    <View testID={testID} className="items-center" style={{ minWidth: 64 }}>
      <Text className="font-medium" style={{ fontSize: 34, lineHeight: 48 }}>
        {value}
      </Text>
      <Text className="text-xs text-muted-foreground">{unit}</Text>
    </View>
  );
}

/**
 * The Home hero: years on a dial, months and days, the running time of day and the since
 * line. Values re-render once a minute; the time line ticks on its own. Opens Rel Clock.
 */
export function ClockHero({ relationship, tone, variant, visible = true }: ClockHeroProps) {
  const { t } = useTranslation('relationship');
  const router = useRouter();
  const locale = usePreferences((state) => state.locale);
  const { palette } = useTone();
  const clock = useRelationshipClock(relationship.start, { visible, resolution: 'minute' });
  const e = clock.elapsed;
  const summary = t('clock.summary', {
    y: dialValue(e.y, locale),
    mo: dialValue(e.mo, locale),
    d: dialValue(e.d, locale),
  });

  return (
    <Pressable
      testID="clock-hero"
      accessibilityRole="button"
      accessibilityLabel={summary}
      accessibilityHint={t('clock.open')}
      onPress={() => router.navigate('/clock')}
      className="mx-4 items-center gap-3 rounded-3xl py-5"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <Text className="text-sm font-medium text-muted-foreground">{t('clock.title')}</Text>
      <View className="flex-row items-center gap-4">
        <TimeDial
          value={dialValue(e.y, locale)}
          unit={t('clock.y')}
          progress={e.yearProgress}
          tone={tone}
          variant={variant}
          size={112}
          solid={false}
        />
        <UnitValue testID="hero-months" value={dialValue(e.mo, locale)} unit={t('clock.mo')} />
        <UnitValue testID="hero-days" value={dialValue(e.d, locale)} unit={t('clock.d')} />
      </View>
      <TickingText
        testID="hero-time"
        dayMs={clock.dayMs}
        locale={locale}
        style={{ fontSize: 20, color: palette.fg, alignSelf: 'stretch' }}
      />
      <Text className="text-sm text-muted-foreground">
        {t('clock.since', {
          date: formatStartDate(relationship.start, relationship.calendar, locale),
        })}
      </Text>
    </Pressable>
  );
}
