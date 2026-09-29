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

`check` runs Prettier, ESLint, strict TypeScript, Jest/React Native Testing Library, Expo dependency validation, Expo Doctor, and React Native Reusables Doctor. `prebuild:clean` regenerates both native projects and discards any generated native edits; `ios/` and `android/` remain ignored. JavaScript bundle export and native prebuild work on Linux. The EAS development profile can build iOS in the cloud; local iOS compilation requires macOS/Xcode. No EAS Submit, Update, or hosted CI is configured.

To add one owned UI primitive, run `pnpm dlx @react-native-reusables/cli@0.7.1 add <component> --path src/components/ui --styling-library nativewind`, then `pnpm run ui:doctor`. Do not use `add --all` or introduce a parallel component system.

## Agent setup

`AGENTS.md` is the shared project execution contract. `.claude/settings.json` enables Expo's official Claude plugin for this project. Install the official plugins once per machine with `codex plugin add expo@openai-curated` and `claude plugin install expo@claude-plugins-official`. Expo MCP login is user-scoped (`codex mcp login expo` or `/mcp` in Claude Code); no credentials belong in this repo.
