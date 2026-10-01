import { useEffect, useRef, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { CircleAlert } from 'lucide-react-native';
import { getApiClient } from '@/api/backend';
import type { OtpRequestResponse } from '@/api/contracts/auth';
import { requestOtp, verifyOtp } from '@/api/endpoints/auth';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CodeInput } from '@/features/auth/code-input';
import { requestErrorKey, verifyErrorKey, type AccountErrorKey } from '@/features/auth/otp-errors';
import { parsePhoneNumber } from '@/features/auth/phone';
import { sessionStore } from '@/features/auth/session-store';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { MockDataFooter } from '@/features/development/mock-controls';
import { formatCountdown } from '@/localization/format';
import { directionForLocale } from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { localStepStore } from './local-step';
import { OnboardingBar } from './onboarding-bar';
import { OnboardingButton, OnboardingGlow, StepHeading } from './onboarding-parts';

/** How long a wrong code stays on screen, shaking, before the boxes clear. */
const WRONG_CODE_HOLD_MS = 420;

interface SentCode {
  response: OtpRequestResponse;
  phoneNumber: string;
  sentAt: number;
}

/** Wall-clock time that re-renders every second while `active`. */
function useSecondTicker(active: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function Pill({
  label,
  onPress,
  disabled = false,
  dashed = false,
  testID,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  dashed?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        justifyContent: 'center',
        backgroundColor: dashed ? 'transparent' : 'rgba(21, 21, 21, 0.05)',
        borderWidth: dashed ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: 'rgba(21, 21, 21, 0.18)',
      }}>
      {/* No lineHeight: a squeezed Noto Sans Arabic line box sits high in the pill on iOS. */}
      <Text
        className={dashed ? 'text-muted-foreground' : 'font-medium'}
        style={{
          fontSize: 14,
          textAlign: 'center',
          includeFontPadding: false,
          fontVariant: ['tabular-nums'],
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A soft burgundy callout that eases in under the field; reduced motion skips the motion. */
function ErrorNotice({ message, centred = false }: { message?: string; centred?: boolean }) {
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(150)}
      testID="account-error"
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        marginTop: 14,
        alignSelf: centred ? 'center' : 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(101, 0, 28, 0.14)',
        backgroundColor: 'rgba(101, 0, 28, 0.05)',
      }}>
      <Icon as={CircleAlert} size={16} color={BURGUNDY} />
      <Text
        className={centred ? 'w-auto' : 'w-auto flex-1'}
        style={{ flexShrink: 1, fontSize: 13, color: BURGUNDY }}>
        {message}
      </Text>
    </Animated.View>
  );
}

