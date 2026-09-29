import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { runtimeConfig, type Backend } from '@/config/runtime-config';
import { MOCK_OTP_CODE, resetMockBackend } from '@/api/mock';
import { listPartnerControls, runPartnerControl } from '@/api/mock/partner-controls';
import { usePreferences } from '@/preferences/preferences';

/** Development builds only, and only while the mock backend serves domain calls. */
export function mockToolsEnabled(backend: Backend = runtimeConfig.backend): boolean {
  return __DEV__ && backend === 'mock';
}

/** The small "Mock data" marker in the More footer; opens the Mock controls sheet. */
export function MockDataFooter({ backend }: { backend?: Backend }) {
  const { t } = useTranslation('shell');
  const router = useRouter();
  if (!mockToolsEnabled(backend)) return null;
  return (
    <Pressable
      testID="mock-data-marker"
      accessibilityRole="button"
      accessibilityLabel={t('mock.controls')}
      onPress={() => router.push('/dev/mock-controls')}
      className="min-h-11 items-center justify-center self-center rounded-full border border-border px-4">
      <Text className="text-xs text-muted-foreground">{t('mock.marker')}</Text>
    </Pressable>
  );
}

/** Sheet content: act as the partner, or reset the mock backend to the canvas seed. */
export function MockControlsSheet({ backend }: { backend?: Backend }) {
  const { t } = useTranslation('shell');
  const locale = usePreferences((state) => state.locale);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  if (!mockToolsEnabled(backend)) return null;
  const controls = listPartnerControls();

  return (
    <ScrollView contentContainerClassName="gap-4 p-6" testID="mock-controls">
      <Text accessibilityRole="header" className="text-xl font-semibold">
        {t('mock.controls')}
      </Text>
      <Text testID="mock-otp-code" className="text-sm text-muted-foreground">
        {t('mock.signInCode', { code: MOCK_OTP_CODE })}
      </Text>
      <View className="gap-2">
        <Text className="text-sm text-muted-foreground">{t('mock.partnerActions')}</Text>
        {controls.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t('mock.noActions')}</Text>
        ) : (
          controls.map((control) => (
            <Button
              key={control.id}
              variant="outline"
              onPress={async () => {
                await runPartnerControl(control.id);
                await queryClient.invalidateQueries();
              }}>
              <Text>{control.label[locale]}</Text>
            </Button>
          ))
        )}
      </View>
      <Button
        variant="destructive"
        onPress={async () => {
          await resetMockBackend();
          queryClient.clear();
          setMessage(t('mock.resetDone'));
        }}>
        <Text>{t('mock.reset')}</Text>
      </Button>
      {message ? (
        <Text accessibilityLiveRegion="polite" className="text-sm text-muted-foreground">
          {message}
        </Text>
      ) : null}
    </ScrollView>
  );
}
