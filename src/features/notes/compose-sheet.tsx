import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NOTE_MAX_GRAPHEMES, isValidNoteText } from '@/api/contracts/notes';
import type { UserFacingError } from '@/api/errors';
import { Text } from '@/components/ui/text';
import { localizeDigits } from '@/localization/format';
import { countGraphemes } from '@/localization/graphemes';
import { directionForLocale } from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { fontFamilyForClass } from '@/theme/fonts';
import { useTone } from '@/theme/theme';

export interface ComposeSheetProps {
  visible: boolean;
  /** The text being written. The screen owns it, so it survives a failed save. */
  draft: string;
  onChangeDraft(draft: string): void;
  /** A save is on its way: the buttons wait for it. */
  saving: boolean;
  /** Why the last save failed. The sheet stays open with the draft so it can be sent again. */
  error: UserFacingError | null;
  onSave(text: string): void;
  onCancel(): void;
}

/**
 * The note compose sheet: a multiline field, a live «n / ۱۲۰» counter that counts an emoji as
 * one character, and Cancel / Save. Save is off while the trimmed draft is empty or over the
 * limit.
 */
export function ComposeSheet({
  visible,
  draft,
  onChangeDraft,
  saving,
  error,
  onSave,
  onCancel,
}: ComposeSheetProps) {
  const { t } = useTranslation(['notes', 'common']);
  const { palette } = useTone();
  const insets = useSafeAreaInsets();
  const locale = usePreferences((state) => state.locale);

  const count = countGraphemes(draft.trim());
  const over = count > NOTE_MAX_GRAPHEMES;
  const canSave = isValidNoteText(draft) && !saving;
  const counter = t('notes:compose.counter', {
    count: localizeDigits(count, locale),
    max: localizeDigits(NOTE_MAX_GRAPHEMES, locale),
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        testID="note-compose"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          paddingTop: 20,
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          gap: 12,
        }}>
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-sm font-medium text-muted-foreground">
            {t('notes:yourNote')}
          </Text>
          <View
            style={{
              height: 24,
              paddingHorizontal: 10,
              borderRadius: 12,
              justifyContent: 'center',
              backgroundColor: palette.off,
            }}>
            <Text
              testID="note-counter"
              accessibilityLiveRegion="polite"
              className={over ? 'font-semibold' : undefined}
              style={{
                paddingTop: 0,
                fontSize: 12,
                lineHeight: 16,
                // Emphasis by weight and ink, not burgundy: burgundy is never text on dark.
                color: count >= NOTE_MAX_GRAPHEMES ? palette.fg : palette.muted,
              }}>
              {counter}
            </Text>
          </View>
        </View>
        <TextInput
          testID="note-input"
          accessibilityLabel={t('notes:yourNote')}
          value={draft}
          onChangeText={onChangeDraft}
          multiline
          autoFocus
          textAlignVertical="top"
          selectionColor={BURGUNDY}
          style={{
            height: 168,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: over ? palette.fg : palette.glassEdge,
            backgroundColor: palette.glass,
            color: palette.fg,
            fontFamily: fontFamilyForClass('', locale),
            fontSize: 20,
            lineHeight: locale === 'fa' ? 34 : 30,
            writingDirection: directionForLocale(locale),
          }}
        />
        <Text className="text-sm leading-6 text-muted-foreground">{t('notes:compose.helper')}</Text>
        {error ? (
          <Text
            testID="note-compose-error"
            accessibilityRole="alert"
            className="text-sm"
            style={{ color: palette.fg }}>
            {t(`common:${error.messageKey}`)}
          </Text>
        ) : null}
        <View className="flex-row gap-2.5" style={{ marginTop: 6 }}>
          <Pressable
            testID="note-cancel"
            accessibilityRole="button"
            onPress={onCancel}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.glassEdge,
              backgroundColor: palette.off,
            }}>
            <Text className="font-medium" style={{ paddingTop: 0, textAlign: 'center' }}>
              {t('notes:compose.cancel')}
            </Text>
          </Pressable>
          <Pressable
            testID="note-save"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave, busy: saving }}
            disabled={!canSave}
            onPress={() => onSave(draft.trim())}
            style={{
              flex: 1.4,
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSave ? BURGUNDY : palette.off,
            }}>
            <Text
              className="font-medium"
              style={{
                paddingTop: 0,
                textAlign: 'center',
                color: canSave ? '#ffffff' : palette.faint,
              }}>
              {t('notes:compose.save')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
