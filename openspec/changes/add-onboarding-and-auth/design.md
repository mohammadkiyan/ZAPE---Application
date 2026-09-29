# Design

## Context

`add-app-foundation` provides the following pieces:
- the `(onboarding)` route group with a forced light tone
- the domain API with mock backend
- `src/api/session.ts` as an authorization-provider stub
- the existing `secureValueStore` (SecureStore wrapper)
- `AppHydrationGate`, which already reloads on direction change

The canvas screens are `Welcome`, `SignIn` (email/code stages), the `ObBar` part (step 0–5, back and skip props) and `Ready`.

## Goals / Non-Goals

**Goals:**
- One source of truth for "where should this user be", used at launch, after sign-in and after every onboarding step.
- Onboarding steps that later changes register without touching the gate logic.

**Non-Goals:**
- Social or OAuth sign-in, passwords and account recovery beyond OTP.
- The Relationship, RelTime and Notifications step screens, which are specified in their own changes.
- The Account settings screen, sign-out UI and account deletion (`add-devices-settings-notifications`).

## Decisions

### Session store
`src/features/auth/session-store.ts` is a small Zustand store `{status: 'unknown'|'signed-out'|'signed-in', token?}`. It is hydrated from `secureValueStore.read('zape.session')` inside `AppHydrationGate`, so the splash covers the read. `src/api/session.ts#getAuthorization` returns `Bearer <token>`. Keeping the token in a Zustand store is a local-state use, not remote state. The profile itself (`GET /me`) is a TanStack Query query. Alternative: keep the token only in SecureStore and read it per request. Rejected because it adds async latency to every request and complicates the gate.

### Routing decision function
`resolveEntry({session, me, localStep})` is a pure function returning a route: `welcome | sign-in | name | <registered step> | ready | main`.
- `me` comes from `GET /me`: `{ user: {id, name, email?, phone?}, relationship: {id, status} | null, onboardingCompletedAt: string | null }`.
- The root `_layout.tsx` redirects with `<Redirect>` based on it.
- Onboarding steps are registered in an ordered array `ONBOARDING_STEPS: {id, mandatory, isComplete(me, local)}[]`. This change registers `account`. The next changes register `relationship`, `device` and `notifications`.
- Unit tests cover the full decision table.

### OTP flow
- `POST /auth/otp/request {identifier}` returns `{channel: 'email'|'sms', destination, resendAfterSec: 60, expiresInSec: 600}`.
- `POST /auth/otp/verify {identifier, code}` returns `{token, isNewAccount}`, or 400 with `code: 'otp_invalid' | 'otp_expired' | 'otp_attempts_exceeded'`.
- The identifier is classified client-side: `@` means email; otherwise it is normalized to E.164, with Iranian local numbers such as `0912…` becoming `+98912…`.
- The code field is one hidden `TextInput` with `textContentType="oneTimeCode"` / `autoComplete="sms-otp"`, rendered as six visual boxes. This gives paste and autofill for free.
- Persian digits typed on the Persian keyboard are normalized to ASCII before sending.

### Welcome language change
Selecting a language only updates local UI state until Continue. On Continue, `setLocale` persists the choice and `zape.onboarding.step = 'account'` is written first. If a direction reload happens, the gate reads that local step and opens the Account step. This avoids reloading when the user is only toggling options.

### Ready screen composition
Ready receives summary rows from each registered step's `summary(me, local)` selector. A step with no summary (skipped) contributes nothing. Leaving Ready calls `POST /me/onboarding/complete`, then `router.replace('/(main)/(tabs)')`.

### Mock backend
The mock accepts any identifier and always uses code `000000` in development. The code is shown in the dev Mock controls sheet. `isNewAccount` is true the first time an identifier is seen. There are partner controls for "Expire my session", which exercises the gate.

## Risks / Trade-offs

- **[SMS delivery in Iran is backend-dependent]** → The contract returns `channel`, so the UI copy follows whatever the backend chose. The phone path is specified but can be disabled server-side.
- **[One-time-code autofill differs across platforms]** → Always keep manual entry and paste working, and cover the input with tests for typed, pasted and Persian-digit input.
- **[Display-name step is not in the canvas]** → It is kept to one field in the same visual language. If product later drops it, the Account screen's name row still allows editing.

## Open Questions

- Exact copy for the display-name prompt and OTP error messages should be reviewed by the content owner. The specs fix the behavior, not the final wording.
