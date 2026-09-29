# Tasks

## 1. Tokens, fonts and theme catalog

- [ ] 1.1 Add `@expo-google-fonts/noto-sans-arabic`, then remove the Vazirmatn and Cormorant Garamond packages with `pnpm exec expo install` / `pnpm remove`. Verify with `pnpm run deps:check`.
- [ ] 1.2 Rewrite `src/theme/global.css` variables and `tailwind.config.js` colors and fonts from the ZAPE tokens, removing maroon/mist/void and the `dark` block. Verify that `pnpm run typecheck`, `pnpm run ui:doctor` and `pnpm run bundle:android` pass.
- [ ] 1.3 Create `src/theme/clock-themes.ts` with the 10-theme and 10-background catalog, the tone palettes copied from the canvas and localized names. Add `clock-themes.test.ts` asserting every theme maps to a valid tone, background and dial.
- [ ] 1.4 Replace `src/theme/theme.ts` light/dark resolution with `useTone()` / `ToneProvider`, applying NativeWind `vars()` at the root and forcing the light tone inside onboarding. Verify with a render test that the Porcelain and Constellation tones produce different background vars.
- [ ] 1.5 Load the Noto Sans Arabic and Inter weights (400/500/600) in `AppHydrationGate`. Update `app-providers.test.tsx` so the splash still hides after fonts load.

## 2. Preferences and locale formatting

- [ ] 2.1 Change the preferences store to `clockTheme` + `background` (`'auto'` default) with keys `zape.clock-theme` / `zape.background`, deleting the legacy `zape.theme` key on hydrate. Update `preferences.test.ts` for persistence, the defaults and "picking a theme resets background to auto".
- [ ] 2.2 Add `src/localization/format.ts`: Persian digits, Jalali/Gregorian dates, clock times and relative times (full and compact), with the arithmetic Jalali fallback. Add `format.test.ts` pinning 1399-12-24 ↔ 2021-03-14, «۲ ساعت پیش», "2h ago" and "Just now".
- [ ] 2.3 Split i18n resources into `src/localization/resources/{fa,en}/` namespaces (shell, common), keeping `fa` default and `en` fallback. Verify that `locale.test.ts` and the new key-parity test (every fa key exists in en) pass.

## 3. Domain API and mock backend

- [ ] 3.1 Extend `runtime-config.ts` with `EXPO_PUBLIC_API_MOCK` and the `backend` resolution (real/mock/misconfigured). Update `runtime-config.test.ts` for all three outcomes and `.env.example` with a commented flag.
- [ ] 3.2 Add `src/api/backend.ts`, `src/api/session.ts` (an authorization provider stub returning null), and the `contracts/` and `endpoints/` folders with a `health` contract as the first example. Verify with a unit test that the client parses through the contract.
- [ ] 3.3 Implement `src/api/mock/` with a router-backed `fetcher`, AsyncStorage persistence, a canvas seed fixture and reset. Verify with tests that a mock round trip goes through `createApiClient`, and that an unknown route returns a 404 `ApiError`.
- [ ] 3.4 Add `src/api/mock/partner-controls.ts` (a registry that later changes add actions to) and a dev-only "Mock controls" sheet reachable from the More footer. Verify it is excluded when `__DEV__` is false, using a test with the flag mocked.
- [ ] 3.5 Configure the QueryClient with `focusManager` ← AppState and `onlineManager` ← NetInfo, a 30 s partner-data interval helper and online-only mutations. Add `useConnectivity()`. Verify with tests using mocked NetInfo that queries refetch on reconnect.
- [ ] 3.6 Map unauthorized responses to session clearing (the hook is wired here and the session store is filled later) and map `ApiError` codes to localized messages. Verify with unit tests for each error code.
- [ ] 3.7 Render a configuration error screen when `backend === 'misconfigured'`. Verify with a render test.

## 4. Navigation shell

- [ ] 4.1 Delete `src/app/index.tsx`, `(auth)/welcome.tsx` and `(app)/home.tsx`, and move the readiness screen to the dev-only `src/app/dev/readiness.tsx`. Verify with typed routes compiling (`pnpm run typecheck`).
- [ ] 4.2 Create the `(onboarding)` and `(main)` groups and the `(main)/(tabs)` layout with five tab routes, each rendering a titled skeleton screen. Verify with an expo-router test harness that Home is the initial tab.
- [ ] 4.3 Build `src/features/shell/floating-tab-bar.tsx` from the canvas `TabBar` part: glass bar, sliding active lens, localized labels, an unread dot input, selected state and the unread accessibility suffix. Add render tests covering the active state, the unread dot and fa/en labels.
- [ ] 4.4 Add the secondary-screen scaffold (`ScreenHeader` with a mirrored Back chevron, an origin label and a scroll container with a bottom inset for the tab bar), and render the tab bar overlay with the origin highlight on `(main)` stack screens. Verify with a render test.
- [ ] 4.5 Add the Home offline chip slot and a `useConnectivity`-driven disabled-action helper. Verify with a test toggling mocked connectivity.
- [ ] 4.6 Add `Backdrop` pattern components (10 SVG patterns ported from the canvas `Backdrop` part) and use them on the Home and Rel Clock skeletons. Verify each pattern renders in a snapshot-free smoke test.

## 5. Clock style picker

- [ ] 5.1 Build `src/features/clock-themes/clock-style-panel.tsx` with Theme/Background segments, `ThemeGlyph` thumbnails ported from the canvas, current-choice marking and immediate apply. Place it on the Rel Clock tab. Add tests that picking Mist sets tone gray and resets the background to auto.
- [ ] 5.2 Respect OS reduce-motion for decorative animation via a shared `useReducedMotion` wrapper. Verify with a test that the thread renders fully drawn when reduce motion is on.

## 6. Project rules and docs

- [ ] 6.1 Update AGENTS.md. The global theme becomes the clock-theme tone system (dark/light/gray from the canvas) with ZAPE tokens and Noto Sans Arabic + Inter. The product scope sentence points to the OpenSpec changes as the defined scope. Replace the readiness-route gotcha, and document the mock backend and `EXPO_PUBLIC_API_MOCK`. Verify by review against this change's specs.
- [ ] 6.2 Update the README Architecture and Configuration sections to match (fonts, theme model, mock backend, route groups). Verify the documented commands run as written.

## 7. Integration

- [ ] 7.1 Run `pnpm run check`, `pnpm run bundle:android` and `pnpm run bundle:ios`, and confirm all pass.
- [ ] 7.2 On a development build, switch between Constellation, Porcelain and Mist, toggle fa/en (direction reload) and toggle airplane mode. Confirm the tones, mirroring and offline chip behave as specified.
