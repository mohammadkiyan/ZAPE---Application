# Design

## Context

The repo is an Expo SDK 57 foundation with the following pieces. The design source is the "RelTime Mobile" Design canvas (claude.ai artifact `af463ce6-2219-46e2-9a67-2a3b40e68909`), which carries the installed ZAPE design system (`project/ds/zape/tokens.json`).

- **Routes.** `src/app` holds a readiness route and two placeholder groups: `(auth)/welcome.tsx` and `(app)/home.tsx`.
- **Preferences.** A Zustand + AsyncStorage store holds `locale` and `theme: 'system' | 'light' | 'dark'`.
- **Locale and direction.** `AppHydrationGate` already handles the RTL reload and splash hiding.
- **API client.** A generic transport in `src/api/client.ts` with zod response parsing, a timeout, a request ID and a `getAuthorization` hook.
- **Styling.** NativeWind 4 with HSL CSS variables in `global.css` (maroon/mist/void), plus Vazirmatn, Inter and Cormorant fonts.
- **Existing dependencies.** `@react-native-community/netinfo`, `react-native-svg` and `react-native-reanimated` are installed.

The canvas's prototype (`Main.dc.html`) proves the key interaction model. There is one shared state, and picking a theme in Rel Clock restyles every tab. Each theme maps to a tone (`dark`/`light`/`gray`), and screens resolve their palette from that tone.

## Goals / Non-Goals

**Goals:**

- One navigation structure that every later change slots screens into, without reshaping routes again.
- A tone-driven palette that NativeWind classes and SVG artwork can both read.
- A mock backend good enough to build and demo every flow in the canvas, including the partner's half of two-person flows.

**Non-Goals:**

- Feature screens' content. Home, Status, Note and the rest only get skeletons here; later changes fill them.
- Locked themes and unlock rules (`add-our-thread`), and applying a style to a RelTime device (`add-devices-settings-notifications`).
- Real-time transport (WebSocket/SSE). Polling plus foreground refetch meets the 30 s freshness bar for now.

## Decisions

### Route layout

```
src/app/
  _layout.tsx                 root Stack + providers + session gate
  (onboarding)/_layout.tsx    white canvas stack (filled by add-onboarding-and-auth)
  (main)/_layout.tsx          Stack whose first screen is (tabs)
  (main)/(tabs)/_layout.tsx   Tabs with custom floating tab bar
  (main)/(tabs)/index.tsx     Home
  (main)/(tabs)/clock.tsx
  (main)/(tabs)/status.tsx
  (main)/(tabs)/note.tsx
  (main)/(tabs)/more.tsx
  (main)/<secondary>.tsx      together, occasions, relationship, … (later changes)
```

Secondary screens live in the `(main)` Stack above `(tabs)`, not inside each tab. This keeps one Back behavior. The design keeps the tab bar visible on secondary screens, so the `(main)` stack renders the shared `FloatingTabBar` as an overlay with a `highlight` derived from the route's `origin` param. Alternative: nested stacks per tab. Rejected because the canvas opens the same screens (Occasions, Our thread) from several tabs, which would duplicate routes.

The readiness screen moves to `src/app/dev/readiness.tsx`, which is registered only when `__DEV__`, and the placeholders are deleted.

### Theme model

- `src/theme/clock-themes.ts` is a pure catalog: `ThemeId`, `BackgroundId`, `THEMES: Record<ThemeId, {tone, background, dial}>` and `TONES: Record<Tone, Palette>`. The palette values are copied from the canvas's `TONES` table (bg, fg, fg2, muted, faint, border, edge, halo, well, glass).
- `src/preferences/preferences.ts` replaces `theme: ThemePreference` with `clockTheme: ThemeId` and `background: BackgroundId | 'auto'`. It keeps the same hydrate/set pattern and uses the storage keys `zape.clock-theme` and `zape.background`. The old `zape.theme` key is ignored and deleted on hydrate.
- NativeWind: the root view applies `vars()` from the active tone, so classes like `bg-background text-foreground text-muted` keep working. The `dark` class strategy is dropped, because tone is not the system appearance. SVG components (patterns, dials, thread) read the palette through a `useTone()` hook.
- The onboarding group forces the `light` tone locally, so it ignores the stored theme.
- The status bar style comes from the tone (`dark` → light content).

