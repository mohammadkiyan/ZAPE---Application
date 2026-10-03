# Proposal

## Why

RelTime Mobile is the companion to the RelTime desk clock. The canvas makes the device a first-class citizen: pairing by code during onboarding, a Devices overview of both partners' phones and RelTimes, per-device management (firmware, display, unpair), and applying the phone's clock style to "My RelTime". The canvas also defines a deliberately quiet notification model with personal quiet hours, and the More / Account settings that tie everything together. These are the last pieces the canvas specifies.

## What Changes

- Add RelTime pairing. The phone shows a 6-digit connection code (valid 10 minutes, with a countdown and «ساختن کد تازه») that the user enters on the RelTime. No proximity is needed, and the screen advances by itself when the device connects. This is used both in onboarding step 3 («RelTime خود را وصل کنید.», skippable with «RelTime ندارم») and from Devices («اتصال RelTime تازه»).
- Add the post-pairing "RelTime connected" screen: a device name visible to both partners, the theme, firmware and Wi-Fi, and «تمام».
- Add the Devices overview. It shows the relationship with four attached nodes (your RelTime, this phone, the partner's RelTime and the partner's phone) with online/offline and last-sync state. The partner can see your devices but can't manage or restyle them.
- Add the "Manage my RelTime" screen:
  - live preview
  - connection, Wi-Fi and last sync
  - theme
  - firmware (available → updating % → done)
  - display: dim at night 23:00–07:00, brightness auto/low/high, seconds display
  - rename, restart, and «جدا کردن از رابطه» with confirmation
- Add "Apply to" on Rel Clock: «RelTime من» / «فقط این گوشی», with «اعمال سبک».
- Add notifications:
  - onboarding step 4 with the OS permission prompt
  - a Notifications settings screen with a master switch and categories: partner status and note; thread reminder at 21:00, nudges and unlocks; occasion week and day at 09:00; shared-date requests always visible in-app; RelTime offline for more than 30 minutes, off by default
  - personal quiet hours (default 23:00–08:00) that defer delivery
  - push registration and deep links from each notification
- Add the More tab: pair summary, thread stats, pending banner, grouped rows, version footer and in-place language switch.
- Add the Account screen: name, optional email and sign-in phone, sign-in method, language, data export, signed-in devices, sign out, and a deletion request with confirmation.
- Add the Home RelTime row: «RelTime شما · اتاق نشیمن · همگام», offline state, or «اتصال RelTime · بدون دستگاه هم کار می‌کند».

## Capabilities

### New Capabilities

- `reltime-devices`: Pairing, the device overview, management, firmware updates, display settings, unpairing, and applying the phone style to your RelTime.
- `notifications`: Permission, categories, quiet hours, push registration and notification routing.
- `app-settings`: The More tab and the Account screen (profile, language, export, sessions, sign out, delete account).

### Modified Capabilities

- `onboarding` (from `add-onboarding-and-auth`): adds the RelTime (3) and Notifications (4) steps.
- `clock-themes` (from `add-app-foundation`): adds the "Apply to" target for the phone's style.
- `home-dashboard` (from `add-relationship`): adds the RelTime device row.

## Impact

- **Code**: `src/features/devices`, `src/features/notifications` and `src/features/settings`; routes `(onboarding)/{device,notifications}.tsx`, `(main)/devices/{index,add,[deviceId],connected}.tsx`, `(main)/notifications.tsx` and `(main)/account.tsx`; the More tab.
- **Dependencies**: `expo-notifications`, `expo-sharing` and `expo-file-system`, via `pnpm exec expo install`, plus the `expo-notifications` config plugin in `app.json`. Push needs a development-client rebuild.
- **API contract (new)**: devices (list, pairing code, pairing status, get/patch, firmware update, restart, unpair, apply style), notification preferences, push token registration, account (patch name, export, sessions list/revoke, delete).
- **ZAPE backend**: `add-mobile-app-devices-and-settings` owns pairing, hardware authorization and commands, Expo push delivery through ZAPE's notification service, session inventory, export and the asynchronous deletion request. The phone only presents and sends the typed gateway commands.
- **Mock**: partner and device controls "RelTime enters the pairing code", "Device goes offline", "Firmware update progresses" and "Send test notification" (local).
- **Docs**: README section on push setup (credentials stay out of the repo). AGENTS.md gets a gotcha that push requires a rebuilt dev client.
- **Depends on**: all previous changes.
