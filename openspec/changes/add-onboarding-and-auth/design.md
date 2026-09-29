# Design

## Context

`add-app-foundation` provides the following pieces:

- the `(onboarding)` route group with a forced light tone
- the domain API with mock backend
- `src/api/session.ts` as an authorization-provider stub
- the existing `secureValueStore` (SecureStore wrapper)
- `AppHydrationGate`, which already reloads on direction change

The canvas screens are `Welcome`, `SignIn` (identifier/code stages), the `ObBar` part (step 0–5, back and skip props) and `Ready`.

Production already has Relationship OS accounts. The ZAPE web app (React Router 7, `apps/web` in the ZAPE repo) hosts the SuperTokens backend SDK with the Passwordless recipe (`contactMethod: PHONE`, `USER_INPUT_CODE`) at `https://zape.house/api/auth/*`. It wraps code creation in a distributed OTP limiter (phone/device/IP budgets, SMS circuit, daily ceiling) and delivers codes through Kavenegar. The SuperTokens core runs as `supertokens:3567` on the private Docker network with no public domain and no API key.

## Goals / Non-Goals

**Goals:**

- One source of truth for "where should this user be", used at launch, after sign-in and after every onboarding step.
- Onboarding steps that later changes register without touching the gate logic.

**Non-Goals:**

- Social or OAuth sign-in, passwords and account recovery beyond OTP.
- The Relationship, RelTime and Notifications step screens, which are specified in their own changes.
- The Account settings screen, sign-out UI and account deletion (`add-devices-settings-notifications`).

## Decisions

### Production backend: the React Router app is the mobile gateway

The app never talks to the SuperTokens core. The ZAPE React Router app serves this change's contract under `https://zape.house/api/app/v1`, so a release build sets `EXPO_PUBLIC_API_BASE_URL=https://zape.house/api/app/v1`. Its handlers call the same Passwordless and Session recipe functions the website uses (`createCode`, `consumeCode`, `createNewSessionWithoutRequestResponse`, `getSessionWithoutRequestResponse`, `refreshSessionWithoutRequestResponse`), behind the same OTP limiter and Kavenegar sender.

- Alternative: expose the SuperTokens core on its own domain. Rejected. The core is an admin API (it creates users and sessions for any identifier), has no API key in production, and would bypass the OTP limiter and SMS ceiling.
- Alternative: have the app call the website's `/api/auth/*` FDI routes directly in header mode. Rejected. The app would take on SuperTokens wire details (`rid`, `st-auth-mode`, front-token headers, device IDs), and there would be no stable home for `/me` and the onboarding endpoints.
- nginx: the `zape.house` server block already proxies `/` to the web app, so `/api/app/v1/*` needs no nginx change and no new domain.
- Notifications follow the same rule, specified in `add-devices-settings-notifications`. The app registers push tokens and preferences through this gateway, which forwards to the `notifications` service. The app never holds `NOVU_SECRET_KEY` or calls `novu-api` directly.

### Session store

`src/features/auth/session-store.ts` is a small Zustand store `{status: 'unknown'|'signed-out'|'signed-in', credential?}`. The credential is the `{accessToken, refreshToken}` pair issued by the gateway. It is stored as one serialized value under SecureStore key `zape.session` and is never parsed beyond reading the two fields. It is hydrated from `secureValueStore.read('zape.session')` through an `AppHydrationGate` hydration task registered by the root layout, so the splash covers the read and core modules still don't import features. `src/api/session.ts#getAuthorization` returns `Bearer <accessToken>`. Keeping the token in a Zustand store is a local-state use, not remote state. The profile itself (`GET /me`) is a TanStack Query query. Alternative: keep the token only in SecureStore and read it per request. Rejected because it adds async latency to every request and complicates the gate.

### Session refresh and end

An access token lives about an hour and a refresh token much longer. `withSessionGuard` handles a 401 from a domain request as follows:

- If the body `code` is `try_refresh_token`, it calls the registered refresher once (single-flight across concurrent requests). The refresher sends `POST /auth/session/refresh {refreshToken}` and stores the rotated pair. On success the original request is retried once.
- A failed refresh, or any other 401, calls `clearSession()`, which the auth feature fills with `signOutLocally()`.
- `auth/*` paths are exempt from the guard, so a wrong code or failed refresh never loops.

### Routing decision function