Alternative: three static NativeWind themes via the `dark` class plus a `gray` class. Rejected because NativeWind supports class-based variants poorly beyond dark mode. CSS variables set with `vars()` are the documented runtime-theming path.

### Design tokens and fonts

The `global.css` variables are rewritten from ZAPE tokens (`--accent: #65001c`, cool gray, black, border alphas). Only semantic names are kept, and `maroon`/`mist`/`void` are removed. Fonts become `NotoSansArabic_400Regular/500Medium/600SemiBold` and `Inter_400Regular/500Medium/600SemiBold`, loaded in `AppHydrationGate`. Tailwind's `fontFamily` becomes `{ sans: ['NotoSansArabic'], latin: ['Inter'] }`. There is a known deviation: the canvas screens use pill buttons and glass cards while the token file says "no pills". The canvas screens are the product source of truth here, so buttons follow the screens.

### Locale formatting

`src/localization/format.ts` provides `formatNumber`, `formatDate(y,m,d,{withYear})` (Jalali via `Intl.DateTimeFormat('fa-IR-u-ca-persian')`, Gregorian for `en`), `formatClock(hh,mm)` and `formatRelative(minutes, {compact})`. Hermes on SDK 57 ships `Intl` with the Persian calendar. A unit test pins known dates so a missing-ICU regression is caught. String tables move into per-feature namespaces in `src/localization/resources/{fa,en}/*.ts`.

### Domain API layer

```
src/api/
  client.ts            (existing transport)
  session.ts           getAuthorization provider (filled by add-onboarding-and-auth)
  contracts/<area>.ts  zod schemas + request/response types per feature area
  endpoints/<area>.ts  typed functions: (api) => api.request(path, {schema})
  backend.ts           selects real transport vs mock by runtime config
  mock/                in-memory router keyed by "METHOD /path", persisted to AsyncStorage (zape.mock.*)
  mock/partner-controls.ts  dev-only actions acting as the partner
```

The mock is wired as a `fetcher` passed to `createApiClient`, so it exercises the same parsing, timeout and error code paths as the real transport. Later changes add their contracts and mock handlers alongside their features.

`runtime-config.ts` gains `EXPO_PUBLIC_API_MOCK` (a boolean string) and exposes `backend: 'real' | 'mock' | 'misconfigured'`.

### Freshness and connectivity

- The TanStack Query `QueryClient` is configured with `focusManager` wired to `AppState` and `onlineManager` wired to NetInfo, which gives refetch on foreground and on reconnect.
- Queries for partner-mutable data use `refetchInterval: 30_000` and `refetchIntervalInBackground: false`.
- Mutations use `networkMode: 'online'`, so they pause while offline. The "waiting to sync" state is the paused-mutation state, rendered optimistically, with rollback on final rejection.
- `useConnectivity()` exposes `online` for banners and disabled buttons.

## Risks / Trade-offs

- **[Polling costs battery and requests]** → Poll only in the foreground and only while a screen that shows partner data is mounted. The interval is centralized, so push-triggered invalidation can replace it later.
- **[`Intl` Persian calendar missing on some Android ICU builds]** → Keep the canvas's arithmetic `j2g`/`g2j` fallback in `format.ts`, and cover it with tests against fixed dates.
- **[Removing light/dark preference is a user-visible change]** → The app has no production users yet. On hydrate, drop the old key without migration.
- **[Mock drift from the eventual real API]** → The contracts are the single source. The mock handlers import the same zod schemas and must parse their own responses in tests.

## Migration Plan

This is a greenfield app with no deployed users. Land it behind the normal `pnpm run check` and both bundle exports. Rollback is a git revert. No data migration is needed beyond deleting the stale `zape.theme` preference key.

## Resolved backend boundary

The real base URL is `https://zape.house/api/app/v1`, served by ZAPE's React Router mobile gateway. App endpoint paths remain relative to that URL. The gateway holds the native bearer-session boundary and forwards relationship domain work to the existing ZAPE services; the in-app mock is a development substitute only.
