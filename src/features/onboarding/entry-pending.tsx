import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { describeError } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * What the gate shows while it cannot decide yet: an empty canvas while `GET /me` loads,
 * or the error with a retry when it failed (e.g. first launch offline).
 */
export function EntryPending({
  query,
}: {
  query: Pick<UseQueryResult, 'error' | 'refetch' | 'isFetching'>;
}) {
  const { t } = useTranslation();
  const failure = query.error && !query.isFetching ? describeError(query.error) : null;
  return (
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
      ) : null}
    </View>
  );
}
