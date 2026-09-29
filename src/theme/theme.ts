export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(
  preference: ThemePreference,
  systemAppearance: 'light' | 'dark' | 'unspecified' | null | undefined
): ResolvedTheme {
  return preference === 'system' ? (systemAppearance === 'dark' ? 'dark' : 'light') : preference;
}
