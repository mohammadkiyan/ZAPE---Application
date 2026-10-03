# Design

## Context

The canvas sources are:

- onboarding: `ConnectDevice`, `AllowNotifications`
- devices: `Devices`, `AddDevice` (active and expired), `DeviceConnected`, `DeviceManage` (firmware available, updating, done; unpair sheet)
- settings: `Notifications`, `More`, `MoreEn`, `Account` (delete sheet)
- the "Apply to" block in `Clock`
- the device row in `Home`

The app currently has no notifications module, no file export and no device concept. `app.json` already carries an EAS `projectId`, which Expo push tokens require. The RelTime device firmware and its pairing protocol belong to the backend and the device. The phone only shows a code and observes pairing through the API.

## Goals / Non-Goals

**Goals:**

- Server-mediated device control. The phone never talks to a RelTime directly: no BLE and no LAN.
- Notification preferences stored on the backend, so the server honors them when sending.
- The session-end path from `add-onboarding-and-auth` also unregisters push.

**Non-Goals:**

- Direct Wi-Fi provisioning of the RelTime from the phone. The canvas has the device join Wi-Fi itself.
- Local scheduling of product notifications. All product pushes are server-sent. Local notifications are used only by the dev mock.
- Help and privacy content. The rows open configured URLs.

## Decisions

### Device model and pairing

```
Device { id, kind:'reltime'|'phone', owner:'you'|'partner', name, model?, online, lastSyncAt,
         firmware?: {version, update?: {version, notes[], state:'available'|'updating'|'done', progress?}},
         display?: {dimAtNight, brightness:'auto'|'low'|'high', showSeconds}, style?: {theme, background},
         wifi?: string, isThisPhone?: boolean }
PairingCode { code: '482915', expiresAt }
```

- `POST /devices/pairing-codes` sends the phone's selected unlocked style and issues a code; ZAPE validates the style and gives it to the paired device.
- `GET /devices/pairing-codes/{code}` polls every 2 s while the pairing screen is focused, until `{state:'connected', deviceId}`.
- Phones appear as devices through their session and push registration, which gives the four-node diagram without a separate "phone pairing".

### Pending device settings

Display, style and name `PATCH`es return immediately with `pending: true` if the device is offline. The UI shows a pending marker until `lastSyncAt` passes the change time.

### Firmware progress

While a device's update state is `updating`, its device query uses a 5 s `refetchInterval`, and 30 s otherwise.

### Push

- `expo-notifications` is added with its config plugin.
- **Token**: `getExpoPushTokenAsync({ projectId })` is sent to `PUT /me/push-tokens/{installationId}`. The installation id is a random UUID kept under its own AsyncStorage key. It is an opaque identifier, not a secret, and survives a preferences reset; only the session credential uses SecureStore.
- **Permission**: on iOS, requested with alert, badge and sound. On Android 13+, POST_NOTIFICATIONS through the same API, with a default channel named «RelTime».
- **Routing**: payloads carry `{route, params}`. A listener on `addNotificationResponseReceivedListener` plus `getLastNotificationResponseAsync` on cold start feeds the session gate's deferred-deep-link queue from `add-onboarding-and-auth`.

Alternative: native FCM/APNs tokens (`getDevicePushTokenAsync`). Rejected for this change; ZAPE's matching backend change specifies a separate Expo delivery adapter and keeps credentials server-side.

### Quiet hours and preferences

`GET/PUT /me/notification-preferences` returns `{master, categories:{…}, quietHours:{enabled, from:'23:00', to:'08:00'}}`. Deferral happens in ZAPE's notification service in the relationship's time zone. A shared-date request is always visible in-app, but a disabled master switch or denied OS permission prevents its push. The client only edits and displays preferences. The time pickers reuse the relationship time picker. The 24-hour bar is an SVG.

### Settings routes and language switch

The More tab reuses `setLocale` from preferences. A direction change writes a one-shot `zape.return-route = /more` before the reload, so the gate returns there.

### Export and sessions

`POST /me/exports` returns `{id}`, polled via `GET /me/exports/{id}` until `{state:'ready', url}`. The file is downloaded with `expo-file-system` into the cache directory and shared with `expo-sharing`. Sessions come from `GET /me/sessions` and are revoked with `DELETE /me/sessions/{id}`.

### Delete account

`DELETE /me` starts ZAPE's asynchronous data-rights deletion workflow. ZAPE immediately ends the active relationship, detaches this member's RelTimes and revokes sessions, then returns a deletion-request state; actual erasure follows its cooling, dispute, shared-data and audit-retention policy. The client clears its session and returns to Welcome without claiming that server erasure is already complete.

### Help and privacy URLs

The URLs come from optional `EXPO_PUBLIC_HELP_URL` and `EXPO_PUBLIC_PRIVACY_URL`. They are public by nature, so this doesn't conflict with the no-credentials rule. They open with `expo-web-browser`, which is already transitively available through expo-router; if not, it is added via `expo install`.

## Risks / Trade-offs

- **[Push requires a development-client rebuild and platform credentials]** → Documented in the README and AGENTS.md. The mock "Send test notification" uses a local notification, so routing can be tested without credentials.
- **[Polling the pairing code every 2 s]** → Only while the pairing screen is focused, and at most 10 minutes per code.
- **[Deleting an account ends the partner's relationship too]** → Explicit in the confirmation copy from the canvas. The server notifies the partner.

## Migration Plan

This change adds native modules (`expo-notifications`, `expo-sharing`, `expo-file-system`). Rebuild the development client after landing. `pnpm run prebuild:clean` must succeed on Linux for both platforms.
