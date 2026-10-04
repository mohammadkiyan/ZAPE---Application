import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, View, type LayoutRectangle } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { useConnectivity } from '@/api/connectivity';
import { describeError, type UserFacingError } from '@/api/errors';
import { createIdempotencyKey } from '@/api/idempotency';
import { serverNow } from '@/api/server-clock';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useNow } from '@/features/relationship-clock/use-now';
import { useRelationshipTimeZone } from '@/features/relationship-clock/zone-time';
import { useTabBarInset } from '@/features/shell/floating-tab-bar';
import { TabScreen } from '@/features/shell/tab-screen';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { ComposeSheet } from './compose-sheet';
import { formatNoteDay, formatNoteMoment } from './note-when';
import { hasUnreadPartnerNote } from './selectors';
import { useMarkReadWhenVisible } from './use-mark-read';
import { useNoteBoard, useNoteWaitingToSync } from './use-note-board';
import { useSaveNote } from './use-save-note';

/** How long «یادداشت شما ثبت شد» stays after a save. */
export const NOTE_SAVED_MS = 1500;
/** The share of the partner's card that must be inside the viewport to count as visible. */
const VISIBLE_SHARE = 0.5;

function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setActive(state === 'active')
    );
    return () => subscription.remove();
  }, []);
  return active;
}

/** The burgundy NEW pill on an unread note. */
export function NewBadge({ label }: { label: string }) {
  return (
    <View
      testID="note-new"
      className="flex-row items-center gap-1.5"
      style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: BURGUNDY }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
      <Text
        className="font-semibold"
        style={{ width: 'auto', paddingTop: 0, fontSize: 12, lineHeight: 16, color: '#ffffff' }}>
        {label}
      </Text>
    </View>
  );
}

