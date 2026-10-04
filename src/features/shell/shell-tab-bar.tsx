import { View } from 'react-native';
import { useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { FloatingTabBar } from './floating-tab-bar';
import { TAB_PATHS, isTabId, tabForRouteName, type TabId } from './tabs';

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', start: 0, end: 0, bottom: 0 }}>
      {children}
    </View>
  );
}

/**
 * Adapts the `(tabs)` navigator to the floating bar, drawn over the screen content. `unread`
 * comes from the layout that owns the notes feature: the shell does not know about notes.
 */
export function ShellTabBar({
  state,
  navigation,
  unread = false,
}: BottomTabBarProps & { unread?: boolean }) {
  const route = state.routes[state.index];
  const active = route ? tabForRouteName(route.name) : null;
  return (
    <Overlay>
      <FloatingTabBar
        active={active}
        unread={unread}
        onSelect={(tab) => {
          const target = state.routes.find((r) => tabForRouteName(r.name) === tab);
          if (!target) return;
          const event = navigation.emit({
            type: 'tabPress',
            target: target.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) navigation.navigate(target.name, target.params);
        }}
      />
    </Overlay>
  );
}

/**
 * Keeps the tab bar visible above secondary screens in the `(main)` stack, highlighting the
 * section the screen was opened from (its `origin` param). Renders nothing on the tabs themselves.
 */
export function SecondaryTabBarOverlay({ unread = false }: { unread?: boolean }) {
  const segments = useSegments() as string[];
  const { origin } = useGlobalSearchParams<{ origin?: string }>();
  const router = useRouter();
  const onTabs = segments.includes('(tabs)') || segments.length <= 1;
  if (onTabs) return null;
  const active: TabId = isTabId(origin) ? origin : 'home';
  return (
    <Overlay>
      <FloatingTabBar
        active={active}
        unread={unread}
        onSelect={(tab) => router.navigate(TAB_PATHS[tab])}
      />
    </Overlay>
  );
}
