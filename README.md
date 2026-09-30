# ZAPE Native

Mobile-only Expo app for ZAPE RelTime on iOS and Android. The app frame is in place: five tabs, clock themes, locale formatting and a typed API layer with a development mock backend. Feature screens are filled in by the OpenSpec changes under `openspec/changes`.

## Getting started

Use Node 22.22.3 and pnpm 9.15.9. For a local Android build, install a JDK and Android SDK; for iOS, use macOS with Xcode. A physical device or simulator needs an Expo development client—Expo Go is not the target runtime.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start
```

With a configured native toolchain, run `pnpm android` or `pnpm ios` in another terminal to compile and launch the development client. Rebuild it after adding a native dependency. On Linux, `pnpm ios` cannot compile; use a macOS/Xcode machine. Android compilation also needs a JDK and Android SDK.

## Live changes on a physical iPhone

The App Store version of Expo Go cannot run this SDK 57 project. Install a ZAPE development build once, then use Metro for live JavaScript changes. This route requires an active Apple Developer Program membership; EAS builds the iOS app in the cloud, so a Mac is not required.

1. Register the iPhone and follow the Apple sign-in and device-profile prompts:

   ```bash
   pnpm dlx eas-cli@latest device:create
   ```

2. Build the development client, then open the resulting installation link on the registered iPhone. Enable iOS Developer Mode if prompted.

   ```bash
   pnpm dlx eas-cli@latest build --platform ios --profile development
   ```

3. With the iPhone and computer on the same Wi-Fi, start Metro and scan its QR code with the installed **ZAPE** app, not Expo Go:

   ```bash
   pnpm start
   ```

If the phone cannot reach the computer over Wi-Fi, install Expo's tunnel helper once and start Metro through a tunnel instead:

```bash
npm install --global @expo/ngrok@^4.1.0
pnpm exec expo start --dev-client --tunnel --clear
```

Keep Metro running to see JavaScript edits refresh on the phone. Rebuild only when native dependencies or native configuration change. EAS is linked to the `@kiyanof/zape` project; keep Apple credentials and signing files out of this repository. Keep internal build installation links private, because anyone with a link may be able to open it.

## Configuration

Public settings live in `.env` (copy `.env.example`). `EXPO_PUBLIC_*` variables are embedded in the app bundle: never put credentials there.

| Variable                   | Values                                | Effect                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_BASE_URL` | credential-free HTTP(S) URL, optional | The Relationship OS mobile gateway, served by the ZAPE web app under `/api/app/v1` (production: `https://zape.house/api/app/v1`). For local development use `http://localhost:5173/api/app/v1`: development builds replace a `localhost`/`127.0.0.1` host with the host Metro serves from, so a phone, emulator or simulator on the same network reaches the ZAPE web dev server. Release builds use the URL as written. |
| `EXPO_PUBLIC_API_MOCK`     | `true` / `false`, optional            | `true` forces the in-app mock backend in development builds.                                                                                                                                                                                                                                                                                                                                                             |

`src/config/runtime-config.ts` validates these values and resolves the backend:

- **real**: a base URL is set and the mock is not requested.
- **mock**: a development build with `EXPO_PUBLIC_API_MOCK=true` or no base URL. The More tab footer shows a "Mock data" marker that opens the dev-only Mock controls sheet: partner actions and a reset to the design-canvas seed. Mock state persists in AsyncStorage under `zape.mock.*`.
- **misconfigured**: a release build without a base URL. The app shows a configuration error and makes no domain calls; the mock never ships.

## Architecture

- `src/app` contains Expo Router routes only. `(main)/(tabs)` holds the five tabs (Home, Rel Clock, Status, Note, More) behind a floating tab bar. Secondary screens go directly in `(main)/`, open above the tabs with an `origin` param, and keep the tab bar visible. `(onboarding)` is the signed-out entry on the light tone. `dev/readiness` and `dev/mock-controls` are registered only in development builds.
- `src/features` owns product behavior: `shell` (tab bar, screen scaffolds, connectivity UI), `clock-themes` (backgrounds, theme thumbnails, the Clock style panel) and `development` (readiness and mock tools). Core modules (`api`, `config`, `localization`, `preferences`, `providers`, `storage`, `theme`) never import features.
- `src/api` layers domain calls on the generic transport in `client.ts`: zod `contracts/`, typed `endpoints/`, `backend.ts` (real or mock transport; a 401 clears the session through `session.ts`), `mock/` (router-backed `fetcher`, seed, partner controls), `errors.ts` (localized error messages) and `query-client.ts` (refetch on foreground and reconnect, 30-second partner-data polling, writes paused while offline).
- `src/components/ui` contains the selected React Native Reusables primitives plus their generated icon helper. Their source belongs to this repo.
- TanStack Query owns remote state. Zustand owns only local preferences (locale, clock theme, background) in AsyncStorage; SecureStore is reserved for secrets.
- The clock theme is the app theme. Each of the ten themes maps to a `dark`, `light` or `gray` tone from the design canvas; `ToneProvider` writes the tone's palette into NativeWind CSS variables, so classes such as `bg-background text-foreground` restyle the whole app, and SVG artwork reads the same palette through `useTone()`. The ZAPE tokens are burgundy `#65001c`, white, cool gray `#e8eced` and black `#151515`. Noto Sans Arabic (Persian) and Inter (English) are bundled in weights 400/500/600 through Expo Google Fonts packages; no font is fetched at runtime. The app mark comes from ZAPE's existing favicon.

Persian (`fa`) is the default language and English (`en`) is the fallback. Strings are split into namespaces under `src/localization/resources/{fa,en}`, and `src/localization/format.ts` renders Persian digits, Jalali dates and relative times. The native writing direction is RTL for Persian and LTR for English. Selecting a locale with a different direction persists the choice, then reloads the app so native layout mirroring takes effect. Decorative motion follows the OS reduce-motion setting.

## Validation

```bash
pnpm run check
pnpm run bundle:android
pnpm run bundle:ios
pnpm run prebuild:clean
```

`check` runs Prettier, ESLint, strict TypeScript, Jest/React Native Testing Library, Expo dependency validation, Expo Doctor, and React Native Reusables Doctor. `prebuild:clean` regenerates both native projects and discards any generated native edits; `ios/` and `android/` remain ignored. JavaScript bundle export and native prebuild work on Linux. The EAS development profile can build iOS in the cloud; local iOS compilation requires macOS/Xcode. No EAS Submit, Update, or hosted CI is configured.

To add one owned UI primitive, run `pnpm dlx @react-native-reusables/cli@0.7.1 add <component> --path src/components/ui --styling-library nativewind`, then `pnpm run ui:doctor`. Do not use `add --all` or introduce a parallel component system.

## Agent setup

`AGENTS.md` is the shared project execution contract. `.claude/settings.json` enables Expo's official Claude plugin for this project. Install the official plugins once per machine with `codex plugin add expo@openai-curated` and `claude plugin install expo@claude-plugins-official`. Expo MCP login is user-scoped (`codex mcp login expo` or `/mcp` in Claude Code); no credentials belong in this repo.
