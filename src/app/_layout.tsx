import '@/theme/global.css';
import { Stack } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { BackendGate } from '@/features/shell/configuration-error-screen';
import { AppProviders } from '@/providers/app-providers';

export const unstable_settings = { initialRouteName: '(main)' };

export default function RootLayout() {
  return (
    <AppProviders>
      <BackendGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Protected guard={__DEV__}>
            <Stack.Screen name="dev/readiness" />
            <Stack.Screen name="dev/mock-controls" options={{ presentation: 'modal' }} />
          </Stack.Protected>
        </Stack>
      </BackendGate>
      <PortalHost />
    </AppProviders>
  );
}
