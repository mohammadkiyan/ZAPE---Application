import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import {
  BACKGROUND_IDS,
  BACKGROUNDS,
  BURGUNDY,
  THEME_IDS,
  THEMES,
  type BackgroundId,
  type ThemeId,
} from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { Backdrop } from './backdrop';
import { GLYPH_HEIGHT, GLYPH_WIDTH, ThemeGlyph } from './theme-glyph';
import { useClockStyle } from './use-clock-style';

type Segment = 'theme' | 'background';
const TILE_GAP = 10;

interface TileProps {
  name: string;
  selected: boolean;
  onPress(): void;
  children: React.ReactNode;
  testID: string;
  onSelectedLayout?: (x: number) => void;
}

function Tile({ name, selected, onPress, children, testID, onSelectedLayout }: TileProps) {
  const { t } = useTranslation('shell');
  const { palette } = useTone();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={selected ? t('clockStyle.current', { name }) : name}
      onPress={onPress}
      onLayout={(event) => selected && onSelectedLayout?.(event.nativeEvent.layout.x)}
      style={{ width: GLYPH_WIDTH, gap: 8 }}>
      <View
        style={{
          width: GLYPH_WIDTH,
          height: GLYPH_HEIGHT,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: selected ? '0px 8px 18px rgba(0, 0, 0, 0.25)' : undefined,
        }}>
        {children}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            start: 0,
            end: 0,
            borderRadius: 16,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? palette.fg : palette.border,
          }}
        />
        {selected ? (
          <View
            testID={`${testID}-check`}
            style={{
              position: 'absolute',
              top: 6,
              end: 6,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: BURGUNDY,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 0px 0px 1.5px #ffffff',
            }}>
            <Icon as={Check} size={10} strokeWidth={3} color="#ffffff" />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        className={selected ? 'font-medium' : undefined}
        style={{ fontSize: 13, lineHeight: 18, color: selected ? palette.fg : palette.muted }}>
        {name}
      </Text>
    </Pressable>
  );
}

/**
 * The Rel Clock "Clock style" panel: Theme / Background segments with thumbnails.
 * A pick applies immediately to the whole phone and persists locally.
 */
export function ClockStylePanel() {
  const { t } = useTranslation('shell');
  const locale = usePreferences((state) => state.locale);
  const { palette } = useTone();
  const style = useClockStyle();
  const [segment, setSegment] = useState<Segment>('theme');
  const scroller = useRef<ScrollView>(null);
  const [stripWidth, setStripWidth] = useState(0);

  const revealSelected = (x: number) => {
    if (stripWidth === 0) return;
    scroller.current?.scrollTo({
      x: Math.max(0, x - (stripWidth - GLYPH_WIDTH) / 2),
      animated: false,
    });
  };

  const segments: { id: Segment; label: string }[] = [
    { id: 'theme', label: t('clockStyle.theme') },
    { id: 'background', label: t('clockStyle.background') },
  ];
  const fa = locale === 'fa';

  return (
    <View
      testID="clock-style-panel"
      accessibilityLabel={t('clockStyle.title')}
      style={{
        marginHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 22,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: palette.glassEdge,
        backgroundColor: palette.glass,
      }}>
      <Text accessibilityRole="header" className="px-4 pb-3 text-center font-medium">
        {t('clockStyle.title')}
      </Text>
      <View
        accessibilityRole="tablist"
        style={{
          alignSelf: 'center',
          flexDirection: 'row',
          padding: 4,
          gap: 4,
          borderRadius: 999,
          backgroundColor: palette.off,
        }}>
        {segments.map(({ id, label }) => {
          const selected = segment === id;
          return (
            <Pressable
              key={id}
              testID={`clock-style-${id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setSegment(id)}
              style={{
                minHeight: 44,
                paddingHorizontal: 20,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: selected ? palette.segSel : 'transparent',
              }}>
              <Text
                className="font-medium"
                style={{
                  fontSize: fa ? 14 : 12,
                  letterSpacing: fa ? 0 : 1.44,
                  textTransform: fa ? 'none' : 'uppercase',
                  color: selected ? palette.fg : palette.muted,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={
          segment === 'theme' ? t('clockStyle.themes') : t('clockStyle.backgrounds')
        }
        onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={{ gap: TILE_GAP, paddingHorizontal: 16, paddingTop: 16 }}>
        {segment === 'theme'
          ? THEME_IDS.map((id: ThemeId) => (
              <Tile
                key={id}
                testID={`theme-${id}`}
                name={THEMES[id].name[locale]}
                selected={style.theme === id}
                onSelectedLayout={revealSelected}
                onPress={() => void preferencesStore.getState().setClockTheme(id)}>
                <ThemeGlyph theme={id} />
              </Tile>
            ))
          : BACKGROUND_IDS.map((id: BackgroundId) => (
              <Tile
                key={id}
                testID={`background-${id}`}
                name={BACKGROUNDS[id].name[locale]}
                selected={style.background === id}
                onSelectedLayout={revealSelected}
                onPress={() => void preferencesStore.getState().setBackground(id)}>
                <Backdrop
                  background={id}
                  tone={style.tone}
                  width={GLYPH_WIDTH}
                  height={GLYPH_HEIGHT}
                  cx={56}
                  cy={40}
                  scale={0.3}
                  boost={2.2}
                  solid
                />
              </Tile>
            ))}
      </ScrollView>
    </View>
  );
}
