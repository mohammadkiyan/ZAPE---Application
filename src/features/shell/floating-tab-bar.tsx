import { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
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
import { directionForLocale } from '@/localization/locale';
const BAR_HEIGHT = 64;
const BAR_PADDING = 6;
const LENS_WIDTH = 62;
const TOP_GUTTER = 4;
// The bead and its label sit as one group centred in the lens; the thread runs through every bead.
// Home, the centre tab, is drawn a size up from the others, and so is the lens when it rests there.
const BEAD_CENTER = 21;
const BEAD_SIZES = {
  regular: { box: 14, idle: 8, selected: 12, label: 11 },
  home: { box: 18, idle: 10, selected: 15, label: 12 },
} as const;
const HOME_LENS_SCALE = 1.08;
const LABEL_GAP = 3;
const LENS_EASING = Easing.bezier(0.3, 1.35, 0.5, 1);

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
  const lensScale = active === 'home' ? HOME_LENS_SCALE : 1;
  const offset = useSharedValue(lensX);
  const scale = useSharedValue(lensScale);
  useEffect(() => {
    if (index < 0 || width === 0) return;
    const timing = { duration: 320, easing: LENS_EASING };
    offset.value = reduceMotion ? lensX : withTiming(lensX, timing);
    scale.value = reduceMotion ? lensScale : withTiming(lensScale, timing);
  }, [index, lensX, lensScale, width, reduceMotion, offset, scale]);
  const lensStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: I18nManager.isRTL ? -offset.value : offset.value },
      { scale: scale.value },
    ],
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
            top: BEAD_CENTER,
            height: 1,
            backgroundColor: palette.tabThread,
          }}
        />
        {TAB_IDS.map((id) => {
          const selected = id === active;
          const dot = id === 'note' && unread && !selected;
          const label = t(`tabs.${id}`);
          const size = id === 'home' ? BEAD_SIZES.home : BEAD_SIZES.regular;
          const bead = selected ? size.selected : size.idle;
          return (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={dot ? `${label}${t('unreadNoteSuffix')}` : label}
              onPress={() => onSelect(id)}
              style={{
                flex: 1,
                height: 62,
                paddingTop: BEAD_CENTER - size.box / 2,
                alignItems: 'center',
              }}>
              <View
                style={{
                  width: size.box,
                  height: size.box,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View
                  testID={dot ? 'tab-note-unread' : undefined}
                  style={{
                    width: bead,
                    height: bead,
                    borderRadius: bead / 2,
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
              <TabLabel
                label={label}
                fontSize={size.label}
                selected={selected}
                fa={fa}
                reduceMotion={reduceMotion}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface TabLabelProps {
  label: string;
  fontSize: number;
  selected: boolean;
  fa: boolean;
  reduceMotion: boolean;
}

/** The tab's name, centred under its bead; a newly selected label settles in with the lens. */
function TabLabel({ label, fontSize, selected, fa, reduceMotion }: TabLabelProps) {
  const { palette } = useTone();
  const settle = useSharedValue(0);
  const wasSelected = useRef(selected);
  useEffect(() => {
    if (selected && !wasSelected.current && !reduceMotion) {
      settle.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: 320, easing: LENS_EASING })
      );
    }
    wasSelected.current = selected;
  }, [selected, reduceMotion, settle]);
  const settleStyle = useAnimatedStyle(() => ({
    opacity: 1 - settle.value * 0.6,
    transform: [{ translateY: settle.value * 3 }],
  }));

  return (
    <Animated.View style={[{ alignSelf: 'stretch', marginTop: LABEL_GAP }, settleStyle]}>
      {/* The owned Text spans the column and aligns to its script's side, so centre it explicitly
          and drop the RTL top padding that would push the label past the lens. */}
      <Text
        numberOfLines={1}
        className={selected ? 'font-semibold' : 'font-medium'}
        style={{
          paddingTop: 0,
          paddingHorizontal: 2,
          textAlign: 'center',
          color: selected ? palette.fg : palette.tabMuted,
          fontSize,
          lineHeight: fontSize + (fa ? 6 : 3),
          letterSpacing: fa ? 0 : 0.1,
        }}>
        {label}
      </Text>
    </Animated.View>
  );
}
