import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react-native';
import { getApiClient } from '@/api/backend';
import type { Invite, Relationship } from '@/api/contracts/relationship';
import { issueInvite } from '@/api/endpoints/relationship';
import { describeError } from '@/api/errors';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMe } from '@/features/auth/use-me';
import { useFinishStep } from '@/features/onboarding/finish-step';
import { OnboardingBar } from '@/features/onboarding/onboarding-bar';
import {
  OnboardingButton,
  OnboardingGlow,
  StepHeading,
} from '@/features/onboarding/onboarding-parts';
import { SecondaryScreen } from '@/features/shell/screen-header';
import { isTabId } from '@/features/shell/tabs';
import { formatDate } from '@/localization/format';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { HomeThread } from './home-thread';
import { useRelationship } from './use-relationship';

export const INVITE_QUERY_KEY = ['relationship', 'invite'] as const;
/** While the invite screen is focused, membership is checked this often. */
export const INVITE_POLL_MS = 5000;

/** «7K4P 9RM2»: two groups of four. */
export function groupCode(code: string): string {
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}

function isLive(invite: Invite | null | undefined): invite is Invite {
  return Boolean(invite && new Date(invite.expiresAt).getTime() > Date.now());
}

/** The live code: the one the relationship carries, or a fresh one once it expired. */
function useInvite(relationship: Relationship | null | undefined) {
  const pending = relationship?.status === 'pending_partner';
  const carried = relationship?.invite;
  const query = useQuery({
    queryKey: INVITE_QUERY_KEY,
    queryFn: () => issueInvite(getApiClient()),
    enabled: pending && !isLive(carried),
    staleTime: Infinity,
    retry: false,
  });
  return { invite: isLive(carried) ? carried : query.data, error: query.error };
}

/** A short confirmation that fades by itself, announced politely. */
function useToast(): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [
    message,
    (next) => {
      clearTimeout(timer.current);
      setMessage(next);
      timer.current = setTimeout(() => setMessage(null), 2000);
    },
  ];
}

function InviteBody({ relationship }: { relationship: Relationship }) {
  const { t } = useTranslation('relationship');
  const { t: tCommon } = useTranslation('common');
  const locale = usePreferences((state) => state.locale);
  const { palette } = useTone();
  const { invite, error } = useInvite(relationship);
  const [toast, showToast] = useToast();
  const joined = relationship.status === 'active';
  const failure = error ? describeError(error) : null;

  const expires = invite ? new Date(invite.expiresAt) : null;
  return (
    <View style={{ gap: 20 }}>
      <HomeThread relationship={relationship} />
      <Text
        testID="invite-status"
        accessibilityLiveRegion="polite"
        className="text-center font-medium"
        style={{ fontSize: 15, color: joined ? palette.fg : palette.muted }}>
        {joined ? t('invite.joined') : t('invite.waiting')}
      </Text>
      {!joined && invite ? (
        <View
          style={{
            marginHorizontal: 16,
            padding: 20,
            gap: 12,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.glass,
            alignItems: 'center',
          }}>
          <Text className="text-muted-foreground" style={{ fontSize: 13 }}>
            {t('invite.codeLabel')}
          </Text>
          <Text
            testID="invite-code"
            selectable
            accessibilityLabel={`${t('invite.codeLabel')}: ${invite.code.split('').join(' ')}`}
            className="font-latin font-semibold"
            style={{ fontSize: 34, lineHeight: 44, letterSpacing: 3, writingDirection: 'ltr' }}>
            {groupCode(invite.code)}
          </Text>
          {expires ? (
            <Text className="text-muted-foreground" style={{ fontSize: 12 }}>
              {t('invite.expires', {
                date: formatDate(
                  [expires.getFullYear(), expires.getMonth() + 1, expires.getDate()],
                  locale,
                  { calendar: relationship.calendar }
                ),
              })}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              testID="invite-copy"
              accessibilityRole="button"
              accessibilityLabel={t('invite.copy')}
              onPress={async () => {
                await Clipboard.setStringAsync(invite.code);
                showToast(t('invite.copied'));
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: 22,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: palette.off,
              }}>
              <Icon as={Copy} size={16} className="text-foreground" />
              <Text className="font-medium" style={{ fontSize: 14 }}>
                {t('invite.copy')}
              </Text>
            </Pressable>
            <Pressable
              testID="invite-share"
              accessibilityRole="button"
              onPress={() =>
                void Share.share({
                  message: t('invite.shareMessage', { code: groupCode(invite.code) }),
                }).catch(() => undefined)
              }
              style={{
                minHeight: 44,
                paddingHorizontal: 18,
                borderRadius: 22,
                justifyContent: 'center',
                backgroundColor: BURGUNDY,
              }}>
              <Text className="font-medium" style={{ fontSize: 14, color: '#ffffff' }}>
                {t('invite.share')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {failure ? (
        <Text
          accessibilityRole="alert"
          className="text-center font-medium"
          style={{ fontSize: 13 }}>
          {tCommon(failure.messageKey)}
        </Text>
      ) : null}
      {toast ? (
        <Text
          testID="invite-toast"
          accessibilityLiveRegion="polite"
          className="text-center font-medium"
          style={{ fontSize: 13 }}>
          {toast}
        </Text>
      ) : null}
    </View>
  );
}

function useInviteRelationship() {
  const focused = useIsFocused();
  return useRelationship({ refetchInterval: focused ? INVITE_POLL_MS : undefined }).data;
}

/** Onboarding, after creating: share the code, watch for the partner, then continue. */
export function OnboardingInviteScreen() {
  const { t } = useTranslation('relationship');
  const insets = useSafeAreaInsets();
  const relationship = useInviteRelationship();
  const me = useMe().data;
  const finish = useFinishStep('relationship');
  const [leaving, setLeaving] = useState(false);
  const joined = relationship?.status === 'active';
  const leave = () => {
    setLeaving(true);
    void finish(me);
  };

  return (
    <View
      testID="invite-relationship"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={2} />
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, gap: 24 }}>
        <StepHeading eyebrow={t('eyebrow')} title={t('invite.title')} body={t('invite.body')} />
        {relationship ? <InviteBody relationship={relationship} /> : null}
      </ScrollView>
      <View
        style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 8 }}>
        <OnboardingButton
          testID="invite-continue"
          label={t('invite.continue')}
          busy={leaving}
          onPress={leave}
        />
        {joined ? null : (
          <Pressable
            testID="invite-later"
            accessibilityRole="button"
            disabled={leaving}
            onPress={leave}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-medium text-muted-foreground">{t('invite.later')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** From Home's «ارسال دوباره‌ی دعوت‌نامه»: the same code and share, above the tabs. */
export function InviteScreen() {
  const { t } = useTranslation('relationship');
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const relationship = useInviteRelationship();
  return (
    <SecondaryScreen title={t('invite.title')} origin={isTabId(origin) ? origin : 'home'}>
      <Text
        className="text-muted-foreground"
        style={{ fontSize: 14, lineHeight: 24, marginBottom: 16 }}>
        {t('invite.body')}
      </Text>
      {/* The thread spans the screen width, like on Home. */}
      <View style={{ marginHorizontal: -16 }}>
        {relationship ? <InviteBody relationship={relationship} /> : null}
      </View>
    </SecondaryScreen>
  );
}
