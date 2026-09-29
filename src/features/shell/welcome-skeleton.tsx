import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';

/** Placeholder for the onboarding start; the onboarding change replaces it with Welcome. */
export function WelcomeSkeleton() {
  const { t } = useTranslation('shell');
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="welcome-skeleton"
      className="flex-1 justify-center gap-4 bg-background px-8"
      style={{ paddingTop: insets.top }}>
      <Text className="font-latin text-4xl font-semibold">ZAPE</Text>
      <View className="h-0.5 w-12 bg-thread" />
      <Text className="leading-7 text-muted-foreground">{t('skeleton')}</Text>
    </View>
  );
}
