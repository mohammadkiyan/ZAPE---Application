import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import type { Me } from '@/api/contracts/auth';
import type { RelationshipCalendar, RelationshipStart } from '@/api/contracts/relationship';
import { createRelationship } from '@/api/endpoints/relationship';
import { describeError } from '@/api/errors';
import { Text } from '@/components/ui/text';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { OnboardingBar } from '@/features/onboarding/onboarding-bar';
import {
  OnboardingButton,
  OnboardingGlow,
  StepHeading,
} from '@/features/onboarding/onboarding-parts';
import { elapsed } from '@/features/relationship-clock/elapsed';
import { dialValue, formatElapsedSummary } from '@/features/relationship-clock/format';
import { useNow } from '@/features/relationship-clock/use-now';
import { TimeDial } from '@/features/shell/time-dial';
import { formatClock, localizeDigits, monthNames, type DateParts } from '@/localization/format';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { rememberRelationship } from './relationship-cache';
import { Sheet, Stepper } from './sheet';
import {
  curatedTimeZones,
  isFutureDate,
  phoneTimeZone,
  stepDate,
  toCalendar,
  toIsoDate,
  todayIn,
  utcOffsetLabel,
  zoneCityFallback,
  type DateUnit,
} from './start-picker';
import { RELATIONSHIP_QUERY_KEY } from './use-relationship';

export interface StartDraft {
  date: DateParts;
  hour: number;
  minute: number;
  timeZone: string;
}

