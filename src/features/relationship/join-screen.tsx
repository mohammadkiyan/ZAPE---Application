import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { ApiError } from '@/api/client';
import type { Me } from '@/api/contracts/auth';
import {
  INVITE_CODE_LENGTH,
  RELATIONSHIP_ERROR_CODES,
  type RelationshipErrorCode,
} from '@/api/contracts/relationship';
import { acceptInvite, getInvitePreview } from '@/api/endpoints/relationship';
import { describeError } from '@/api/errors';
import { Text } from '@/components/ui/text';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { useFinishStep } from '@/features/onboarding/finish-step';
import { OnboardingBar } from '@/features/onboarding/onboarding-bar';
import {
  OnboardingButton,
  OnboardingGlow,
  StepHeading,
} from '@/features/onboarding/onboarding-parts';
import { elapsed } from '@/features/relationship-clock/elapsed';
import { formatElapsedSummary, formatStartDate } from '@/features/relationship-clock/format';
import { useNow } from '@/features/relationship-clock/use-now';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { codeState, normalizeInviteCode } from './invite-code';
import { rememberRelationship } from './relationship-cache';
import { RELATIONSHIP_QUERY_KEY } from './use-relationship';

function relationshipErrorCode(error: unknown): RelationshipErrorCode | null {
  const code = error instanceof ApiError ? error.serverCode : undefined;
  return (RELATIONSHIP_ERROR_CODES as readonly string[]).includes(code ?? '')
    ? (code as RelationshipErrorCode)
    : null;
}

/** Onboarding: join the partner's relationship with their 8-character code. */
export function JoinRelationshipScreen() {
  const { t } = useTranslation('relationship');
  const { t: tCommon } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const finish = useFinishStep('relationship');
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const now = useNow();
  const code = normalizeInviteCode(input);
  const state = codeState(code);

  const preview = useQuery({
    queryKey: ['invite-preview', code],
    queryFn: ({ signal }) => getInvitePreview(getApiClient(), code, signal),
    enabled: state === 'complete',
    retry: false,
    staleTime: 30_000,
  });

  const join = useMutation({
    mutationFn: () => acceptInvite(getApiClient(), code),
    onSuccess: async (relationship) => {
      rememberRelationship(relationship);
      queryClient.setQueryData(RELATIONSHIP_QUERY_KEY, relationship);
      const me = queryClient.getQueryData<Me>(ME_QUERY_KEY);
      const updated = me
        ? { ...me, relationship: { id: relationship.id, status: relationship.status } }
        : undefined;
      if (updated) queryClient.setQueryData(ME_QUERY_KEY, updated);
      await finish(updated);
    },
  });

  const error = join.error ?? (state === 'complete' ? preview.error : null);
  const known = state === 'malformed' ? 'invite_invalid' : relationshipErrorCode(error);
  const generic = !known && error ? describeError(error) : null;
  const message = known ? t(`join.errors.${known}`) : generic ? tCommon(generic.messageKey) : null;
  const ready = state === 'complete' && preview.data && !join.error;

  const since = preview.data
    ? {
        date: formatStartDate(preview.data.start, preview.data.calendar, locale),
        elapsed: formatElapsedSummary(elapsed(preview.data.start, now), t, locale, ['y', 'mo']),
      }
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="join-relationship"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={2} onBack={() => router.back()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 16 }}>
        <StepHeading eyebrow={t('eyebrow')} title={t('join.title')} body={t('join.body')} />
        <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
          <Text
            className="font-medium text-muted-foreground"
            style={{ paddingHorizontal: 4, fontSize: 13, lineHeight: 20 }}>
            {t('join.label')}
          </Text>
          <TextInput
            testID="join-code-input"
            accessibilityLabel={t('join.label')}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              join.reset();
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('join.placeholder')}
            placeholderTextColor="rgba(21, 21, 21, 0.3)"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={INVITE_CODE_LENGTH + 4}
            style={{
              marginTop: 8,
              height: 60,
              paddingHorizontal: 18,
              borderRadius: 14,
              borderWidth: focused ? 1.5 : 1,
              borderColor: message ? BURGUNDY : focused ? BURGUNDY : 'rgba(21, 21, 21, 0.14)',
              backgroundColor: '#ffffff',
              color: '#151515',
              fontFamily: 'Inter-SemiBold',
              fontSize: 24,
              letterSpacing: 4,
              textAlign: 'center',
              writingDirection: 'ltr',
            }}
          />
          {state === 'complete' && preview.isFetching && !preview.data ? (
            <Text className="text-muted-foreground" style={{ marginTop: 10, fontSize: 13 }}>
              {t('join.checking')}
            </Text>
          ) : null}
          {message ? (
            <Text
              testID="join-error"
              accessibilityRole="alert"
              style={{
                marginTop: 10,
                paddingHorizontal: 4,
                fontSize: 13,
                lineHeight: 22,
                color: BURGUNDY,
              }}>
              {message}
            </Text>
          ) : null}
          {since && ready ? (
            <View
              testID="join-preview"
              style={{
                marginTop: 20,
                padding: 18,
                gap: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(21, 21, 21, 0.08)',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 20px rgba(21, 21, 21, 0.06)',
              }}>
              <Text className="font-semibold" style={{ fontSize: 15, lineHeight: 26 }}>
                {preview.data!.creatorName
                  ? t('join.preview', { name: preview.data!.creatorName, ...since })
                  : t('join.previewUnnamed', since)}
              </Text>
              <Text className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 22 }}>
                {t('join.consent')}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View
        style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 8 }}>
        <OnboardingButton
          testID="join-submit"
          label={t('join.submit')}
          disabled={!ready}
          busy={join.isPending || join.isSuccess}
          onPress={() => join.mutate()}
        />
        <Pressable
          testID="join-no-code"
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/start-relationship')
          }
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="font-medium text-muted-foreground">{t('join.noCode')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
