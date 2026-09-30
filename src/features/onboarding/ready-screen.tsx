import { useEffect } from 'react';
import { Dimensions, I18nManager, Platform, ScrollView, View } from 'react-native';

// TEMP diagnostic (remove): reports Ready's layout to the dev machine.
function probe(tag: string, data: unknown) {
  if (!__DEV__) return;
  const body = JSON.stringify({ tag, data });
  console.log('[ready-probe]', body);
  for (const port of [8099, 8082, 8083, 19000, 19001, 19002]) {
    void fetch(`http://192.168.1.140:${port}/`, { method: 'POST', body }).catch(() => undefined);
  }
}
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { getApiClient } from '@/api/backend';
import { completeOnboarding } from '@/api/endpoints/auth';
import { describeError } from '@/api/errors';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ME_QUERY_KEY, useMe } from '@/features/auth/use-me';
import { Thread } from '@/features/shell/thread';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useReducedMotion } from '@/theme/motion';
import { localStepStore, useLocalStep } from './local-step';
import { OnboardingBar } from './onboarding-bar';
import { OnboardingButton, OnboardingGlow, Orb } from './onboarding-parts';
import { ONBOARDING_STEPS, type ReadySummaryRow } from './steps';
import { takeDeferredLink } from './use-entry';

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

function BurstDot({ angle, delay, reduced }: { angle: number; delay: number; reduced: boolean }) {
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) progress.value = withDelay(delay, withTiming(1, { duration: 800, easing: EASE }));
  }, [reduced, delay, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 2.5) * 0.85,
    transform: [
      { rotate: `${angle}deg` },
      { translateY: -46 * progress.value },
      { scale: 0.3 + 0.7 * progress.value },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 195 - 3.5,
          top: 96 - 3.5,
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: BURGUNDY,
        },
        style,
      ]}
    />
  );
}

function CheckBadge({ reduced }: { reduced: boolean }) {
  const scale = useSharedValue(reduced ? 1 : 0.4);
  const opacity = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(640, withTiming(1, { duration: 370 }));
    scale.value = withDelay(
      640,
      withSequence(
        withTiming(1.12, { duration: 370, easing: EASE }),
        withTiming(1, { duration: 250, easing: EASE })
      )
    );
  }, [reduced, opacity, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 165,
          top: 66,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: BURGUNDY,
          experimental_backgroundImage:
            'linear-gradient(180deg, #8a1638 0%, #65001c 60%, #5a0019 100%)',
          boxShadow: '0 0 0 6px rgba(101, 0, 28, 0.1), 0 12px 28px rgba(101, 0, 28, 0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Icon as={Check} size={28} color="#ffffff" strokeWidth={2.4} />
    </Animated.View>
  );
}

/** The two orbs joined by the thread, and the check that confirms it. Decorative. */
function Celebration() {
  const reduced = useReducedMotion();
  const youStart = I18nManager.isRTL ? 281 : 45;
  const partnerStart = I18nManager.isRTL ? 45 : 281;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 390, height: 150, alignSelf: 'center', direction: 'ltr' }}>
      <Svg width={390} height={150} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Thread
          d="M109 44C140 76 164 96 195 96C226 96 250 76 281 44"
          length={234}
          durationMs={620}
        />
      </Svg>
      <View style={{ position: 'absolute', left: youStart, top: 12 }}>
        <Orb kind="you" />
      </View>
      <View style={{ position: 'absolute', left: partnerStart, top: 12 }}>
        <Orb kind="partner" />
      </View>
      {Array.from({ length: 8 }, (_, i) => (
        <BurstDot key={i} angle={i * 45 + 22.5} delay={760 + i * 30} reduced={reduced} />
      ))}
      <CheckBadge reduced={reduced} />
    </View>
  );
}

