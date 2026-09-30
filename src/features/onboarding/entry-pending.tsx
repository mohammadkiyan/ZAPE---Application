import { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { describeError } from '@/api/errors';
import { ZapeLoader } from '@/components/brand/zape-loader';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ToneProvider } from '@/theme/theme';
import { holdForIdent, releaseIdentHold } from './ident-hold';

/**
 * What the gate shows while it cannot decide yet: the ZAPE ident while `GET /me` loads,
 * or the error with a retry when it failed (e.g. first launch offline). Like onboarding it sits on
 * the white brand canvas, whatever clock theme is stored. The gate stays here until the ident
 * has finished building, so its motion is never cut short.
 */
export function EntryPending({
  query,
}: {
  query: Pick<UseQueryResult, 'error' | 'refetch' | 'isFetching'>;
}) {
  const { t } = useTranslation();
  const failure = query.error && !query.isFetching ? describeError(query.error) : null;
  const loading = !failure;
  // A layout effect, so the hold is taken before the loader's own effects can report back.
  useLayoutEffect(() => {
    if (!loading) return;
    holdForIdent();
    return releaseIdentHold;
  }, [loading]);
  return (
    <ToneProvider tone="light">
      <View
        testID="entry-pending"
        className="flex-1 items-center justify-center gap-4 bg-background px-8">
        {failure ? (
          <>
            <Text accessibilityRole="alert" className="text-center leading-7 text-muted-foreground">
              {t(failure.messageKey)}
            </Text>
            {failure.retryable ? (
              <Button variant="outline" onPress={() => void query.refetch()}>
                <Text>{t('retry')}</Text>
              </Button>
            ) : null}
          </>
        ) : (
          <ZapeLoader testID="entry-loader" label={t('loading')} onBuilt={releaseIdentHold} />
        )}
      </View>
    </ToneProvider>
  );
}
