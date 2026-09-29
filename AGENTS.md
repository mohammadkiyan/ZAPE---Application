# ZAPE native

Standalone Expo SDK 57 iOS/Android app. Use Node 22.22.3 and pnpm 9.15.9.

## Commands

- `pnpm install --frozen-lockfile` — install the checked dependency graph.
- `pnpm start` — start Metro for an Expo development client.
- `pnpm android` — compile/run a local Android development build (JDK and Android SDK required).
- `pnpm ios` — compile/run a local iOS development build (macOS and Xcode required).
- `pnpm run check` — format, lint, typecheck, Jest, Expo dependency/doctor, and Reusables checks.
- `pnpm run bundle:android && pnpm run bundle:ios` — prove both JS bundles without native toolchains.
- `pnpm run prebuild:clean` — regenerate ignored native projects; this discards generated native edits.
- `pnpm exec openspec list` — list active OpenSpec changes; propose/apply/archive via the `openspec-*` skills in `.claude/skills` and `.agents/skills`.

## Implementation rules

- Check the installed Expo major version, then use [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) before changing Expo/React Native APIs. Use `pnpm exec expo install <native-package>` for SDK-matched native dependencies.
- Expo Router routes live in `src/app` and compose navigation only. Feature behavior belongs in `src/features`; shared API, config, localization, storage, theme, providers, and owned primitives stay outside routes. Core modules must not import features.
- This is mobile-only. Do not add web routes, `react-native-web`, or a second navigation/UI system. Do not track or hand-edit `ios/` or `android/`; use app config and config plugins.
- TanStack Query owns remote state; create clients with `createQueryClient()` and spread `partnerDataRefresh` into queries for partner-mutable data. Zustand owns local preferences only. Persist locale, clock theme and background in AsyncStorage; use SecureStore only for opaque secrets. `EXPO_PUBLIC_*` values are public and must never contain credentials.
- Domain calls go through `getApiClient()` with a zod contract in `src/api/contracts` and a typed function in `src/api/endpoints`. Each contract gets a mock handler (`registerMockRoute`) that parses its own response; partner-side dev actions use `registerPartnerControl`. Development builds use the in-app mock when `EXPO_PUBLIC_API_MOCK=true` or no `EXPO_PUBLIC_API_BASE_URL` is set; release builds never do and show a configuration error instead.
- `fa` is the default locale; `en` is fallback. Preserve RTL layout and reload only when writing direction changes. Strings live in `src/localization/resources/{fa,en}/<namespace>.ts` with matching keys; format numbers, dates and relative times with `src/localization/format.ts`.
- The global theme is the clock-theme tone system: each of the ten themes in `src/theme/clock-themes.ts` maps to a `dark`, `light` or `gray` tone from the design canvas, and `ToneProvider` applies it as NativeWind CSS variables (`useTone()` for SVG). Use the ZAPE tokens (burgundy `#65001c` for the one emphasized element, never as text on the dark tone). Fonts are bundled Noto Sans Arabic (fa) and Inter (en) in 400/500/600; the owned `Text` picks the family from locale and weight. Onboarding always uses the light tone. Honour `useReducedMotion()` for decorative motion.
- React Native Reusables source is owned in `src/components/ui`. Add individual components with its CLI, never `add --all`; run `pnpm run ui:doctor` after changes.
- Product scope is defined by the OpenSpec changes in `openspec/changes` (see `pnpm exec openspec list`); build only what an active change specifies. No commerce integration or hosted CI until specified.

## Gotchas

- Expo Go cannot exercise arbitrary native modules here. Rebuild the development client after adding a native dependency.
- Linux can export both JS bundles and prebuild both platforms but cannot compile iOS; use macOS/Xcode for that proof.
- Generator demos and web dependencies are not project conventions. Routes: `(main)/(tabs)` holds the five tabs, secondary screens go in `(main)/` with an `origin` param, `(onboarding)` is the light-tone entry, and `dev/*` routes exist only when `__DEV__`.
- Jest mocks Reanimated/Worklets in `jest.setup.js` and maps `lucide-react-native` to its CJS build; `renderRouter` from `expo-router/testing-library` drives route tests. Query clients in tests need `gcTime: Infinity` or Jest will not exit.
