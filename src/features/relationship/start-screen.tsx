import { I18nManager, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMe } from '@/features/auth/use-me';
import { OnboardingBar } from '@/features/onboarding/onboarding-bar';
import { OnboardingGlow, StepHeading } from '@/features/onboarding/onboarding-parts';
import { BURGUNDY } from '@/theme/clock-themes';

function Choice({
  title,
  hint,
  onPress,
  testID,
}: {
  title: string;
  hint: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 84,
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(21, 21, 21, 0.1)',
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 20px rgba(21, 21, 21, 0.06)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text className="font-semibold" style={{ fontSize: 16, lineHeight: 26 }}>
          {title}
        </Text>
        <Text className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 22 }}>
          {hint}
        </Text>
      </View>
      <Icon
        as={I18nManager.isRTL ? ChevronLeft : ChevronRight}
        size={20}
        className="text-muted-foreground"
      />
    </Pressable>
  );
}

/** Onboarding step 2: «رابطه‌تان را آغاز کنید.» — create a relationship or join one. */
export function StartRelationshipScreen() {
  const { t } = useTranslation('relationship');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ended = useMe().data?.relationship;
  const endedNotice =
    ended?.status === 'ended'
      ? t(ended.endedBy === 'partner' ? 'start.endedByPartner' : 'start.endedByYou')
      : null;

  return (
    <View
      testID="start-relationship"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <OnboardingBar step={2} />
      <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}>
        <StepHeading eyebrow={t('eyebrow')} title={t('start.title')} body={t('start.body')} />
        {endedNotice ? (
          <Text
            testID="relationship-ended-notice"
            accessibilityRole="alert"
            style={{
              marginTop: 20,
              marginHorizontal: 20,
              fontSize: 14,
              lineHeight: 24,
              color: BURGUNDY,
            }}>
            {endedNotice}
          </Text>
        ) : null}
        <View style={{ marginTop: 32, paddingHorizontal: 16, gap: 12 }}>
          <Choice
            testID="choice-create"
            title={t('start.create')}
            hint={t('start.createHint')}
            onPress={() => router.push('/start-relationship/create')}
          />
          <Choice
            testID="choice-join"
            title={t('start.join')}
            hint={t('start.joinHint')}
            onPress={() => router.push('/start-relationship/join')}
          />
        </View>
        <Text
          className="text-muted-foreground"
          style={{ marginTop: 24, marginHorizontal: 20, fontSize: 13, lineHeight: 22 }}>
          {t('start.note')}
        </Text>
      </ScrollView>
    </View>
  );
}
