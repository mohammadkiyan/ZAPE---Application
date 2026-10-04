import { Tabs } from 'expo-router';
import { useHasUnreadNote } from '@/features/notes/use-note-board';
import { ShellTabBar } from '@/features/shell/shell-tab-bar';

export default function TabsLayout() {
  const unread = useHasUnreadNote();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ShellTabBar {...props} unread={unread} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="clock" />
      <Tabs.Screen name="status" />
      <Tabs.Screen name="note" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