function SummaryRow({ row, last }: { row: ReadySummaryRow; last: boolean }) {
  const chip = row.kind === 'chip';
  return (
    <View
      testID={`ready-row-${row.id}`}
      accessible
      accessibilityLabel={`${row.label}: ${row.value}`}
      style={{
        minHeight: chip ? 52 : 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(21, 21, 21, 0.08)',
      }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: chip ? 'transparent' : BURGUNDY,
          borderWidth: chip ? 1.5 : 0,
          borderStyle: 'dashed',
          borderColor: BURGUNDY,
        }}
      />
      <Text className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 22 }}>
        {row.label}
      </Text>
      <View style={{ flex: 1 }} />
      {chip ? (
        <View
          style={{
            height: 28,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: 'rgba(101, 0, 28, 0.07)',
            justifyContent: 'center',
          }}>
          <Text className="font-medium" style={{ fontSize: 13, color: BURGUNDY }}>
            {row.value}
          </Text>
        </View>
      ) : (
        <Text className="font-medium" style={{ fontSize: 14, lineHeight: 22 }}>
          {row.value}
        </Text>
      )}
    </View>
  );
}

/** Last onboarding screen: what was set up, then into Home. */
export function ReadyScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  // Step summaries get the default-namespace `t` and use prefixed keys (`relationship:…`).
  const { t: tSummary } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.locale);
  const localStep = useLocalStep();
  const me = useMe().data;

  const rows = me
    ? ONBOARDING_STEPS.flatMap(
        (step) => step.summary?.({ me, localStep, t: tSummary, locale }) ?? []
      )
    : [];
  const withDevice = rows.some((row) => row.id === 'device');

  const complete = useMutation({
    mutationFn: () => completeOnboarding(getApiClient()),
    onSuccess: async (updated) => {
      // Ready always opens Home, even if a link was deferred earlier.
      takeDeferredLink();
      await localStepStore.getState().setStep('done');
      queryClient.setQueryData(ME_QUERY_KEY, updated);
      router.replace('/');
    },
  });
  const failure = complete.error ? describeError(complete.error) : null;

  // TEMP diagnostic (remove)
  useEffect(() => {
    probe('mount', {
      window: Dimensions.get('window'),
      screen: Dimensions.get('screen'),
      insets,
      isRTL: I18nManager.isRTL,
      os: `${Platform.OS} ${Platform.Version}`,
      localStep,
      me,
      rows: rows.length,
      status: complete.status,
    });
  });

  return (
    <View
      testID="ready"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      onLayout={(e) => probe('root', e.nativeEvent.layout)}>
      <OnboardingGlow centred />
      <OnboardingBar step={5} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 24 }}
        onLayout={(e) => probe('scroll', e.nativeEvent.layout)}
        onContentSizeChange={(w, h) => probe('content', { w, h })}>
        <Celebration />
        <View style={{ marginTop: 26, paddingHorizontal: 24 }}>
          <Text
            accessibilityRole="header"
            className="text-center font-semibold"
            style={{ fontSize: 28, lineHeight: 44 }}>
            {t(withDevice ? 'onboarding:ready.headline' : 'onboarding:ready.headlinePhone')}
          </Text>
          <Text
            className="text-center text-muted-foreground"
            style={{ marginTop: 6, fontSize: 17, lineHeight: 30 }}>
            {t(withDevice ? 'onboarding:ready.subline' : 'onboarding:ready.sublinePhone')}
          </Text>
        </View>
        {rows.length > 0 ? (
          <View
            testID="ready-summary"
            accessibilityLabel={t('onboarding:ready.summary')}
            style={{
              marginTop: 24,
              marginHorizontal: 16,
              paddingVertical: 4,
              paddingHorizontal: 18,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(21, 21, 21, 0.08)',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(21, 21, 21, 0.05), 0 12px 30px rgba(21, 21, 21, 0.08)',
            }}>
            {rows.map((row, index) => (
              <SummaryRow key={row.id} row={row} last={index === rows.length - 1} />
            ))}
          </View>
        ) : null}
        {failure ? (
          <Text
            accessibilityRole="alert"
            className="text-center"
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              fontSize: 13,
              lineHeight: 22,
              color: BURGUNDY,
            }}>
            {t(`common:${failure.messageKey}`)}
          </Text>
        ) : null}
      </ScrollView>
      <View
        style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        onLayout={(e) => probe('bottom', e.nativeEvent.layout)}>
        <OnboardingButton
          testID="ready-continue"
          label={t('onboarding:ready.action')}
          busy={complete.isPending || complete.isSuccess}
          onPress={() => complete.mutate()}
        />
      </View>
    </View>
  );
}