`resolveEntry({session, me, localStep})` is a pure function returning `loading | welcome | sign-in | name | <registered step> | ready | main`.

- `me` comes from `GET /me`: `{ user: {id, name: string|null, phoneNumber: string|null, email: string|null}, relationship: {id, status} | null, onboardingCompletedAt: string | null }`.
- `(main)/_layout.tsx` redirects anything but `main` to the entry route and remembers a deep link it deferred. `(onboarding)/_layout.tsx` sends `main` to the tabs and keeps signed-out users on Welcome/Account.
- Onboarding steps are registered with `registerOnboardingStep({id, order, progress, route, mandatory, isComplete(me, local), summary?})`, and `ONBOARDING_STEPS` returns them in `order`. This change registers `account`. The next changes register `relationship`, `device` and `notifications`.
- The name prompt is part of the Account node. It is shown when the local step is `name` (written after a new-account verification) and `me.user.name` is empty.
- A signed-in launch without `me` (offline) goes to `main` when the local step is `done`, which is written once onboarding is observed complete. Otherwise it waits for `me` and offers a retry.
- Unit tests cover the full decision table.

### OTP flow

- `POST /auth/otp/request {phoneNumber}` returns `{flowId, channel: 'sms', destination, resendAfterSec: 60, expiresInSec: 600}`. Requesting again for the same number is the resend: the gateway revokes the previous codes (`revokeAllCodes`) before creating a new one. `flowId` is the gateway's opaque handle for SuperTokens' `deviceId`/`preAuthSessionId`. A 429 with `code: 'otp_rate_limited'` carries the limiter's refusal.
- `POST /auth/otp/verify {flowId, code}` returns `{session: {accessToken, refreshToken}, isNewAccount}`, or 400 with `code: 'otp_invalid' | 'otp_expired' | 'otp_attempts_exceeded'`.
- The number is normalized to E.164 exactly as the website does (`normalizePhoneNumber` in `apps/web/app/lib/authApi.ts`): Persian/Arabic digits become ASCII, separators are stripped, and Iranian local numbers such as `0912…` become `+98912…`. It must match `^\+[1-9]\d{7,14}$`.
- The code field is one hidden `TextInput` with `textContentType="oneTimeCode"` / `autoComplete="sms-otp"`, rendered as six visual boxes. This gives paste and autofill for free.
- Persian digits typed on the Persian keyboard are normalized to ASCII before sending.

### Welcome language change

Selecting a language only updates local UI state until Continue. On Continue, `setLocale` persists the choice and `zape.onboarding.step = 'account'` is written first. If a direction reload happens, the gate reads that local step and opens the Account step. This avoids reloading when the user is only toggling options.

### Ready screen composition

Ready receives summary rows from each registered step's `summary(me, local)` selector. A step with no summary (skipped) contributes nothing. Leaving Ready calls `POST /me/onboarding/complete`, then `router.replace('/(main)/(tabs)')`.

### Mock backend

The mock accepts any valid phone number and always uses code `000000` in development. The seed account `+989121234567` is the canvas's «محمد» with onboarding complete. The code is shown in the dev Mock controls sheet. `isNewAccount` is true the first time an identifier is seen. There are partner controls for "Expire my session", which exercises the gate, and "Expire my access token", which exercises refresh.

## Risks / Trade-offs

- **[SMS delivery in Iran is backend-dependent]** → The gateway reuses the website's limiter, circuit breaker and Kavenegar sender, so both clients share one SMS budget. The contract keeps `channel` so an email path can be added later without breaking the app.
- **[Code lifetime is a SuperTokens core setting]** → The core defaults to 15 minutes. The gateway reports the real `expiresInSec`, and the core's `PASSWORDLESS_CODE_LIFETIME` should be set to 600000 to meet the 10-minute rule. That also applies to the website.
- **[Two clients, one session pool]** → Mobile sessions are header-based and never touch the website's cookies. Revoking "other sessions" on the website also signs out the phone, which is intended.
- **[One-time-code autofill differs across platforms]** → Always keep manual entry and paste working, and cover the input with tests for typed, pasted and Persian-digit input.
- **[Display-name step is not in the canvas]** → It is kept to one field in the same visual language. If product later drops it, the Account screen's name row still allows editing.

## Open Questions

- Exact copy for the display-name prompt and OTP error messages should be reviewed by the content owner. The specs fix the behavior, not the final wording.
