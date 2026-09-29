# Proposal

## Why

Every screen in the RelTime Mobile canvas assumes a signed-in person who belongs to a relationship. The canvas defines the way in as a white, device-like onboarding: Welcome & language, then a passwordless Relationship OS account, then relationship, RelTime device and notification steps, then a Ready screen. Without an account and session, none of the shared features in the later changes can exist.

## What Changes

- Add the Welcome screen: the ZAPE · RelTime wordmark, the you/partner orbs joined by the red thread around a time dial, the headline «زمان مشترک شما، همیشه پیش روی شما.», and a Persian / English language choice that persists and reloads the app when the writing direction changes.
- Add passwordless sign-in to a Relationship OS account with an email or phone number and a 6-digit one-time code. The account is created automatically if none exists. The screen has a resend countdown and a "change email" action.
- Add a display-name prompt for newly created accounts. The canvas shows the name (e.g. «محمد») on Account and Relationship but doesn't show where it is collected.
- Add a secure session: an opaque token stored in secure storage, a session gate that routes signed-out users to onboarding, and automatic sign-out on revoked or expired sessions.
- Add the onboarding frame. It has a progress bar with four steps (Account, Relationship, RelTime, Notifications), Back, an optional "later" («بعداً») skip, and resume-at-next-incomplete-step after an app restart or direction reload.
- Add the Ready screen summarising the relationship, RelTime, notifications and "Our thread" rows that apply, with «مشاهده زمان ما» into Home.
- The Relationship (create/join) and RelTime/Notifications steps are specified by `add-relationship` and `add-devices-settings-notifications`. This change defines the slots they plug into.

## Capabilities

### New Capabilities

- `account-auth`: Passwordless sign-in and sign-up, the one-time code rules, display name, session storage, the session gate and session expiry.
- `onboarding`: The Welcome/language screen, onboarding step frame and progress, resume logic, and the Ready screen.

### Modified Capabilities

(none)

## Impact

- **Code**: `src/app/(onboarding)/{welcome,sign-in,name,ready}.tsx`, `src/features/auth`, `src/features/onboarding`, `src/api/session.ts` (filled), `src/api/contracts/auth.ts`, and the mock auth handlers.
- **API contract (new)**: `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /me`, `PATCH /me`, `POST /me/onboarding/complete` and `POST /auth/sign-out`.
- **Storage**: SecureStore key `zape.session` (opaque token only). AsyncStorage key `zape.onboarding.step` for local resume.
- **Depends on**: `add-app-foundation` (navigation groups, domain API, mock backend, light onboarding tone).