function NoteCard({
  testID,
  title,
  badge,
  children,
}: {
  testID: string;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const { palette } = useTone();
  return (
    <View
      testID={testID}
      accessibilityLabel={title}
      className="rounded-3xl px-5 pb-5 pt-4"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-medium text-muted-foreground">{title}</Text>
        {badge}
      </View>
      {children}
    </View>
  );
}

/** The Note tab: your partner's note, yours, and the compose sheet. */
export function NoteScreen() {
  const { t } = useTranslation(['notes', 'common']);
  const { palette } = useTone();
  const locale = usePreferences((state) => state.locale);
  const { online } = useConnectivity();
  const timeZone = useRelationshipTimeZone();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const tabBarInset = useTabBarInset();
  const board = useNoteBoard().data;
  const waiting = useNoteWaitingToSync();
  const save = useSaveNote();
  useNow();
  const when = { timeZone, locale, now: serverNow(), t };

  const [composing, setComposing] = useState(false);
  /** Prefilled with your note on opening; Cancel discards it. */
  const [draft, setDraft] = useState('');
  const [composeError, setComposeError] = useState<UserFacingError | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(savedTimer.current), []);
  /** The save in hand: sending the same text again reuses its key, so ZAPE keeps one version. */
  const attempt = useRef<{ text: string; key: string } | null>(null);

  // Where the partner's card sits in the scroll content (the cards' group, then the card
  // inside it), and the window onto that content.
  const [groupY, setGroupY] = useState<number | null>(null);
  const [card, setCard] = useState<LayoutRectangle | null>(null);
  const [viewport, setViewport] = useState<{ height: number; offset: number } | null>(null);
  const onScreen = (() => {
    if (groupY === null || !card || !viewport) return false;
    const cardTop = groupY + card.y;
    const top = Math.max(cardTop, viewport.offset);
    const bottom = Math.min(cardTop + card.height, viewport.offset + viewport.height - tabBarInset);
    return bottom - top >= card.height * VISIBLE_SHARE;
  })();

  const partner = board?.partner;
  const you = board?.you;
  const unread = hasUnreadPartnerNote(board);
  // A save that lost its connection steps aside: the note shows as "waiting to sync" on the
  // card, and the sheet returns with the draft only if the retry is rejected.
  const sheetOpen = composing && !waiting;
  // Reading is looking at the card: not composing, not another tab, not a backgrounded app.
  useMarkReadWhenVisible(partner, focused && appActive && onScreen && !sheetOpen);

  const openCompose = () => {
    setDraft(you?.text ?? '');
    setComposeError(null);
    setComposing(true);
  };
  const cancel = () => {
    attempt.current = null;
    setComposeError(null);
    setComposing(false);
  };
  const submit = (text: string) => {
    if (attempt.current?.text !== text) attempt.current = { text, key: createIdempotencyKey() };
    setComposeError(null);
    save.save(
      { text, idempotencyKey: attempt.current.key },
      {
        onSuccess: () => {
          attempt.current = null;
          setComposing(false);
          setSaved(true);
          clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaved(false), NOTE_SAVED_MS);
        },
        // The sheet stays open with the draft; the board has rolled back.
        onError: (failure) => setComposeError(describeError(failure)),
      }
    );
  };

  const yourLine = you
    ? waiting
      ? t('common:waitingToSync')
      : t(you.edited ? 'notes:edited' : 'notes:updated', {
          when: formatNoteMoment(you.updatedAt, when),
        })
    : '';

  return (
    <View style={{ flex: 1 }}>
      <TabScreen
        tab="note"
        heading={false}
        scrollViewProps={{
          scrollEventThrottle: 100,
          onLayout: (event) => {
            const { height } = event.nativeEvent.layout;
            setViewport((current) => ({ height, offset: current?.offset ?? 0 }));
          },
          onScroll: (event) => {
            const { contentOffset, layoutMeasurement } = event.nativeEvent;
            setViewport({ height: layoutMeasurement.height, offset: contentOffset.y });
          },
        }}>
        <View className="gap-1.5 px-4">
          <Text className="text-sm font-medium text-muted-foreground">{t('notes:title')}</Text>
          <Text accessibilityRole="header" className="text-2xl font-medium leading-10">
            {t('notes:subtitle')}
          </Text>
        </View>

        <View
          testID="note-cards"
          className="px-4"
          onLayout={(event) => setGroupY(event.nativeEvent.layout.y)}>
          <View testID="note-partner-frame" onLayout={(event) => setCard(event.nativeEvent.layout)}>
            <NoteCard
              testID="note-partner"
              title={t('notes:partnerNote')}
              badge={unread ? <NewBadge label={t('notes:new')} /> : undefined}>
              {partner ? (
                <>
                  <Text
                    testID="note-partner-text"
                    style={{ marginTop: 14, fontSize: 22, lineHeight: locale === 'fa' ? 36 : 32 }}>
                    {partner.text}
                  </Text>
                  <Text className="text-muted-foreground" style={{ marginTop: 10, fontSize: 13 }}>
                    {formatNoteDay(partner.updatedAt, when)}
                  </Text>
                </>
              ) : (
                <Text className="text-lg text-muted-foreground" style={{ marginTop: 14 }}>
                  {t('notes:noPartnerNote')}
                </Text>
              )}
            </NoteCard>
          </View>

          {/* The thread between the two notes. */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ height: 28, marginVertical: -6, alignItems: 'center', zIndex: 1 }}>
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: BURGUNDY }} />
            <View style={{ width: 1.5, flex: 1, backgroundColor: BURGUNDY }} />
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: BURGUNDY }} />
          </View>

          <NoteCard testID="note-yours" title={t('notes:yourNote')}>
            {you ? (
              <>
                <Text
                  testID="note-yours-text"
                  style={{ marginTop: 14, fontSize: 22, lineHeight: locale === 'fa' ? 36 : 32 }}>
                  {you.text}
                </Text>
                <Text
                  testID="note-yours-when"
                  className="text-muted-foreground"
                  style={{ marginTop: 10, fontSize: 13 }}>
                  {yourLine}
                </Text>
                {you.seenAt && !waiting ? (
                  <View
                    testID="note-seen"
                    className="flex-row items-center gap-1"
                    style={{ marginTop: 2 }}>
                    <Icon as={Check} size={14} color={palette.muted} />
                    <Text
                      className="flex-1 text-muted-foreground"
                      style={{ paddingTop: 0, fontSize: 13 }}>
                      {t('notes:seen', { when: formatNoteMoment(you.seenAt, when) })}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text className="text-lg text-muted-foreground" style={{ marginTop: 14 }}>
                {t('notes:noYourNote')}
              </Text>
            )}
            <Pressable
              testID="note-action"
              accessibilityRole="button"
              accessibilityState={{ disabled: !online }}
              disabled={!online}
              onPress={openCompose}
              style={{
                marginTop: 18,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.glassEdge,
                backgroundColor: online ? palette.off : 'transparent',
              }}>
              <Text
                className="font-medium"
                style={{
                  paddingTop: 0,
                  textAlign: 'center',
                  color: online ? palette.fg : palette.faint,
                }}>
                {t(you ? 'notes:edit' : 'notes:write')}
              </Text>
            </Pressable>
            {online ? null : (
              <Text
                testID="note-offline"
                accessibilityLiveRegion="polite"
                className="text-sm text-muted-foreground"
                style={{ marginTop: 10 }}>
                {t('notes:offline')}
              </Text>
            )}
          </NoteCard>
        </View>
      </TabScreen>

      {saved ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', start: 0, end: 0, bottom: tabBarInset + 4 }}>
          <View
            testID="note-saved"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-row items-center gap-2 self-center"
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: palette.glassEdge,
              backgroundColor: palette.sheet,
            }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: BURGUNDY,
              }}>
              <Icon as={Check} size={10} color="#ffffff" />
            </View>
            <Text className="text-sm font-medium" style={{ width: 'auto', paddingTop: 0 }}>
              {t('notes:saved')}
            </Text>
          </View>
        </View>
      ) : null}

      <ComposeSheet
        visible={sheetOpen}
        draft={draft}
        onChangeDraft={setDraft}
        saving={save.isPending}
        error={composeError}
        onSave={submit}
        onCancel={cancel}
      />
    </View>
  );
}
