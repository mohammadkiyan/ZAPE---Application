import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { serverNow } from '@/api/server-clock';
import { Text } from '@/components/ui/text';
import { useNow } from '@/features/relationship-clock/use-now';
import { useRelationshipTimeZone } from '@/features/relationship-clock/zone-time';
import { usePreferences } from '@/preferences/preferences';
import { useTone } from '@/theme/theme';
import { NewBadge } from './note-screen';
import { formatNoteRecent } from './note-when';
import { latestNote } from './selectors';
import { useNoteBoard } from './use-note-board';

/**
 * The latest note on Home, in the invite card's place once the partner has joined: your
 * partner's while it is unread, otherwise whichever current note is newer. Seeing it here does
 * not mark it read; tapping it opens the Note tab, which does.
 */
export function HomeNoteCard({ relationship }: { relationship: Pick<Relationship, 'members'> }) {
  const { t } = useTranslation('notes');
  const router = useRouter();
  const { palette } = useTone();
  const locale = usePreferences((state) => state.locale);
  const timeZone = useRelationshipTimeZone();
  const latest = latestNote(useNoteBoard().data);
  useNow();
  const joined = relationship.members.some((member) => !member.isYou);
  if (!joined || !latest) return null;

  const author = t(latest.owner === 'you' ? 'home.you' : 'home.partner');
  const when = formatNoteRecent(latest.note.updatedAt, { timeZone, locale, now: serverNow(), t });
  const quote = t('home.quote', { text: latest.note.text });
  return (
    <Pressable
      testID="home-note"
      accessibilityRole="button"
      accessibilityLabel={[author, when, latest.unread ? t('new') : undefined, quote]
        .filter(Boolean)
        .join(locale === 'fa' ? '، ' : ', ')}
      accessibilityHint={t('home.open')}
      onPress={() => router.navigate('/note')}
      className="mx-4 rounded-3xl px-5 pb-5 pt-4"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <View className="flex-row items-center gap-2">
        <Text
          testID="home-note-meta"
          numberOfLines={1}
          className="flex-1 text-sm text-muted-foreground">
          <Text className="text-sm font-medium text-muted-foreground">{author}</Text>
          {` · ${when}`}
        </Text>
        {latest.unread ? <NewBadge label={t('new')} /> : null}
      </View>
      <Text
        testID="home-note-text"
        numberOfLines={2}
        style={{ marginTop: 10, fontSize: 18, lineHeight: locale === 'fa' ? 32 : 28 }}>
        {quote}
      </Text>
    </Pressable>
  );
}
