import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';

export function ReadinessScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center bg-background px-6">
      <View className="mx-auto w-full max-w-lg gap-8">
        <View className="gap-3">
          <Text className="text-center font-display text-6xl text-primary">ZAPE</Text>
          <View className="mx-auto h-0.5 w-16 bg-primary" />
          <Text className="text-center text-xs tracking-widest text-muted-foreground">
            {t('foundation')}
          </Text>
        </View>
        <Card>
          <CardContent className="gap-3">
            <Text className="text-center text-xl font-semibold">{t('ready')}</Text>
            <Text className="text-center text-sm leading-7 text-muted-foreground">
              {t('readyDetail')}
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}

export function PlaceholderScreen({ message }: { message: 'authPlaceholder' | 'appPlaceholder' }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center bg-background px-6">
      <Text className="text-center">{t(message)}</Text>
    </View>
  );
}
