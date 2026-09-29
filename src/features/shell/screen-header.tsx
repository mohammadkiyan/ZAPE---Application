import type { PropsWithChildren } from 'react';
import { I18nManager, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTabBarInset } from './floating-tab-bar';
import type { TabId } from './tabs';

export interface ScreenHeaderProps {
  title: string;
  /** The tab this screen was opened from; labels the Back control. */
  origin?: TabId;
  onBack?: () => void;
}

/** Header for secondary screens: a Back control labelled with its origin, then the title. */
export function ScreenHeader({ title, origin, onBack }: ScreenHeaderProps) {
  const { t } = useTranslation(['common', 'shell']);
  const router = useRouter();
  const originLabel = origin ? t(`shell:tabs.${origin}`) : undefined;
  return (
    <View className="gap-2 px-4 pt-2">
      <Pressable
        testID="screen-back"
        accessibilityRole="button"
        accessibilityLabel={originLabel ? t('backTo', { origin: originLabel }) : t('back')}
        hitSlop={8}
        onPress={onBack ?? (() => router.back())}
        className="min-h-11 min-w-11 flex-row items-center gap-1 self-start">
        <Icon
          as={I18nManager.isRTL ? ChevronRight : ChevronLeft}
          size={22}
          className="text-foreground"
        />
        {originLabel ? <Text className="text-sm text-subtle">{originLabel}</Text> : null}
      </Pressable>
      <Text accessibilityRole="header" className="text-2xl font-semibold leading-10">
        {title}
      </Text>
    </View>
  );
}

/** Scaffold for screens stacked above the tabs: header plus a scroll area that clears the tab bar. */
export function SecondaryScreen({ children, ...header }: PropsWithChildren<ScreenHeaderProps>) {
  const insets = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader {...header} />
      <ScrollView
        testID="secondary-scroll"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomInset,
        }}>
        {children}
      </ScrollView>
    </View>
  );
}
