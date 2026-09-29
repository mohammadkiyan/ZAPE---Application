import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SecondaryTabBarOverlay } from '@/features/shell/shell-tab-bar';

export const unstable_settings = { initialRouteName: '(tabs)' };

/** Secondary screens stack above the tabs; the tab bar stays visible over them. */
export default function MainLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <SecondaryTabBarOverlay />
    </View>
  );
}
