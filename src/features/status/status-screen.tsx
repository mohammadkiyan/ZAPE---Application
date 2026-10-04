import { useEffect, useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { useConnectivity } from '@/api/connectivity';
import type { Mood, Status, StatusEvent } from '@/api/contracts/status';
import { describeError, type UserFacingError } from '@/api/errors';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useNow } from '@/features/relationship-clock/use-now';
import { formatZoneClock, useRelationshipTimeZone } from '@/features/relationship-clock/zone-time';
import { TabScreen } from '@/features/shell/tab-screen';
import { Thread } from '@/features/shell/thread';
import { formatRelativeTime } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { EmptyOrbMark, MoodGlyph } from './mood-glyph';
import { MoodPicker } from './mood-picker';
import { useSetStatus } from './use-set-status';
import { useStatusBoard, useStatusWaitingToSync } from './use-status-board';

/** How long «حال شما به‌روز شد» and its halo stay after a pick. */
export const STATUS_CONFIRM_MS = 1500;

const ORB = 112;
const COLUMN = 150;

interface OrbProps {
  testID: string;
  owner: string;
  status: Status | null | undefined;
  /** The label when there is no status. */
  emptyLabel: string;
  /** Replaces the relative time, e.g. "Status updated" or "Waiting to sync". */
  note?: string;
  /** Draws the confirmation halo and check. */
  confirmed?: boolean;
  emptyMark: 'plus' | 'dash';
  locale: AppLocale;
}

function StatusOrb({
  testID,
  owner,
  status,
  emptyLabel,
  note,
  confirmed = false,
  emptyMark,
  locale,
}: OrbProps) {
  const { t } = useTranslation('status');
  const { palette } = useTone();
  const label = status ? t(`moods.${status.mood}`) : emptyLabel;
  const when = note ?? (status ? formatRelativeTime(status.at, locale) : '');
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={[owner, label, when].filter(Boolean).join(locale === 'fa' ? '، ' : ', ')}
      style={{ width: COLUMN, alignItems: 'center' }}>
      <Text
        className="text-sm font-medium text-muted-foreground"
        style={{ textAlign: 'center', paddingTop: 0 }}>
        {owner}
      </Text>
      <View style={{ marginTop: 14, width: ORB, height: ORB }}>
        {confirmed ? (
          <View
            testID="status-confirm-halo"
            style={{
              position: 'absolute',
              top: -7,
              left: -7,
              right: -7,
              bottom: -7,
              borderRadius: ORB / 2 + 7,
              borderWidth: 1,
              borderColor: palette.halo,
            }}
          />
        ) : null}
        <View
          style={{
            width: ORB,
            height: ORB,
            borderRadius: ORB / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderStyle: status ? 'solid' : 'dashed',
            borderColor: status ? palette.edge : palette.control,
            backgroundColor: status ? palette.glass : 'transparent',
          }}>
          {status ? (
            <>
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  left: 9,
                  right: 9,
                  bottom: 9,
                  borderRadius: ORB / 2 - 9,
                  borderWidth: 1,
                  borderColor: palette.inner,
                }}
              />
              <MoodGlyph mood={status.mood} size={52} color={palette.fg} strokeWidth={0.69} />
            </>
          ) : (
            <EmptyOrbMark kind={emptyMark} size={28} color={palette.muted} />
          )}
        </View>
        {confirmed ? (
          <View
            style={{
              position: 'absolute',
              top: 2,
              end: 2,
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: BURGUNDY,
              borderWidth: 2,
              borderColor: palette.bg,
            }}>
            <Icon as={Check} size={12} color="#ffffff" />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        className="font-medium"
        style={{
          marginTop: 16,
          paddingTop: 0,
          textAlign: 'center',
          fontSize: status ? 26 : 20,
          lineHeight: 36,
          color: status ? palette.fg : palette.fg2,
        }}>
        {label}
      </Text>
      <Text
        testID={`${testID}-when`}
        numberOfLines={1}
        accessibilityLiveRegion={note ? 'polite' : 'none'}
        style={{
          marginTop: 2,
          minHeight: 22,
          paddingTop: 0,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 22,
          color: note ? palette.fg : palette.muted,
        }}>
        {when}
      </Text>
    </View>
  );
}

function HistoryRow({
  event,
  first,
  last,
  timeZone,
  locale,
}: {
  event: StatusEvent;
  first: boolean;
  last: boolean;
  timeZone: string;
  locale: AppLocale;
}) {
  const { t } = useTranslation('status');
  const { palette } = useTone();
  const mood = t(`moods.${event.mood}`);
  const time = formatZoneClock(event.at, timeZone, locale);
  const owner = t(event.owner === 'you' ? 'you' : 'partner');
  return (
    <View
      testID="status-history-entry"
      accessible
      accessibilityLabel={t('entry', { mood, time, owner })}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 14 }}>
      {last ? null : (
        <View
          style={{
            position: 'absolute',
            top: 20,
            bottom: -20,
            start: 16.5,
            width: 1,
            backgroundColor: palette.border,
          }}
        />
      )}
      <View
        style={{
          marginTop: 3,
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: first ? palette.edge : palette.border,
          backgroundColor: first ? palette.glass : palette.bg,
        }}>
        <MoodGlyph
          mood={event.mood}
          size={20}
          color={first ? palette.fg : palette.fg2}
          strokeWidth={1.5}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} className="font-medium" style={{ lineHeight: 22, paddingTop: 0 }}>
          {mood}
        </Text>
        <Text
          numberOfLines={1}
          className="text-muted-foreground"
          style={{ marginTop: 2, fontSize: 13, lineHeight: 18, paddingTop: 0 }}>
          {`${time} · ${owner}`}
        </Text>
      </View>
    </View>
  );
}

