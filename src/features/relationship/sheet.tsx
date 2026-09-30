import type { PropsWithChildren } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTone } from '@/theme/theme';

/** A bottom sheet over a dimmed backdrop; tapping outside closes it. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  testID,
}: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; testID?: string }>) {
  const insets = useSafeAreaInsets();
  const { palette } = useTone();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(21, 21, 21, 0.35)',
          }}
        />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={{
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: palette.bg,
            gap: 16,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: palette.border,
            }}
          />
          <Text accessibilityRole="header" className="text-center text-lg font-semibold">
            {title}
          </Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: typeof Plus;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { palette } = useTone();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.off,
      }}>
      <Icon as={icon} size={18} className="text-foreground" />
    </Pressable>
  );
}

/** A labelled value with − / + controls; a wheel substitute that works with screen readers. */
export function Stepper({
  label,
  value,
  onStep,
  increaseLabel,
  decreaseLabel,
  testID,
}: {
  label: string;
  value: string;
  onStep: (delta: 1 | -1) => void;
  increaseLabel: string;
  decreaseLabel: string;
  testID: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <StepButton
        testID={`${testID}-up`}
        icon={Plus}
        label={increaseLabel}
        onPress={() => onStep(1)}
      />
      <Text
        testID={testID}
        accessibilityLabel={`${label}: ${value}`}
        className="font-medium"
        style={{ fontSize: 20, lineHeight: 32, minWidth: 64, textAlign: 'center' }}>
        {value}
      </Text>
      <StepButton
        testID={`${testID}-down`}
        icon={Minus}
        label={decreaseLabel}
        onPress={() => onStep(-1)}
      />
    </View>
  );
}
