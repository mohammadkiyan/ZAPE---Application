# Tasks

## 1. Contracts and mock

- [ ] 1.1 Add `contracts/thread.ts` and endpoints (thread, nudge, celebration seen). Add contract tests for every check-in state and both theme lock shapes.
- [ ] 1.2 Implement the mock thread rules (check-ins from status and note writes, turnover in the relationship zone, streak and best, one nudge per day, the 12 charm rules, theme unlocks, per-member celebrations). Add the partner controls "Partner checks in today", "Advance the mock day" and "Grant 100th note". Add mock tests for streak break, best retention and the notes100 → flap unlock.
- [ ] 1.3 Add `milestones.ts` (the next and previous 1,000-day / 10,000-hour milestone, progress). Add tests that pin the canvas example (2,000 days → 50,000 hours, 97%).

## 2. Our thread screen

- [ ] 2.1 Build `(main)/together.tsx`: the streak hero with the goal pill, the Today card with states and the «ثبت حال» action, the milestone card, and "How it works". Add render tests for the four check-in states.
- [ ] 2.2 Add the gentle nudge (optimistic, disabled «یادآوری شد», toast). Add an RNTL test that a second nudge is impossible.
- [ ] 2.3 Build the charm grid (glyphs ported from the canvas: envelope, beads, venn, occasion marks, two, star, stack, bracelet, sunrise, infinity) and the detail sheet (earned or locked with progress, left, reward). Add render tests for earned and locked charms.
- [ ] 2.4 Build the "Themes you unlock together" cards (goal or progress, unlocked "Try it on your RelTime" → Rel Clock, «N پوسته‌ی دیگر آماده‌ی استفاده است»). Add render tests.
- [ ] 2.5 Build the celebration sheet (charm and theme variants, one per foreground, seen on dismiss). Add a test that it shows once and posts seen.

## 3. Surfaces

- [ ] 3.1 Add the Home streak chip and the Our thread card with the 7-bead week (reduce-motion aware pulse), with origin-aware Back. Add render tests.
- [ ] 3.2 Add the Status bead card (normal and in-sync variants) and the Note goal card with the saved-toast count. Add render tests.
- [ ] 3.3 Add the More stats and «رشته‌ی ما» row data from the thread query. Verify with a render test.
- [ ] 3.4 Feed `lockedThemes` into the Clock style panel (lock badge, progress label, locked toast, helper text, fallback when the stored theme is locked). Add tests for the locked tap and the unlock transition.
- [ ] 3.5 Add fa/en strings for all thread copy, and verify key parity.

## 4. Integration

- [ ] 4.1 On a dev build, check in as you and as the mock partner and confirm «کامل شد» on all surfaces. Advance the day without a partner check-in and confirm the streak resets while best stays. Grant the 100th note and confirm the Split-flap celebration, then the unlocked picker thumbnail.
- [ ] 4.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