/** Account step: phone number, then the six-digit code. A new number creates the account. */
export function AccountScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const codeRef = useRef<TextInput>(null);

  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sent, setSent] = useState<SentCode>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<AccountErrorKey>();
  const [notice, setNotice] = useState<string>();
  const [wrongCode, setWrongCode] = useState(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(clearTimer.current), []);

  const now = useSecondTicker(stage === 'code');
  const remaining = sent
    ? Math.max(
        0,
        sent.response.resendAfterSec - Math.max(0, Math.floor((now - sent.sentAt) / 1000))
      )
    : 0;

  const request = useMutation({
    mutationFn: (phoneNumber: string) => requestOtp(getApiClient(), { phoneNumber }),
  });
  const verify = useMutation({
    mutationFn: (input: { flowId: string; code: string }) => verifyOtp(getApiClient(), input),
  });

  function sendCode(phoneNumber: string, resend: boolean) {
    setError(undefined);
    setNotice(undefined);
    request.mutate(phoneNumber, {
      onSuccess: (response) => {
        setSent({ response, phoneNumber, sentAt: Date.now() });
        setCode('');
        setStage('code');
        if (resend) setNotice(t('onboarding:account.resent'));
      },
      onError: (failure) => setError(requestErrorKey(failure) ?? undefined),
    });
  }

  function onRequest() {
    const phoneNumber = parsePhoneNumber(phone);
    if (!phoneNumber) {
      setError('onboarding:account.errors.phoneInvalid');
      return;
    }
    sendCode(phoneNumber, false);
  }

  function onVerify() {
    if (!sent || code.length !== 6) return;
    setError(undefined);
    setNotice(undefined);
    verify.mutate(
      { flowId: sent.response.flowId, code },
      {
        onSuccess: async ({ session, isNewAccount }) => {
          queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
          // Written before the session exists, so the gate's first decision already sees it.
          if (isNewAccount) await localStepStore.getState().setStep('name');
          await sessionStore.getState().setCredential(session);
        },
        onError: (failure) => {
          const { key, clearCode } = verifyErrorKey(failure);
          setError(key ?? undefined);
          if (clearCode) {
            // The wrong digits shake in place for a moment, then clear for a fresh try.
            setWrongCode((count) => count + 1);
            clearTimeout(clearTimer.current);
            clearTimer.current = setTimeout(() => {
              setCode('');
              codeRef.current?.focus();
            }, WRONG_CODE_HOLD_MS);
          } else {
            codeRef.current?.focus();
          }
        },
      }
    );
  }

  function onBack() {
    void localStepStore.getState().unsetStep();
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  }

  function onChangeNumber() {
    clearTimeout(clearTimer.current);
    setStage('phone');
    setCode('');
    setError(undefined);
    setNotice(undefined);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="account-step"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={1} onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}>
        <StepHeading
          title={t('onboarding:account.title')}
          body={stage === 'phone' ? t('onboarding:account.body') : undefined}
        />
        <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
          {stage === 'phone' ? (
            <>
              <TextInput
                testID="phone-input"
                accessibilityLabel={t('onboarding:account.phoneLabel')}
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setError(undefined);
                }}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onSubmitEditing={onRequest}
                placeholder={t('onboarding:account.phonePlaceholder')}
                placeholderTextColor="rgba(21, 21, 21, 0.38)"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                style={{
                  height: 54,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  borderWidth: phoneFocused || error ? 1.5 : 1,
                  borderColor: phoneFocused || error ? BURGUNDY : 'rgba(21, 21, 21, 0.14)',
                  backgroundColor: '#ffffff',
                  boxShadow: phoneFocused
                    ? '0 0 0 4px rgba(101, 0, 28, 0.08), 0 8px 20px rgba(21, 21, 21, 0.06)'
                    : '0 8px 20px rgba(21, 21, 21, 0.06)',
                  color: '#151515',
                  fontFamily: 'Inter',
                  fontSize: 16,
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }}
              />
              <ErrorNotice message={error ? t(error) : undefined} />
              <View style={{ marginTop: 16 }}>
                <MockDataFooter />
              </View>
            </>
          ) : (
            <>
              <View>
                <CodeInput
                  ref={codeRef}
                  value={code}
                  onChange={(next) => {
                    clearTimeout(clearTimer.current);
                    setCode(next);
                    setError(undefined);
                  }}
                  accessibilityLabel={t('onboarding:account.codeLabel')}
                  locale={locale}
                  editable={!verify.isPending}
                  invalid={Boolean(error)}
                  shakeKey={wrongCode}
                />
              </View>
              <ErrorNotice centred message={error ? t(error) : undefined} />
              <Text
                testID="code-destination"
                className="text-center text-muted-foreground"
                style={{ marginTop: 14, fontSize: 13, lineHeight: 22 }}>
                {t('onboarding:account.codeSentPrefix')}
                <Text
                  className="font-latin text-foreground"
                  style={{ fontSize: 13, writingDirection: 'ltr' }}>
                  {`⁦${sent?.response.destination ?? ''}⁩`}
                </Text>
                {t('onboarding:account.codeSentSuffix')}
              </Text>
              {notice ? (
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-center text-muted-foreground"
                  style={{ marginTop: 6, fontSize: 13, lineHeight: 22 }}>
                  {notice}
                </Text>
              ) : null}
              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  direction: directionForLocale(locale),
                }}>
                <Pill
                  testID="change-number"
                  label={t('onboarding:account.changeNumber')}
                  onPress={onChangeNumber}
                />
                <Pill
                  testID="resend-code"
                  label={
                    remaining > 0
                      ? t('onboarding:account.resendIn', {
                          time: formatCountdown(remaining, locale),
                        })
                      : t('onboarding:account.resend')
                  }
                  dashed={remaining > 0}
                  disabled={remaining > 0 || request.isPending}
                  onPress={() => sent && sendCode(sent.phoneNumber, true)}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        {stage === 'phone' ? (
          <OnboardingButton
            testID="request-code"
            label={t('onboarding:account.requestCode')}
            busy={request.isPending}
            onPress={onRequest}
          />
        ) : (
          <OnboardingButton
            testID="verify-code"
            label={t('onboarding:account.signIn')}
            disabled={code.length !== 6}
            busy={verify.isPending || verify.isSuccess}
            onPress={onVerify}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
