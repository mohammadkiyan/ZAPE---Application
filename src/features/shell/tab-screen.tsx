import type { ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Backdrop } from '@/features/clock-themes/backdrop';
import { useClockStyle } from '@/features/clock-themes/use-clock-style';
import { useTabBarInset } from './floating-tab-bar';
import type { TabId } from './tabs';

export interface TabScreenProps {
  tab: TabId;
  /** Paint the clock-theme background pattern behind the screen (Home, Rel Clock). */
  backdrop?: boolean;
  /** Trailing header slot, e.g. the Home status/offline chip. */
  headerAccessory?: ReactNode;
  /** The tab title and skeleton line; off once a feature fills the tab. */
  heading?: boolean;
  /** For a screen that needs to know what is on screen, e.g. to mark a note read. */
  scrollViewProps?: Pick<ScrollViewProps, 'onScroll' | 'onLayout' | 'scrollEventThrottle'>;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Wordmark shown in tab headers; a Latin brand value that stays left-to-right. */
function Wordmark() {
  return (
    <Text
      className="font-latin text-sm"
      style={{ writingDirection: 'ltr' }}
      accessibilityLabel="ZAPE RelTime">
      <Text className="font-latin text-sm font-semibold" style={{ letterSpacing: 0.28 }}>
        ZAPE
      </Text>
      <Text className="font-latin text-sm text-muted-foreground"> · RelTime</Text>
    </Text>
  );
}

/** Frame shared by the five tabs: backdrop, wordmark header and a scroll area above the tab bar. */
export function TabScreen({
  tab,
  backdrop = false,
  headerAccessory,
  heading = true,
  scrollViewProps,
  children,
  footer,
}: TabScreenProps) {
  const { t } = useTranslation('shell');
  const insets = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { width, height } = useWindowDimensions();
  const style = useClockStyle();
  return (
    <View testID={`tab-screen-${tab}`} className="flex-1 bg-background">
      {backdrop ? (
        <Backdrop
          background={style.background}
          tone={style.tone}
          width={width}
          height={height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      ) : null}
      <ScrollView
        testID={`tab-scroll-${tab}`}
        {...scrollViewProps}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: bottomInset, gap: 24 }}>
        <View className="min-h-12 flex-row items-center justify-between gap-3 px-4">
          <Wordmark />
          {headerAccessory}
        </View>
        {heading ? (
          <View className="gap-2 px-4">
            <Text accessibilityRole="header" className="text-2xl font-semibold leading-10">
              {t(`tabs.${tab}`)}
            </Text>
            <Text className="leading-7 text-muted-foreground">{t('skeleton')}</Text>
          </View>
        ) : null}
        {children}
        {footer}
      </ScrollView>
    </View>
  );
}
