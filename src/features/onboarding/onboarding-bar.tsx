import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { localizeDigits } from '@/localization/format';
import { directionForLocale } from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';

const INK = '#151515';

export interface OnboardingBarProps {
  /** 0 Welcome (no progress), 1–4 the current step, 5 Ready (all complete). */
  step: 0 | 1 | 2 | 3 | 4 | 5;
  onBack?: () => void;
  /** Shows «بعداً»; without it the ZAPE mark sits in that corner. */
  onSkip?: () => void;
}

type NodeState = 'done' | 'current' | 'future';

function ProgressNode({ state }: { state: NodeState }) {
  if (state === 'current') {
    // 14px node, 2px white edge and a 4px burgundy halo drawn outside its box.
    return (
      <View testID="progress-node-current" style={{ width: 14, height: 14 }}>
        <Svg width={22} height={22} style={{ position: 'absolute', left: -4, top: -4 }}>
          <Circle cx={11} cy={11} r={11} fill={BURGUNDY} fillOpacity={0.18} />
          <Circle cx={11} cy={11} r={6} fill={BURGUNDY} stroke="#ffffff" strokeWidth={2} />
        </Svg>
      </View>
    );
  }
  return (
    <Svg testID={`progress-node-${state}`} width={10} height={10}>
      {state === 'done' ? (
        <Circle cx={5} cy={5} r={5} fill={BURGUNDY} />
      ) : (
        <Circle
          cx={5}
          cy={5}
          r={4.375}
          fill="none"
          stroke={INK}
          strokeOpacity={0.4}
          strokeWidth={1.25}
          strokeDasharray={[2, 2]}
        />
      )}
    </Svg>
  );
}

/** The four-node red-thread progress of onboarding (canvas `ObBar`). */
export function OnboardingBar({ step, onBack, onSkip }: OnboardingBarProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  const locale = usePreferences((state) => state.locale);
  // From the locale, not I18nManager: the thread must start where the language reads from
  // even when the native layout direction hasn't caught up with the locale yet.
  const direction = directionForLocale(locale);
  const label =
    step >= 5
      ? t('onboarding:progress.complete')
      : t('onboarding:progress.step', { step: localizeDigits(step, locale) });
  return (
    <View
      testID="onboarding-bar"
      style={{
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        direction,
      }}>
      <View style={{ width: 88, alignItems: 'flex-start' }}>
        {onBack ? (
          <Pressable
            testID="onboarding-back"
            accessibilityRole="button"
            accessibilityLabel={t('common:back')}
            onPress={onBack}
            style={{
              width: 44,
              height: 44,
              marginStart: -4,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(21, 21, 21, 0.08)',
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(21, 21, 21, 0.08)',
            }}>
            <Icon as={direction === 'rtl' ? ChevronRight : ChevronLeft} size={20} color={INK} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {step > 0 ? (
          <View
            testID="onboarding-progress"
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
            style={{ width: 172, height: 22, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[1, 2, 3, 4].map((n) => {
              const state: NodeState =
                step >= 5 || n < step ? 'done' : n === step ? 'current' : 'future';
              const lineOn = step >= 5 || n + 1 <= step;
              return (
                <Fragment key={n}>
                  <ProgressNode state={state} />
                  {n < 4 ? (
                    <View
                      testID={lineOn ? 'progress-line-on' : 'progress-line-off'}
                      style={{
                        flex: 1,
                        height: lineOn ? 2 : 1.5,
                        borderRadius: 2,
                        backgroundColor: lineOn ? BURGUNDY : 'rgba(21, 21, 21, 0.12)',
                      }}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </View>
        ) : null}
      </View>
      <View style={{ width: 88, alignItems: 'flex-end' }}>
        {onSkip ? (
          <Pressable
            testID="onboarding-skip"
            accessibilityRole="button"
            onPress={onSkip}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              backgroundColor: 'rgba(21, 21, 21, 0.05)',
              justifyContent: 'center',
            }}>
            <Text className="text-sm font-medium">{t('onboarding:later')}</Text>
          </Pressable>
        ) : (
          <Text
            testID="onboarding-brand"
            accessibilityElementsHidden
            importantForAccessibility="no"
            className="text-right font-latin font-semibold"
            style={{ fontSize: 15, lineHeight: 20, letterSpacing: 0.3 }}>
            ZAPE
          </Text>
        )}
      </View>
    </View>
  );
}
