# Tasks

## 1. Contracts and mock

- [ ] 1.1 Add `contracts/occasions.ts` and `contracts/date-proposals.ts` with endpoints (server-derived occasion board, birthday, reminder prefs, create/get/approve/decline proposal). Add contract tests for ZAPE fixtures, including `proposal_exists`, `not_allowed_to_decide` and expired proposals.
- [ ] 1.2 Add mock handlers seeded with the canvas dates and an open partner wedding proposal (28 → 31 Ordibehesht), plus the partner controls "Partner proposes a wedding date change" and "Partner answers my proposal", and a dev-only "Override today" control used by the engine's clock source. Verify with mock tests that approving applies the value and declining keeps it.

## 2. Occasion engine

- [ ] 2.1 Implement `engine.ts` for unsaved editor previews and mock parity (relationship-calendar recurrence, leap fallbacks, rank ties and phase). Add table tests with canvas dates and compare its results with ZAPE's occasion fixtures; use server board values for live Home and Rel Clock.
- [ ] 2.2 Port the `OccasionMark` glyphs and the six occasion patterns into `Backdrop`, and verify with a render smoke test per mark and pattern.

## 3. Occasions screens

- [ ] 3.1 Build `(main)/occasions/index.tsx` (header, explanation, next-up card, all-occasions list with owner, years, days and pending tag, unset rows, footer, origin-aware Back). Add render tests for the pending tag and ordering.
- [ ] 3.2 Build `(main)/occasions/[id].tsx` (steppers in the relationship calendar, optional year for your birthday, fixed-date variants, reminder switches, save vs send-for-confirmation, toasts). Add RNTL tests for each ownership case and for a shared change creating a proposal.

## 4. Shared-date approval

- [ ] 4.1 Build `(main)/shared-dates/[proposalId].tsx` with pending, approved, declined and expired states (current vs proposed with weekday, effect sentence, actions only for the non-proposer while pending, history). Add render tests for all four states and the proposer view.
- [ ] 4.2 Add pending banners on More, Relationship and the occasion editor, and the «N در انتظار» tag on the More row, all linking to review. Add tests that banners clear after a decision.
- [ ] 4.3 Make the Relationship "Time together" rows editable through proposals, reusing the relationship pickers. Add a test that the clock keeps the old start until approval.

## 5. Home and Rel Clock

- [ ] 5.1 Add the Home week variant (occasion eyebrow, 7-bead countdown, pattern swap, since hidden) and the Rel Clock backdrop swap. Add render tests for the canvas "birthday in 5 days" case and for the week theme off.
- [ ] 5.2 Add the Home day variant (date line, per-occasion headline and subline, dial hidden with no tick mounted, thicker thread, note CTA opening compose, unread partner quote). Add render tests for anniversary and partner-birthday days.
- [ ] 5.3 Add the "Next up" card to the Home card row, and verify with a render test.
- [ ] 5.4 Add fa/en strings for all occasion and approval copy, and verify key parity.

## 6. Integration

- [ ] 6.1 On a dev build, approve and decline the seeded wedding proposal and confirm banners, tags and the date update. Propose a first-date change and answer it with the partner control. Set the mock "today" to 5 days before a birthday and to the anniversary, and confirm the Home phases.
- [ ] 6.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
- [ ] 6.3 Against ZAPE's local `add-mobile-app-occasions-and-shared-dates` gateway, verify both accounts and the web relationship view share the same approved date and Home phase, with the old value retained until approval.
