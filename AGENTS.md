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

## Implementation rules

- Check the installed Expo major version, then use [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) before changing Expo/React Native APIs. Use `pnpm exec expo install <native-package>` for SDK-matched native dependencies.
- Expo Router routes live in `src/app` and compose navigation only. Feature behavior belongs in `src/features`; shared API, config, localization, storage, theme, providers, and owned primitives stay outside routes. Core modules must not import features.
- This is mobile-only. Do not add web routes, `react-native-web`, or a second navigation/UI system. Do not track or hand-edit `ios/` or `android/`; use app config and config plugins.
- TanStack Query owns remote state. Zustand owns local preferences only. Persist locale/theme in AsyncStorage; use SecureStore only for opaque secrets. `EXPO_PUBLIC_*` values are public and must never contain credentials.
- `fa` is the default locale; `en` is fallback. Preserve RTL layout and reload only when writing direction changes. Keep the maroon/mist/void global theme; cosmic club visuals are feature-scoped later.
- React Native Reusables source is owned in `src/components/ui`. Add individual components with its CLI, never `add --all`; run `pnpm run ui:doctor` after changes.
- Product scope is intentionally empty: no auth flow, gamification entities, commerce integration, EAS cloud config, or hosted CI until specified.

## Gotchas

- Expo Go cannot exercise arbitrary native modules here. Rebuild the development client after adding a native dependency.
- Linux can export both JS bundles and prebuild both platforms but cannot compile iOS; use macOS/Xcode for that proof.
- Generator demos and web dependencies are not project conventions. Keep the readiness route until product navigation is defined.
