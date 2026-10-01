import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { signOut } from '@/features/auth/sign-out';

/**
 * Development builds only: signs this phone out so the auth flow can be walked again.
 * Stands in until the Account screen (add-devices-settings-notifications) owns sign-out.
 */
export function DevSignOutButton() {
  const { t } = useTranslation('shell');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  if (!__DEV__) return null;
  return (
    <Button
      testID="dev-sign-out"
      variant="outline"
      disabled={pending}
      className="mx-4"
      onPress={async () => {
        setPending(true);
        try {
          // The session gate redirects to Welcome once the session is signed out.
          await signOut(queryClient);
        } finally {
          setPending(false);
        }
      }}>
      <Text>{t('devSignOut')}</Text>
    </Button>
  );
}