/** The Status tab: both people's current mood, the picker, and today's history. */
export function StatusScreen() {
  const { t } = useTranslation(['status', 'common']);
  const { palette } = useTone();
  const { width } = useWindowDimensions();
  const locale = usePreferences((state) => state.locale);
  const { online } = useConnectivity();
  const timeZone = useRelationshipTimeZone();
  const board = useStatusBoard().data;
  const waiting = useStatusWaitingToSync();
  const save = useSetStatus();
  // Relative times are text; once a minute keeps "10 minutes ago" honest.
  useNow();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<UserFacingError | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const pick = (mood: Mood) => {
    setPickerOpen(false);
    setError(null);
    setConfirmed(true);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmed(false), STATUS_CONFIRM_MS);
    save.pick(mood, {
      onError: (failure) => {
        // The board has rolled back to the last status ZAPE accepted.
        clearTimeout(confirmTimer.current);
        setConfirmed(false);
        setError(describeError(failure));
      },
    });
  };

  const you = board?.you;
  const partner = board?.partner;
  const inSync = Boolean(you && partner && you.mood === partner.mood);
  const today = board?.today ?? [];
  const threadWidth = width - 32;
  const threadStart = COLUMN / 2 + ORB / 2 - 2;
  const threadEnd = threadWidth - threadStart;
  // A shallow curve between the two orbs, sagging toward the middle.
  const thread = `M${threadStart} 56C${threadStart + 25} 70.7 ${threadEnd - 25} 70.7 ${threadEnd} 56`;

  return (
    <TabScreen tab="status" heading={false}>
      <View className="gap-1.5 px-4">
        <Text className="text-sm font-medium text-muted-foreground">{t('status:title')}</Text>
        <Text accessibilityRole="header" className="text-2xl font-medium leading-10">
          {t('status:subtitle')}
        </Text>
      </View>

      <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Svg
          width={threadWidth}
          height={ORB}
          style={{ position: 'absolute', left: 0, top: 34 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Thread
            testID="status-thread"
            d={thread}
            length={Math.round(threadEnd - threadStart + 8)}
            strokeWidth={1.75}
          />
        </Svg>
        <StatusOrb
          testID="status-you"
          owner={t('status:you')}
          status={you}
          emptyLabel={t('status:notSet')}
          emptyMark="plus"
          confirmed={confirmed && !waiting}
          note={waiting ? t('common:waitingToSync') : confirmed ? t('status:updated') : undefined}
          locale={locale}
        />
        <StatusOrb
          testID="status-partner"
          owner={t('status:partner')}
          status={partner}
          emptyLabel={t('status:partnerNotSet')}
          emptyMark="dash"
          locale={locale}
        />
      </View>

      <View className="gap-2.5 px-4">
        <Pressable
          testID="status-action"
          accessibilityRole="button"
          accessibilityState={{ disabled: !online }}
          disabled={!online}
          onPress={() => setPickerOpen(true)}
          style={{
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: online ? BURGUNDY : palette.off,
          }}>
          <Text
            className="font-medium"
            style={{
              paddingTop: 0,
              textAlign: 'center',
              color: online ? '#ffffff' : palette.faint,
            }}>
            {t(you ? 'status:change' : 'status:set')}
          </Text>
        </Pressable>
        {online ? null : (
          <Text
            testID="status-offline"
            accessibilityLiveRegion="polite"
            className="text-center text-sm text-muted-foreground">
            {t('status:offline')}
          </Text>
        )}
        {error ? (
          <Text
            testID="status-error"
            accessibilityRole="alert"
            className="text-center text-sm"
            style={{ color: palette.fg }}>
            {t(`common:${error.messageKey}`)}
          </Text>
        ) : null}
      </View>

      {inSync ? (
        <View
          testID="status-in-sync"
          className="mx-4 flex-row items-center gap-3 rounded-3xl px-4 py-3.5"
          style={{
            borderWidth: 1,
            borderColor: palette.glassEdge,
            backgroundColor: palette.glass,
          }}>
          <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: BURGUNDY }} />
          <Text className="flex-1 text-sm font-medium">{t('status:inSync')}</Text>
        </View>
      ) : null}

      <View
        className="mx-4 rounded-3xl px-4 pt-4"
        style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
        <Text className="text-sm font-medium text-muted-foreground">{t('status:today')}</Text>
        <View
          testID="status-history"
          accessibilityRole="list"
          accessibilityLabel={t('status:history')}
          style={{ marginTop: 14 }}>
          {today.length === 0 ? (
            <Text
              testID="status-history-empty"
              className="text-sm text-muted-foreground"
              style={{ paddingBottom: 16 }}>
              {t('status:historyEmpty')}
            </Text>
          ) : (
            today.map((event, index) => (
              <HistoryRow
                key={`${event.at}-${event.owner}-${index}`}
                event={event}
                first={index === 0}
                last={index === today.length - 1}
                timeZone={timeZone}
                locale={locale}
              />
            ))
          )}
        </View>
      </View>

      <MoodPicker
        visible={pickerOpen}
        current={you?.mood}
        onPick={pick}
        onClose={() => setPickerOpen(false)}
      />
    </TabScreen>
  );
}
