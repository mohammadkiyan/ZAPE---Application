import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { BURGUNDY } from '@/theme/clock-themes';
import { Button } from '@/components/ui/button';

/** The white canvas's soft burgundy and gray glows (canvas radial gradients). */
export function OnboardingGlow({ centred = false }: { centred?: boolean }) {
  const { width } = useWindowDimensions();
  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={560}
      style={{ position: 'absolute', left: 0, top: 0 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id="ob-burgundy" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BURGUNDY} stopOpacity={0.1} />
          <Stop offset="0.7" stopColor={BURGUNDY} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="ob-gray" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#e8eced" stopOpacity={0.95} />
          <Stop offset="0.7" stopColor="#e8eced" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {centred ? (
        <Ellipse cx={width / 2} cy={168} rx={300} ry={260} fill="url(#ob-burgundy)" />
      ) : (
        <Ellipse cx={width * 0.88} cy={0} rx={320} ry={280} fill="url(#ob-burgundy)" />
      )}
      <Ellipse
        cx={centred ? width * 0.88 : 0}
        cy={centred ? 0 : 200}
        rx={centred ? 320 : 280}
        ry={centred ? 280 : 260}
        fill={centred ? 'url(#ob-burgundy)' : 'url(#ob-gray)'}
      />
    </Svg>
  );
}

/** The bottom pill action of every onboarding screen. */
export function OnboardingButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  latin = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Set a Latin face for an English label on a Persian screen. */
  latin?: boolean;
  testID?: string;
}) {
  const inactive = disabled || busy;
  return (
    <Button
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      >
      {busy ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text
          className={latin ? 'font-latin font-medium' : 'font-medium pt-2'}
          style={{ color: '#ffffff', fontSize: 16 }}>
          {label}
        </Text>
      )}
    </Button>
  );
}

/** Eyebrow, headline and supporting line at the top of a step. */
export function StepHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Text className="font-medium text-muted-foreground" style={{ fontSize: 13, lineHeight: 20 }}>
        {eyebrow}
      </Text>
      <Text
        accessibilityRole="header"
        className="font-semibold"
        style={{ marginTop: 6, fontSize: 26, lineHeight: 42 }}>
        {title}
      </Text>
      {body ? (
        <Text
          className="text-muted-foreground"
          style={{ marginTop: 8, fontSize: 16, lineHeight: 28 }}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

/** "You" and "partner" orbs, as drawn on Welcome and Ready. */
export function Orb({ kind }: { kind: 'you' | 'partner' }) {
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(21, 21, 21, 0.18)',
        backgroundColor: '#fbfbfb',
        boxShadow: '0 10px 24px rgba(21, 21, 21, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
          right: 5,
          bottom: 5,
          borderRadius: 27,
          borderWidth: 1,
          borderColor: 'rgba(21, 21, 21, 0.08)',
        }}
      />
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path
          d={
            kind === 'you'
              ? 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.64 5.64l1.77 1.77M16.6 16.6l1.77 1.77M18.36 5.64 16.6 7.4M7.4 16.6l-1.77 1.77'
              : 'M3 9c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M3 15c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0'
          }
          fill="none"
          stroke="#151515"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