function Field({
  label,
  value,
  onPress,
  testID,
}: {
  label: string;
  value: string;
  onPress: () => void;
  testID: string;
}) {
  const { palette } = useTone();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={{
        minHeight: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}>
      <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
        {label}
      </Text>
      <Text testID={`${testID}-value`} className="font-medium" style={{ fontSize: 15 }}>
        {value}
      </Text>
    </Pressable>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: RelationshipCalendar;
  onChange: (value: RelationshipCalendar) => void;
}) {
  const { t } = useTranslation('relationship');
  const { palette } = useTone();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('create.calendar')}
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: 12,
        backgroundColor: palette.off,
      }}>
      {(['jalali', 'gregorian'] as const).map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            testID={`calendar-${option}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option)}
            style={{
              minHeight: 36,
              paddingHorizontal: 16,
              borderRadius: 10,
              justifyContent: 'center',
              backgroundColor: selected ? palette.segSel : 'transparent',
            }}>
            <Text className={selected ? 'font-medium' : 'text-muted-foreground'}>
              {t(`create.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function defaultDraft(): StartDraft {
  const timeZone = phoneTimeZone();
  return { date: todayIn(timeZone), hour: 0, minute: 0, timeZone };
}

/** Onboarding: set the shared start moment, then create the relationship and invite. */
export function CreateRelationshipScreen({ initial }: { initial?: StartDraft }) {
  const { t } = useTranslation('relationship');
  const { t: tCommon } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const [draft, setDraft] = useState<StartDraft>(() => initial ?? defaultDraft());
  const [calendar, setCalendar] = useState<RelationshipCalendar>(
    locale === 'fa' ? 'jalali' : 'gregorian'
  );
  const [sheet, setSheet] = useState<'date' | 'time' | 'zone' | null>(null);

  const start: RelationshipStart = {
    date: toIsoDate(draft.date),
    time: `${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    timeZone: draft.timeZone,
  };
  const future = isFutureDate(draft.date, draft.timeZone);
  const now = useNow();
  const preview = elapsed(start, now);

  const shown = toCalendar(draft.date, calendar);
  const months = monthNames(calendar, locale);
  const dateText = localizeDigits(`${shown[2]} ${months[shown[1] - 1]} ${shown[0]}`, locale);
  const zoneText = (zone: string) =>
    t('create.zoneRow', {
      city: t(`zones.${zone}` as 'zones.UTC', { defaultValue: zoneCityFallback(zone) }),
      offset: utcOffsetLabel(zone, draft.date, locale),
    });

  const create = useMutation({
    mutationFn: () => createRelationship(getApiClient(), { start, calendar }),
    onSuccess: (relationship) => {
      rememberRelationship(relationship);
      queryClient.setQueryData(RELATIONSHIP_QUERY_KEY, relationship);
      queryClient.setQueryData<Me>(ME_QUERY_KEY, (me) =>
        me ? { ...me, relationship: { id: relationship.id, status: relationship.status } } : me
      );
      router.replace('/start-relationship/invite');
    },
  });
  const failure = create.error ? describeError(create.error) : null;

  const step = (unit: DateUnit) => (delta: 1 | -1) =>
    setDraft((d) => ({ ...d, date: stepDate(d.date, unit, delta, calendar) }));

  return (
    <View
      testID="create-relationship"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={2} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
        <StepHeading eyebrow={t('eyebrow')} title={t('create.title')} body={t('create.body')} />
        <View
          style={{
            marginTop: 24,
            marginHorizontal: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(21, 21, 21, 0.08)',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          }}>
          <Field
            testID="start-date"
            label={t('create.date')}
            value={dateText}
            onPress={() => setSheet('date')}
          />
          <Field
            testID="start-time"
            label={t('create.time')}
            value={formatClock(draft.hour, draft.minute, locale)}
            onPress={() => setSheet('time')}
          />
          <View
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(21, 21, 21, 0.08)',
            }}>
            <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
              {t('create.calendar')}
            </Text>
            <Segmented value={calendar} onChange={setCalendar} />
          </View>
          <Field
            testID="start-zone"
            label={t('create.timeZone')}
            value={zoneText(draft.timeZone)}
            onPress={() => setSheet('zone')}
          />
        </View>
        {future ? (
          <Text
            testID="start-future"
            accessibilityRole="alert"
            style={{
              marginTop: 10,
              marginHorizontal: 20,
              fontSize: 13,
              lineHeight: 22,
              color: BURGUNDY,
            }}>
            {t('create.future')}
          </Text>
        ) : null}
        <View
          testID="start-preview"
          accessible
          accessibilityLabel={`${t('create.preview')}: ${formatElapsedSummary(preview, t, locale)}`}
          style={{ marginTop: 24, alignItems: 'center', gap: 8 }}>
          <TimeDial
            value={dialValue(preview.y, locale)}
            unit={t('clock.y')}
            progress={preview.yearProgress}
            tone="light"
            size={104}
          />
          <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
            {formatElapsedSummary(preview, t, locale)}
          </Text>
        </View>
        <Text
          className="text-muted-foreground"
          style={{ marginTop: 20, marginHorizontal: 20, fontSize: 13, lineHeight: 22 }}>
          {t('create.sharedNote')}
        </Text>
        {failure ? (
          <Text
            accessibilityRole="alert"
            style={{
              marginTop: 10,
              marginHorizontal: 20,
              fontSize: 13,
              lineHeight: 22,
              color: BURGUNDY,
            }}>
            {tCommon(failure.messageKey)}
          </Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <OnboardingButton
          testID="create-submit"
          label={t('create.submit')}
          disabled={future}
          busy={create.isPending || create.isSuccess}
          onPress={() => create.mutate()}
        />
      </View>

      <Sheet
        visible={sheet === 'date'}
        title={t('create.date')}
        onClose={() => setSheet(null)}
        testID="date-sheet">
        <View style={{ flexDirection: 'row' }}>
          <Stepper
            testID="date-day"
            label={t('create.day')}
            value={localizeDigits(shown[2], locale)}
            onStep={step('day')}
            increaseLabel={t('create.increase', { unit: t('create.day') })}
            decreaseLabel={t('create.decrease', { unit: t('create.day') })}
          />
          <Stepper
            testID="date-month"
            label={t('create.month')}
            value={months[shown[1] - 1]!}
            onStep={step('month')}
            increaseLabel={t('create.increase', { unit: t('create.month') })}
            decreaseLabel={t('create.decrease', { unit: t('create.month') })}
          />
          <Stepper
            testID="date-year"
            label={t('create.year')}
            value={localizeDigits(shown[0], locale)}
            onStep={step('year')}
            increaseLabel={t('create.increase', { unit: t('create.year') })}
            decreaseLabel={t('create.decrease', { unit: t('create.year') })}
          />
        </View>
        {future ? (
          <Text style={{ fontSize: 13, lineHeight: 22, color: BURGUNDY, textAlign: 'center' }}>
            {t('create.future')}
          </Text>
        ) : null}
        <OnboardingButton label={t('create.done')} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet
        visible={sheet === 'time'}
        title={t('create.time')}
        onClose={() => setSheet(null)}
        testID="time-sheet">
        <View style={{ flexDirection: 'row', direction: 'ltr' }}>
          <Stepper
            testID="time-hour"
            label={t('create.hour')}
            value={localizeDigits(String(draft.hour).padStart(2, '0'), locale)}
            onStep={(delta) => setDraft((d) => ({ ...d, hour: (d.hour + delta + 24) % 24 }))}
            increaseLabel={t('create.increase', { unit: t('create.hour') })}
            decreaseLabel={t('create.decrease', { unit: t('create.hour') })}
          />
          <Stepper
            testID="time-minute"
            label={t('create.minute')}
            value={localizeDigits(String(draft.minute).padStart(2, '0'), locale)}
            onStep={(delta) => setDraft((d) => ({ ...d, minute: (d.minute + delta + 60) % 60 }))}
            increaseLabel={t('create.increase', { unit: t('create.minute') })}
            decreaseLabel={t('create.decrease', { unit: t('create.minute') })}
          />
        </View>
        <OnboardingButton label={t('create.done')} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet
        visible={sheet === 'zone'}
        title={t('create.timeZone')}
        onClose={() => setSheet(null)}
        testID="zone-sheet">
        <ScrollView style={{ maxHeight: 360 }}>
          {curatedTimeZones().map((zone) => {
            const selected = zone === draft.timeZone;
            return (
              <Pressable
                key={zone}
                testID={`zone-${zone}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setDraft((d) => ({ ...d, timeZone: zone }));
                  setSheet(null);
                }}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  justifyContent: 'center',
                  backgroundColor: selected ? 'rgba(101, 0, 28, 0.07)' : 'transparent',
                }}>
                <Text className={selected ? 'font-medium' : ''}>{zoneText(zone)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </View>
  );
}
