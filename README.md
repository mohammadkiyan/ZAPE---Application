# ZAPE Native

Mobile-only Expo foundation for ZAPE on iOS and Android. It currently shows a branded development-readiness screen, not product features.

## Getting started

Use Node 22.22.3 and pnpm 9.15.9. For a local Android build, install a JDK and Android SDK; for iOS, use macOS with Xcode. A physical device or simulator needs an Expo development client—Expo Go is not the target runtime.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start
```

With a configured native toolchain, run `pnpm android` or `pnpm ios` in another terminal to compile and launch the development client. Rebuild it after adding a native dependency. On Linux, `pnpm ios` cannot compile; use a macOS/Xcode machine. Android compilation also needs a JDK and Android SDK.

## Configuration

The only public setting is `EXPO_PUBLIC_API_BASE_URL` in `.env`. It is optional for the readiness screen and must be a valid URL when present. Use `http://10.0.2.2:<port>` for an Android emulator, `http://localhost:<port>` for an iOS simulator, and your computer's reachable LAN IP or HTTPS address for a physical phone. `EXPO_PUBLIC_*` variables are embedded in the app bundle: never put credentials there.

No API domain operations or authentication token schema exist yet. `src/config/runtime-config.ts` validates public configuration; `src/api/client.ts` is a generic request transport; `src/storage/secure-value-store.ts` reserves opaque secure values.

## Architecture

- `src/app` contains Expo Router routes only. The root shows readiness; `(auth)` and `(app)` contain non-final placeholders, not final navigation.
- `src/features` owns future product behavior. Core modules (`api`, `config`, `localization`, `preferences`, `providers`, `storage`, `theme`) never import features.
- `src/components/ui` contains the ten selected React Native Reusables primitives plus their generated icon helper. Their source belongs to this repo.
- TanStack Query owns remote state. Zustand owns only local theme/locale preferences in AsyncStorage; SecureStore is reserved for secrets.
- NativeWind 4 consumes ZAPE's semantic maroon/mist/void tokens. Vazirmatn, Inter, and Cormorant Garamond are bundled as local font assets through Expo Google Fonts packages; no font is fetched at runtime. The app mark comes from ZAPE's existing favicon.

Persian (`fa`) is the default language and English (`en`) is the fallback. The native writing direction is RTL for Persian and LTR for English. Selecting a locale with a different direction persists the choice, then reloads the app so native layout mirroring takes effect. Light/dark preferences follow the system unless overridden; the cosmic-club treatment is deliberately not a global theme.

## Validation

```bash
pnpm run check
pnpm run bundle:android
pnpm run bundle:ios
pnpm run prebuild:clean
```

`check` runs Prettier, ESLint, strict TypeScript, Jest/React Native Testing Library, Expo dependency validation, Expo Doctor, and React Native Reusables Doctor. `prebuild:clean` regenerates both native projects and discards any generated native edits; `ios/` and `android/` remain ignored. JavaScript bundle export and native prebuild work on Linux, but iOS compilation requires macOS/Xcode. No EAS Build, Submit, Update, or hosted CI is configured in this phase.

To add one owned UI primitive, run `pnpm dlx @react-native-reusables/cli@0.7.1 add <component> --path src/components/ui --styling-library nativewind`, then `pnpm run ui:doctor`. Do not use `add --all` or introduce a parallel component system.

## Agent setup

`AGENTS.md` is the shared project execution contract. `.claude/settings.json` enables Expo's official Claude plugin for this project. Install the official plugins once per machine with `codex plugin add expo@openai-curated` and `claude plugin install expo@claude-plugins-official`. Expo MCP login is user-scoped (`codex mcp login expo` or `/mcp` in Claude Code); no credentials belong in this repo.
