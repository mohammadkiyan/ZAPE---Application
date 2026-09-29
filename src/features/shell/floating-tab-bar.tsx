import { useEffect, useState } from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useReducedMotion } from '@/theme/motion';
import { useTone } from '@/theme/theme';
import { TAB_IDS, type TabId } from './tabs';

const BAR_HEIGHT = 64;
const BAR_PADDING = 6;
const LENS_WIDTH = 62;
const TOP_GUTTER = 4;

/** Space a scroll container must leave at its bottom so content clears the floating tab bar. */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TOP_GUTTER + BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;
}

export interface FloatingTabBarProps {
  /** The current tab, or the originating tab while a secondary screen is shown. */
  active: TabId | null;
  /** The partner left a note the user has not viewed. */
  unread?: boolean;
  onSelect(tab: TabId): void;
}

/** The glass five-tab bar from the canvas `TabBar` part: a thread of beads with a sliding lens. */
export function FloatingTabBar({ active, unread = false, onSelect }: FloatingTabBarProps) {
  const { t } = useTranslation('shell');
  const { tone, palette } = useTone();
  const locale = usePreferences((state) => state.locale);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const fa = locale === 'fa';

  const column = (width - BAR_PADDING * 2) / TAB_IDS.length;
  const index = active ? TAB_IDS.indexOf(active) : -1;
  const lensX = BAR_PADDING + index * column + (column - LENS_WIDTH) / 2;
  const offset = useSharedValue(lensX);
  useEffect(() => {
    if (index < 0 || width === 0) return;
    offset.value = reduceMotion
      ? lensX
      : withTiming(lensX, { duration: 320, easing: Easing.bezier(0.3, 1.35, 0.5, 1) });
  }, [index, lensX, width, reduceMotion, offset]);
  const lensStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: I18nManager.isRTL ? -offset.value : offset.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingTop: TOP_GUTTER,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      <View
        testID="tab-bar"
        accessibilityRole="tablist"
        accessibilityLabel={t('sections')}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{
          height: BAR_HEIGHT,
          paddingHorizontal: BAR_PADDING,
          borderRadius: BAR_HEIGHT / 2,
          borderWidth: 1,
          borderColor: palette.tabEdge,
          backgroundColor: palette.tabBar,
          flexDirection: 'row',
          boxShadow:
            tone === 'dark'
              ? '0px 12px 32px rgba(0, 0, 0, 0.45)'
              : '0px 12px 30px rgba(21, 21, 21, 0.12)',
        }}>
        {index >= 0 && width > 0 ? (
          <Animated.View
            testID="tab-lens"
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 6,
                start: 0,
                width: LENS_WIDTH,
                height: 50,
                borderRadius: 25,
                backgroundColor: palette.tabLens,
              },
              lensStyle,
            ]}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            start: 40,
            end: 40,
            top: 22,
            height: 1,
            backgroundColor: palette.tabThread,
          }}
        />
        {TAB_IDS.map((id) => {
          const selected = id === active;
          const dot = id === 'note' && unread && !selected;
          const label = t(`tabs.${id}`);
          return (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={dot ? `${label}${t('unreadNoteSuffix')}` : label}
              onPress={() => onSelect(id)}
              style={{ flex: 1, height: 62, paddingTop: 15, alignItems: 'center' }}>
              <View
                style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  testID={dot ? 'tab-note-unread' : undefined}
                  style={{
                    width: selected ? 12 : 8,
                    height: selected ? 12 : 8,
                    borderRadius: 6,
                    backgroundColor: selected || dot ? BURGUNDY : 'transparent',
                    borderWidth: selected || dot ? 0 : 1.25,
                    borderColor: palette.tabMuted,
                    boxShadow: selected
                      ? tone === 'dark'
                        ? `0px 0px 0px 2.5px ${palette.tabHalo}`
                        : `0px 0px 0px 2.5px ${palette.tabHalo}, 0px 0px 0px 3.5px rgba(101, 0, 28, 0.35)`
                      : dot
                        ? `0px 0px 0px 1.5px ${palette.tabRing}`
                        : undefined,
                  }}
                />
              </View>
              <Text
                numberOfLines={1}
                className={selected ? 'font-semibold' : 'font-medium'}
                style={{
                  marginTop: 7,
                  paddingHorizontal: 2,
                  color: selected ? palette.fg : palette.tabMuted,
                  fontSize: fa ? 11 : 9.5,
                  lineHeight: fa ? 17 : 14,
                  letterSpacing: fa ? 0 : 1.14,
                  textTransform: fa ? 'none' : 'uppercase',
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
