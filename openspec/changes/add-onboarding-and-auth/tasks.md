# Tasks

## 1. Contracts and mock

- [x] 1.1 Add `src/api/contracts/auth.ts` (OTP request/verify, session refresh, `Me`, `PATCH /me`, onboarding complete, sign-out) and `endpoints/auth.ts`. Add contract tests that parse sample payloads and the three OTP error codes.
- [x] 1.2 Add mock auth handlers covering fixed code `000000`, new-account detection, attempt counting, 60 s resend, 10 min expiry and token refresh. Verify with mock round-trip tests, including `otp_attempts_exceeded` after 5 failures.

## 2. Session

- [x] 2.1 Implement `src/features/auth/session-store.ts` with SecureStore key `zape.session`, and hydrate it in `AppHydrationGate` before the splash hides. Verify with tests that the token is written only through `secureValueStore` and never through AsyncStorage.
- [x] 2.2 Fill `src/api/session.ts#getAuthorization`, add the single-flight refresh on `try_refresh_token`, and wire the foundation's unauthorized hook to `signOutLocally()`, which clears the credential, `queryClient.clear()` and the local onboarding step. Verify with tests that an expired access token is refreshed and retried, and that a 401 leaves no cached `me` data.

## 3. Entry routing

- [x] 3.1 Implement `ONBOARDING_STEPS` registration and the pure `resolveEntry()`. Add table-driven tests for signed-out, new account without name, no relationship, completed onboarding and a mid-flow reload.
- [x] 3.2 Redirect in `src/app/_layout.tsx` and `(main)/_layout.tsx` using `resolveEntry`, and defer deep links until the gate resolves. Verify with an expo-router integration test that a signed-out user opening `/note` sees Welcome.

## 4. Onboarding screens

- [x] 4.1 Build `src/features/onboarding/onboarding-bar.tsx` from the canvas `ObBar` part (Back, 4-node progress thread, skip or brand mark, accessibility label). Add render tests for steps 1, 2 and 5.
- [x] 4.2 Build the Welcome screen (wordmark, thread-and-orbs illustration with the `TimeDial` part, headline, language radio group) with deferred persist and direction reload. Verify with render tests for fa/en selection and a test that `zape.onboarding.step` is written before the reload.
- [x] 4.3 Build the Account step (phone field with normalization and validation, code stage with six boxes, the resend countdown, «تغییر شماره», and error messages). Add RNTL tests for paste, Persian-digit input, a wrong code and the cooldown.
- [x] 4.4 Build the display-name prompt shown only for `isNewAccount`, saving via `PATCH /me`. Verify with a test that continuing is blocked until the name is non-empty.
- [x] 4.5 Build the Ready screen from registered step summaries with the «مشاهده زمان ما» action that calls onboarding complete and replaces to the tabs. Verify with render tests with and without a device summary.
- [x] 4.6 Add fa/en strings for all onboarding and auth copy from the canvas. Verify with the key-parity test.

## 5. Integration

- [ ] 5.1 On a dev build with the mock backend, go through a fresh sign-up, the English switch reload, code `000000`, the name step, then Ready (with the Relationship step stubbed as complete). Confirm that relaunching mid-flow resumes correctly and "Expire my session" returns to Welcome.
- [ ] 5.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
