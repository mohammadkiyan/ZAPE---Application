import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { runtimeConfig, type Backend } from '@/config/runtime-config';

/**
 * Shown instead of the app when a release build has no usable API URL. It has no
 * navigation, cannot be dismissed, and makes no domain calls.
 */
export function ConfigurationErrorScreen() {
  const { t } = useTranslation('shell');
  return (
    <View
      testID="configuration-error"
      accessibilityRole="alert"
      className="flex-1 justify-center gap-3 bg-background px-8">
      <View className="h-0.5 w-12 bg-thread" />
      <Text accessibilityRole="header" className="text-xl font-semibold leading-9">
        {t('configError.title')}
      </Text>
      <Text className="leading-7 text-muted-foreground">{t('configError.body')}</Text>
    </View>
  );
}

/** Renders the app only when a backend is usable; a misconfigured build gets the error screen. */
export function BackendGate({
  backend = runtimeConfig.backend,
  children,
}: PropsWithChildren<{ backend?: Backend }>) {
  if (backend === 'misconfigured') return <ConfigurationErrorScreen />;
  return <>{children}</>;
}
