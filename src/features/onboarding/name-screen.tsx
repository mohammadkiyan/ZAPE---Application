import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { DISPLAY_NAME_MAX } from '@/api/contracts/auth';
import { updateMe } from '@/api/endpoints/auth';
import { describeError } from '@/api/errors';
import { Text } from '@/components/ui/text';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { localStepStore } from './local-step';
import { OnboardingBar } from './onboarding-bar';
import { OnboardingButton, OnboardingGlow, StepHeading } from './onboarding-parts';
import { stepAfter } from './resolve-entry';

/** Asked once, right after a new account is created. Part of the Account node. */
export function NameScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const trimmed = name.trim();

  const save = useMutation({
    mutationFn: (value: string) => updateMe(getApiClient(), { name: value }),
    onSuccess: async (me) => {
      queryClient.setQueryData(ME_QUERY_KEY, me);
      // Moving the resume point off `name` lets the gate continue onboarding.
      await localStepStore.getState().setStep(stepAfter('account'));
    },
  });
  const failure = save.error ? describeError(save.error) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="name-step"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={1} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 24 }}>
        <StepHeading
          eyebrow={t('onboarding:name.eyebrow')}
          title={t('onboarding:name.title')}
          body={t('onboarding:name.body')}
        />
        <View style={{ marginTop: 40, paddingHorizontal: 16 }}>
          <Text
            className="font-medium text-muted-foreground"
            style={{ paddingHorizontal: 4, fontSize: 13, lineHeight: 20 }}>
            {t('onboarding:name.label')}
          </Text>
          <TextInput
            testID="name-input"
            accessibilityLabel={t('onboarding:name.label')}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => trimmed && save.mutate(trimmed)}
            placeholder={t('onboarding:name.placeholder')}
            placeholderTextColor="rgba(21, 21, 21, 0.38)"
            maxLength={DISPLAY_NAME_MAX}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="givenName"
            returnKeyType="done"
            style={{
              marginTop: 8,
              height: 54,
              paddingHorizontal: 18,
              borderRadius: 14,
              borderWidth: focused ? 1.5 : 1,
              borderColor: focused ? BURGUNDY : 'rgba(21, 21, 21, 0.14)',
              backgroundColor: '#ffffff',
              boxShadow: focused
                ? '0 0 0 4px rgba(101, 0, 28, 0.08), 0 8px 20px rgba(21, 21, 21, 0.06)'
                : '0 8px 20px rgba(21, 21, 21, 0.06)',
              color: '#151515',
              fontFamily: locale === 'fa' ? 'NotoSansArabic' : 'Inter',
              fontSize: 16,
              textAlign: locale === 'fa' ? 'right' : 'left',
            }}
          />
          {name.length >= DISPLAY_NAME_MAX ? (
            <Text
              className="text-muted-foreground"
              style={{ marginTop: 10, paddingHorizontal: 4, fontSize: 13, lineHeight: 22 }}>
              {t('onboarding:name.tooLong')}
            </Text>
          ) : null}
          {failure ? (
            <Text
              accessibilityRole="alert"
              style={{
                marginTop: 10,
                paddingHorizontal: 4,
                fontSize: 13,
                lineHeight: 22,
                color: BURGUNDY,
              }}>
              {t(`common:${failure.messageKey}`)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <OnboardingButton
          testID="name-continue"
          label={t('onboarding:name.continue')}
          disabled={!trimmed}
          busy={save.isPending || save.isSuccess}
          onPress={() => save.mutate(trimmed)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
