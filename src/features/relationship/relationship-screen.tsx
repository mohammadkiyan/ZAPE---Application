import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react-native';
import { getApiClient } from '@/api/backend';
import type { Me } from '@/api/contracts/auth';
import type { Relationship } from '@/api/contracts/relationship';
import { endRelationship } from '@/api/endpoints/relationship';
import { describeError } from '@/api/errors';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { elapsed } from '@/features/relationship-clock/elapsed';
import { formatElapsedSummary, formatStartDate } from '@/features/relationship-clock/format';
import { useNow } from '@/features/relationship-clock/use-now';
import { SecondaryScreen } from '@/features/shell/screen-header';
import { formatClock, formatDate, localizeDigits } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { rememberRelationship } from './relationship-cache';
import { Sheet } from './sheet';
import { utcOffsetLabel, zoneCityFallback } from './start-picker';
import { RELATIONSHIP_QUERY_KEY, useRelationship } from './use-relationship';

function Group({
  title,
  children,
  testID,
}: {
  title: string;
  children: ReactNode;
  testID?: string;
}) {
  const { palette } = useTone();
  return (
    <View testID={testID} style={{ gap: 8 }}>
      <Text className="text-sm font-medium text-muted-foreground" style={{ paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: palette.glassEdge,
          backgroundColor: palette.glass,
          overflow: 'hidden',
        }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  accessory,
  last = false,
  testID,
}: {
  label: string;
  value?: string;
  accessory?: ReactNode;
  last?: boolean;
  testID?: string;
}) {
  const { palette } = useTone();
  return (
    <View
      testID={testID}
      style={{
        minHeight: 52,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.line,
      }}>
      <Text className="flex-1" style={{ fontSize: 15 }}>
        {label}
      </Text>
      {value ? (
        <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
          {value}
        </Text>
      ) : null}
      {accessory}
    </View>
  );
}

function isoToParts(iso: string): [number, number, number] {
  const date = new Date(iso);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

function Pair({ relationship }: { relationship: Relationship }) {
  const { t } = useTranslation('relationship');
  const { palette } = useTone();
  const partner = relationship.members.find((member) => !member.isYou);
  const orb = (joined: boolean) => ({
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: joined ? ('solid' as const) : ('dashed' as const),
    borderColor: joined ? palette.edge : BURGUNDY,
    backgroundColor: joined ? palette.glass : 'transparent',
  });
  return (
    <View testID="relationship-pair" className="flex-row items-center justify-center gap-3">
      <View className="items-center gap-1">
        <View style={orb(true)} />
        <Text className="text-sm font-medium">{t('clock.you')}</Text>
      </View>
      <View
        style={{
          width: 56,
          height: 2,
          borderRadius: 1,
          backgroundColor: BURGUNDY,
          opacity: partner ? 1 : 0.4,
        }}
      />
      <View className="items-center gap-1">
        <View testID="relationship-partner-orb" style={orb(Boolean(partner))} />
        <Text className="text-sm font-medium">{partner?.name ?? t('details.partner')}</Text>
      </View>
    </View>
  );
}

function zoneLabel(
  zone: string,
  date: string,
  locale: AppLocale,
  t: ReturnType<typeof useTranslation<'relationship'>>['t']
) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return t('create.zoneRow', {
    city: t(`zones.${zone}` as 'zones.UTC', { defaultValue: zoneCityFallback(zone) }),
    offset: utcOffsetLabel(zone, [y, m, d], locale),
  });
}

function RelationshipDetails({ relationship }: { relationship: Relationship }) {
  const { t } = useTranslation('relationship');
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const { start, calendar } = relationship;
  const [hour, minute] = start.time.split(':').map(Number) as [number, number];
  const startDate = formatStartDate(start, calendar, locale);
  const now = useNow();
  const together = formatElapsedSummary(elapsed(start, now), t, locale);
  const partner = relationship.members.find((member) => !member.isYou);

  const end = useMutation({
    mutationFn: () => endRelationship(getApiClient()),
    onSuccess: async () => {
      setConfirming(false);
      rememberRelationship(null);
      queryClient.setQueryData(RELATIONSHIP_QUERY_KEY, null);
      queryClient.setQueryData<Me>(ME_QUERY_KEY, (me) =>
        me ? { ...me, relationship: { id: relationship.id, status: 'ended', endedBy: 'you' } } : me
      );
      // The gate now routes to the Relationship step; refresh to confirm with the backend.
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
  const failure = end.error ? describeError(end.error) : null;

  return (
    <View style={{ gap: 24 }}>
      <View className="items-center gap-2">
        <Pair relationship={relationship} />
        <Text testID="relationship-since" className="text-sm text-muted-foreground">
          {t('details.since', { date: startDate, time: formatClock(hour, minute, locale) })}
        </Text>
        <Text testID="relationship-together" className="font-semibold" style={{ fontSize: 17 }}>
          {t('details.together', { elapsed: together })}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Group title={t('details.timeTogether')} testID="relationship-time">
          <Row label={t('details.startDate')} value={startDate} />
          <Row label={t('details.startTime')} value={formatClock(hour, minute, locale)} />
          <Row label={t('details.calendar')} value={t(`create.${calendar}`)} />
          <Row
            label={t('details.timeZone')}
            value={zoneLabel(start.timeZone, start.date, locale, t)}
            last
          />
        </Group>
        <Text className="text-xs text-muted-foreground" style={{ paddingHorizontal: 4 }}>
          {t('details.approvalNote')}
        </Text>
      </View>

      <Group title={t('details.members')} testID="relationship-members">
        {relationship.members.map((member, index) => (
          <Row
            key={member.userId}
            testID={`member-${member.isYou ? 'you' : 'partner'}`}
            label={`${member.name ?? t('details.unnamed')}${member.isYou ? ` ${t('details.youSuffix')}` : ''}`}
            value={t('details.joined', {
              date: formatDate(isoToParts(member.joinedAt), locale, { calendar }),
            })}
            last={index === relationship.members.length - 1 && Boolean(partner)}
          />
        ))}
        {partner ? null : (
          <Row
            testID="member-invited"
            label={t('details.partner')}
            value={t('details.invited')}
            last
            accessory={
              <Pressable
                testID="member-show-invite"
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/invite', params: { origin: 'more' } })}
                hitSlop={8}>
                <Text className="text-sm font-medium text-foreground underline">
                  {t('details.showInvite')}
                </Text>
              </Pressable>
            }
          />
        )}
      </Group>

      <Group title={t('details.id')}>
        <Row
          label={relationship.id}
          testID="relationship-id"
          last
          accessory={
            <Pressable
              testID="relationship-copy-id"
              accessibilityRole="button"
              accessibilityLabel={t('details.copyId')}
              hitSlop={8}
              onPress={async () => {
                await Clipboard.setStringAsync(relationship.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}>
              <Icon as={Copy} size={18} className="text-muted-foreground" />
            </Pressable>
          }
        />
      </Group>
      {copied ? (
        <Text
          testID="relationship-id-copied"
          accessibilityLiveRegion="polite"
          className="text-center text-sm font-medium">
          {t('details.idCopied')}
        </Text>
      ) : null}

      <Pressable
        testID="relationship-end"
        accessibilityRole="button"
        onPress={() => setConfirming(true)}
        className="min-h-12 items-center justify-center rounded-2xl"
        style={{ borderWidth: 1, borderColor: BURGUNDY }}>
        <Text className="font-medium text-foreground">{t('details.end')}</Text>
      </Pressable>

      <Sheet
        visible={confirming}
        title={t('details.confirmTitle')}
        onClose={() => setConfirming(false)}
        testID="end-sheet">
        <Text
          className="text-center text-muted-foreground"
          style={{ fontSize: 14, lineHeight: 24 }}>
          {t('details.confirmBody')}
        </Text>
        {failure ? (
          <Text
            accessibilityRole="alert"
            className="text-center font-medium"
            style={{ fontSize: 13 }}>
            {tCommon(failure.messageKey)}
          </Text>
        ) : null}
        <Pressable
          testID="end-confirm"
          accessibilityRole="button"
          disabled={end.isPending}
          onPress={() => end.mutate()}
          className="min-h-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: BURGUNDY, opacity: end.isPending ? 0.6 : 1 }}>
          <Text className="font-medium" style={{ color: '#ffffff' }}>
            {t('details.confirm')}
          </Text>
        </Pressable>
        <Pressable
          testID="end-cancel"
          accessibilityRole="button"
          onPress={() => setConfirming(false)}
          className="min-h-12 items-center justify-center">
          <Text className="font-medium text-muted-foreground">{t('details.cancel')}</Text>
        </Pressable>
      </Sheet>
    </View>
  );
}

/** From More: the pair, time together, members, the copyable ID and «پایان رابطه». */
export function RelationshipScreen() {
  const { t } = useTranslation('relationship');
  const relationship = useRelationship().data;
  return (
    <SecondaryScreen title={t('details.title')} origin="more">
      {relationship ? <RelationshipDetails relationship={relationship} /> : null}
    </SecondaryScreen>
  );
}

/** The More-tab row that opens the Relationship screen. */
export function RelationshipMoreRow() {
  const { t } = useTranslation('relationship');
  const router = useRouter();
  const locale = usePreferences((state) => state.locale);
  const relationship = useRelationship().data;
  const { palette } = useTone();
  return (
    <Pressable
      testID="more-relationship"
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/relationship', params: { origin: 'more' } })}
      className="mx-4 min-h-14 flex-row items-center justify-between rounded-2xl px-4"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <Text className="font-medium">{t('more.row')}</Text>
      {relationship ? (
        <Text className="text-sm text-muted-foreground">
          {localizeDigits(
            formatStartDate(relationship.start, relationship.calendar, locale),
            locale
          )}
        </Text>
      ) : null}
    </Pressable>
  );
}
