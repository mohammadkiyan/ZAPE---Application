import '@/theme/global.css';
import { Stack } from 'expo-router';
import { AppProviders } from '@/providers/app-providers';
import { PortalHost } from '@rn-primitives/portal';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </AppProviders>
  );
}
