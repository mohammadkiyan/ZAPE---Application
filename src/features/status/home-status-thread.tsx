import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import type { Status } from '@/api/contracts/status';
import { useNow } from '@/features/relationship-clock/use-now';
import { HomeThread, type HomeOrbContent } from '@/features/relationship/home-thread';
import { formatRelativeTime } from '@/localization/format';
import { usePreferences } from '@/preferences/preferences';
import { useTone } from '@/theme/theme';
import { EmptyOrbMark, MoodGlyph } from './mood-glyph';
import { useStatusBoard, useStatusWaitingToSync } from './use-status-board';

/**
 * The Home thread with each person's mood in their orb: glyph, label and «شما · ۱۰ دقیقه پیش».
 * Your orb is dashed with «ثبت حال» until you set one; a status still on its way to ZAPE reads
 * "Waiting to sync". Either orb opens the Status tab. Until the board has loaded the thread
 * shows the relationship alone.
 */
export function HomeStatusThread({
  relationship,
}: {
  relationship: Pick<Relationship, 'members'>;
}) {
  const { t } = useTranslation(['status', 'common']);
  const router = useRouter();
  const { palette } = useTone();
  const locale = usePreferences((state) => state.locale);
  const board = useStatusBoard().data;
  const waiting = useStatusWaitingToSync();
  useNow();
  if (!board) return <HomeThread relationship={relationship} />;

  const separator = locale === 'fa' ? '، ' : ', ';
  const content = (
    who: string,
    status: Status | null,
    emptyLabel: string,
    emptyMark: 'plus' | 'dash',
    pending: boolean
  ): HomeOrbContent => {
    const label = status ? t(`status:moods.${status.mood}`) : emptyLabel;
    const meta = pending
      ? t('common:waitingToSync')
      : status
        ? t('status:home.meta', {
            who,
            when: formatRelativeTime(status.at, locale, { compact: true }),
          })
        : who;
    return {
      glyph: status ? (
        <MoodGlyph mood={status.mood} size={30} color={palette.fg} strokeWidth={1.2} />
      ) : (
        <EmptyOrbMark kind={emptyMark} size={22} color={palette.muted} />
      ),
      empty: !status,
      label,
      meta,
      accessibilityLabel: [`${who}: ${label}`, status || pending ? meta : undefined]
        .filter(Boolean)
        .join(separator),
    };
  };

  return (
    <HomeThread
      relationship={relationship}
      you={content(t('status:you'), board.you, t('status:home.set'), 'plus', waiting)}
      partner={content(t('status:partner'), board.partner, t('status:home.none'), 'dash', false)}
      onPressOrb={() => router.navigate('/status')}
    />
  );
}
