import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { useConnectivity } from '@/api/connectivity';
import { useTone } from '@/theme/theme';

/**
 * For screens whose primary action writes shared data: disable it while offline and
 * explain why. Read-only content stays visible from the last sync.
 */
export function useOnlineAction(): { disabled: boolean; hint: string | undefined } {
  const { online } = useConnectivity();
  const { t } = useTranslation();
  return { disabled: !online, hint: online ? undefined : t('reconnectToContinue') };
}

/** The Home header chip slot: the offline notice replaces the regular chip while offline. */
export function HomeHeaderChip({ children }: { children?: ReactNode }) {
  const { online } = useConnectivity();
  const { t } = useTranslation();
  const { palette } = useTone();
  if (online) return <>{children}</>;
  return (
    <View
      testID="offline-chip"
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.glassEdge,
        backgroundColor: palette.glass,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <Text className="text-sm text-subtle" numberOfLines={1}>
        {t('offline')}
      </Text>
    </View>
  );
}
