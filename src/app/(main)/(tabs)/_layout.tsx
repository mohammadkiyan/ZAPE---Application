import { Tabs } from 'expo-router';
import { ShellTabBar } from '@/features/shell/shell-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ShellTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="clock" />
      <Tabs.Screen name="status" />
      <Tabs.Screen name="note" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
