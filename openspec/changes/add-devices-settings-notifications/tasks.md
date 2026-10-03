# Tasks

## 1. Dependencies, contracts and mock

- [ ] 1.1 Add `expo-notifications`, `expo-sharing`, `expo-file-system` (and `expo-web-browser` if not already resolvable) with `pnpm exec expo install`, and add the `expo-notifications` plugin to `app.json`. Verify that `pnpm run deps:check`, `pnpm run doctor` and `pnpm run prebuild:clean` succeed.
- [ ] 1.2 Add contracts and endpoints for devices (list, pairing code issue with selected style/poll, get/patch, firmware update, restart, unpair, apply style), notification preferences, push tokens and account (patch name, exports, sessions, delete request). Add contract tests for each payload, including pending device settings, a null email and deletion-request state.
- [ ] 1.3 Add mock handlers seeded with the canvas devices (your RelTime «اتاق نشیمن» v1.5.0 online, iPhone 15, the partner's RelTime «اتاق کار» offline 3 h, the partner's phone), and the controls "RelTime enters the pairing code", "Device goes offline", "Firmware update progresses" and "Send test notification" (local). Verify with mock tests.
- [ ] 1.4 Add optional `EXPO_PUBLIC_HELP_URL` / `EXPO_PUBLIC_PRIVACY_URL` to runtime config with validation tests, and update `.env.example`.

## 2. Devices

- [ ] 2.1 Build the reusable pairing view (grouped 6-digit code, 10-minute countdown, new code, expired error, on-device steps, 2 s polling while focused, auto-advance). Add RNTL tests for expiry and auto-advance with the mock control.
- [ ] 2.2 Build the connected screen (name field 1–24 characters, theme, firmware, Wi-Fi, «تمام»). Add a test that the name persists and appears in the list.
- [ ] 2.3 Build `(main)/devices/index.tsx` (the relationship diagram with four nodes, your and partner sections, the read-only partner rows, footer note, «افزودن RelTime»). Add render tests for the online, offline and no-device states.
- [ ] 2.4 Build `(main)/devices/[deviceId].tsx` (preview dial in the device theme, status group, firmware available/updating/done with 5 s polling, display switches and brightness segment, rename, restart, detach sheet, pending markers). Add RNTL tests for the firmware flow and detach.
- [ ] 2.5 Add "Apply to" (My RelTime / This phone only, hidden without a device, disabled for locked themes) and the toasts to the Clock style panel. Add tests for both targets.

## 3. Notifications

- [ ] 3.1 Implement `src/features/notifications/push.ts` (permission request, Android channel, Expo push token with `projectId`, installation id in its own AsyncStorage key, register/update/unregister), and hook unregistering into session end. Add unit tests with mocked `expo-notifications`.
- [ ] 3.2 Implement notification routing (response listener + cold-start response → deferred deep-link queue) for every category. Add a table test mapping payload routes to screens.
- [ ] 3.3 Build `(main)/notifications.tsx` (master switch, grouped categories with defaults, always-visible in-app shared-date row, off/denied banner with open-settings, quiet hours switch, time pickers, 24-hour bar, privacy note). Add RNTL tests for master off preventing every push while the in-app request remains visible, and for persisting preferences.

## 4. Onboarding steps

- [ ] 4.1 Register the `device` step (pairing view in the onboarding frame, «RelTime ندارم», Ready summary row). Update the `resolveEntry` tests.
- [ ] 4.2 Register the `notifications` step (category list, quiet-hours line, «اجازه دادن به اعلان‌ها», «بعداً», Ready summary row). Add tests for allow and deny.

## 5. More and Account

- [ ] 5.1 Build the More tab (pair header, thread stats, pending banner, four row groups with values and tags, version footer from the build, dev-only mock marker). Add render tests for fa and en.
- [ ] 5.2 Implement the language row switch with the return-to-More reload. Add a test that `zape.return-route` is written before the reload.
- [ ] 5.3 Build `(main)/account.tsx` (profile header, account and privacy groups, editable name, authorized export with progress and share sheet, sessions list with revoke, sign out, asynchronous deletion-request explanation + «رفتن به رابطه» + confirmation). Add RNTL tests for rename, revoke, sign out and deletion request without premature erasure copy.
- [ ] 5.4 Add the Home RelTime row (owned, offline, phone-offline last sync, none → pairing). Add render tests.
- [ ] 5.5 Add fa/en strings for all device, notification and settings copy, and verify key parity.

## 6. Docs

- [ ] 6.1 Document push setup in the README (dev-client rebuild, EAS credentials kept outside the repo, testing with "Send test notification") and add the AGENTS.md gotcha about rebuilding after `expo-notifications`. Verify the documented commands run.

## 7. Integration

- [ ] 7.1 On a rebuilt dev client, pair via the mock control during onboarding and from Devices, run the firmware update, detach, apply a style to the RelTime, allow notifications, send a test notification and tap it, and confirm routing to the target screen.
- [ ] 7.2 Run `pnpm run check`, both bundle exports and `pnpm run prebuild:clean`, and confirm they pass.
- [ ] 7.3 Against ZAPE's local `add-mobile-app-devices-and-settings` gateway and device simulator, verify owner-only commands, pending offline settings, installation-scoped push removal, quiet hours and deletion-request payloads parse the app contracts.
