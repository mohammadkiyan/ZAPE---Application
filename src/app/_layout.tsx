import '@/theme/global.css';
import { Stack } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { SessionBridge } from '@/features/auth/session-bridge';
import { hydrateSession } from '@/features/auth/session-store';
import { hydrateLocalStep } from '@/features/onboarding/local-step';
import { BackendGate } from '@/features/shell/configuration-error-screen';
import { AppProviders } from '@/providers/app-providers';

export const unstable_settings = { initialRouteName: '(main)' };

const HYDRATION_TASKS = [hydrateSession, hydrateLocalStep];

export default function RootLayout() {
  return (
    <AppProviders hydrationTasks={HYDRATION_TASKS}>
      <BackendGate>
        <SessionBridge>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Protected guard={__DEV__}>
              <Stack.Screen name="dev/readiness" />
              <Stack.Screen name="dev/mock-controls" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
        </SessionBridge>
      </BackendGate>
      <PortalHost />
    </AppProviders>
  );
}
