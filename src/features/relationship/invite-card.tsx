import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Text } from '@/components/ui/text';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';

/** Takes the note card's place on Home while the partner has not joined. */
export function InviteCard({ relationship }: { relationship: Pick<Relationship, 'members'> }) {
  const { t } = useTranslation('relationship');
  const router = useRouter();
  const { palette } = useTone();
  if (relationship.members.some((member) => !member.isYou)) return null;
  return (
    <View
      testID="invite-card"
      className="mx-4 gap-2 rounded-3xl p-5"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <Text className="text-base font-semibold">{t('home.inviteTitle')}</Text>
      <Text className="text-sm leading-6 text-muted-foreground">{t('home.inviteBody')}</Text>
      <Pressable
        testID="invite-resend"
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/invite', params: { origin: 'home' } })}
        className="mt-2 min-h-11 items-center justify-center self-start rounded-full px-5"
        style={{ backgroundColor: BURGUNDY }}>
        <Text className="text-sm font-medium" style={{ color: '#ffffff' }}>
          {t('home.resend')}
        </Text>
      </Pressable>
    </View>
  );
}
