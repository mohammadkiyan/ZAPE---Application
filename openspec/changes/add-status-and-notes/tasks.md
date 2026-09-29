# Tasks

## 1. Contracts and mock

- [ ] 1.1 Add `contracts/status.ts` and `contracts/notes.ts` with endpoints (board queries, `PUT /me/status`, `PUT /me/note`, read). Add contract tests, including a 121-grapheme note rejected by the schema.
- [ ] 1.2 Add mock handlers (today's events in the relationship zone, a new note id per save, `seenAt` reset) and the partner controls "Partner sets a status", "Partner leaves a note" and "Partner reads my note". Verify with mock tests.
- [ ] 1.3 Capture the server clock offset from response `Date` headers in the API client and use it in `formatRelative`. Verify with a unit test.

## 2. Status

- [ ] 2.1 Add mood glyphs and the fa/en catalog. Add a test that all ten moods have a glyph and both labels.
- [ ] 2.2 Build the Status tab overview (orbs, thread, relative times, action label, in-sync line, today's history list). Add render tests for both-set, unset, in-sync and empty-today.
- [ ] 2.3 Build the mood picker sheet (grid, current mark, close) and the optimistic `useSetStatus` with the 1.5 s confirmation halo. Add RNTL tests for picking, closing, and rollback on a server error.
- [ ] 2.4 Disable the action offline with the reconnect message, and render "Waiting to sync" for paused mutations. Verify with tests using mocked connectivity.

## 3. Notes

- [ ] 3.1 Add `countGraphemes` with tests for emoji, ZWJ sequences and Persian text.
- [ ] 3.2 Build the Note tab cards (partner, yours, empty states, NEW badge, edited or updated times, seen receipt) and the action label. Add render tests for each state.
- [ ] 3.3 Build the compose sheet (prefill, counter, helper, cancel, disabled save, error kept in the sheet) and the optimistic `useSaveNote` with the saved toast. Add RNTL tests for save, over-limit and a server error.
- [ ] 3.4 Implement `useMarkReadWhenVisible` and the unread selector, and wire the tab bar dot through the `(main)` layout. Add tests showing Home-only visibility keeps the note unread and 1.5 s on the Note tab marks it read.
- [ ] 3.5 Disable write and edit offline, and queue read receipts until reconnect. Verify with tests.

## 4. Home

- [ ] 4.1 Fill the Home orbs with mood glyphs, labels and meta (including the dashed unset state and "Waiting to sync"), linking to the Status tab. Add render tests.
- [ ] 4.2 Add the latest-note card (selection rule, quotes per locale, NEW badge, link to the Note tab). Add tests for "unread partner wins" and no notes.
- [ ] 4.3 Add fa/en strings for all status and note copy, and verify key parity.

## 5. Integration

- [ ] 5.1 On a dev build, use the mock partner to set a status and leave a note. Confirm Home and the tab dot update within 30 s, reading clears them and your seen receipt appears after "Partner reads my note". Toggle airplane mode during a status save and confirm "Waiting to sync" and then the retry.
- [ ] 5.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
