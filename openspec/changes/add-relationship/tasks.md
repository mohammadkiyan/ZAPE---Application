# Tasks

## 1. Contracts and mock

- [x] 1.1 Add `src/api/contracts/relationship.ts` and `endpoints/relationship.ts` (create, current, invite issue, invite preview, accept, end), and extend `Me.relationship`. Add contract tests for all payloads and the error codes `invite_invalid | invite_expired | invite_used | already_in_relationship`.
- [x] 1.2 Add mock handlers with the canvas seed (RLT-4K7Q-92MD, 2021-03-14 20:00 Asia/Tehran, jalali) and the partner controls "Partner joins with the invite" and "Partner ends the relationship". Verify with mock tests for each error code.
- [x] 1.3 Add `expo-clipboard` via `pnpm exec expo install`, and verify `pnpm run deps:check`.

## 2. Relationship clock

- [x] 2.1 Implement `elapsed.ts` (wall clock in the zone, month-end clamp, year progress). Add tests for the canvas example, the Jan 31 → Mar 1 clamp, a Feb 29 start, Europe/Berlin DST and a zero duration.
- [x] 2.2 Port the `TimeDial` part to SVG with the classic, chrono and hairline variants across three tones. Add a render test per variant.
- [x] 2.3 Implement `useClockTick` (Reanimated frame callback, paused on background or blur) and the animated `hh:mm:ss.mmm` text. Verify with a test that the callback is inactive when `AppState` is background.
- [x] 2.4 Build `ClockFace` (names, thread, six dials, ms readout, since line, backdrop, accessibility summary) and place it on the Rel Clock tab above the Clock style panel. Verify with a render test that the Chronograph theme uses the chrono variant.

## 3. Home frame

- [x] 3.1 Build the Home layout with ordered slots, the wordmark header, the SVG thread (direction-aware halves, draw-in animation, dashed partner half) and the clock hero linking to Rel Clock. Add render tests for fa/en thread direction and the single-member state.
- [x] 3.2 Add the partner-not-joined orb state and the invite card with «ارسال دوباره‌ی دعوت‌نامه». Verify with a test that the card disappears when the mocked relationship becomes active.

## 4. Onboarding relationship step

- [x] 4.1 Register the `relationship` step in `ONBOARDING_STEPS` (mandatory, complete when `me.relationship?.status` is active or pending_partner as creator), with a Ready summary row «از <date>». Update `resolveEntry` tests.
- [x] 4.2 Build the create-or-join choice screen from `StartRelationship`, and verify both links with an RNTL test.
- [x] 4.3 Build the create screen with Jalali/Gregorian sheet date pickers, time picker, calendar segmented control, time-zone picker, live preview dial and future-date validation. Add tests for the calendar toggle preserving the date and for the future date being disabled.
- [x] 4.4 Build the invite screen (grouped code, share sheet, copy toast, 5 s polling for joined, «بعداً دعوت می‌کنم», «ادامه»). Add tests for the joined-state transition with the mock partner control.
- [x] 4.5 Build the join screen (normalized 8-character entry, preview card, consent line, error messages, «کد ندارم»). Add tests for lowercase input, space stripping, Persian-digit normalization and each error.

## 5. Relationship screen

- [x] 5.1 Build `(main)/relationship.tsx`: pair header, since and elapsed summary, the read-only time-together rows with the approval note, members with join dates, the invited-partner state, and the copyable ID. Add render tests for both member states.
- [x] 5.2 Add «پایان رابطه» with the confirmation sheet and ending flow, routing both users to the Relationship step. Verify with an integration test using the "Partner ends" control.
- [x] 5.3 Add fa/en strings for all relationship and clock copy, and verify key parity.

## 6. Integration

- [ ] 6.1 On a dev build, create a relationship, share the invite, use the mock partner join, and confirm Home and Rel Clock tick. Background the app for 1 minute and confirm the clock catches up. End the relationship and confirm routing.
- [ ] 6.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
