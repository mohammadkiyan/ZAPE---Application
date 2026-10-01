/** The five tabs in bar order, from the start edge; Home is the centre tab. */
export const TAB_IDS = ['clock', 'status', 'home', 'note', 'more'] as const;
export type TabId = (typeof TAB_IDS)[number];

/** Paths of the five tab routes in `src/app/(main)/(tabs)`. */
export const TAB_PATHS = {
  home: '/',
  clock: '/clock',
  status: '/status',
  note: '/note',
  more: '/more',
} as const satisfies Record<TabId, string>;

export function isTabId(value: unknown): value is TabId {
  return typeof value === 'string' && (TAB_IDS as readonly string[]).includes(value);
}

/** Maps a `(tabs)` navigator route name to its tab (`index` is Home). */
export function tabForRouteName(name: string): TabId | null {
  if (name === 'index') return 'home';
  return isTabId(name) ? name : null;
}
