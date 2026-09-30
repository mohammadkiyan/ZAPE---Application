import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Stack, usePathname } from 'expo-router';
import '@/features/relationship/onboarding-step';
import { EntryPending } from '@/features/onboarding/entry-pending';
import { entryHref } from '@/features/onboarding/resolve-entry';
import { deferDeepLink, useEntry } from '@/features/onboarding/use-entry';
import { SecondaryTabBarOverlay } from '@/features/shell/shell-tab-bar';

export const unstable_settings = { initialRouteName: '(tabs)' };

/** Secondary screens stack above the tabs; the tab bar stays visible over them. */
export default function MainLayout() {
  const { entry, meQuery } = useEntry();
  const pathname = usePathname();
  const allowed = entry === 'main';

  useEffect(() => {
    if (!allowed && entry !== 'loading' && pathname !== '/') deferDeepLink(pathname as never);
  }, [allowed, entry, pathname]);

  if (entry === 'loading') return <EntryPending query={meQuery} />;
  if (!allowed) return <Redirect href={entryHref(entry)} />;
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <SecondaryTabBarOverlay />
    </View>
  );
}
