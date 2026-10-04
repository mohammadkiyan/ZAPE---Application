import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';

export function ReadinessScreen() {
  const { t } = useTranslation('shell');
  return (
    <View className="flex-1 justify-center bg-background px-6">
      <View className="mx-auto w-full max-w-lg gap-8">
        <View className="gap-3">
          <Text className="text-center font-latin text-6xl font-semibold">ZAPE</Text>
          <View className="mx-auto h-0.5 w-16 bg-primary" />
          <Text className="text-center text-xs tracking-widest text-muted-foreground">
            {t('readiness.foundation')}
          </Text>
        </View>
        <Card>
          <CardContent className="gap-3">
            <Text className="text-center text-xl font-semibold">{t('readiness.ready')}</Text>
            <Text className="text-center text-sm leading-7 text-muted-foreground">
              {t('readiness.detail')}
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
