# Tasks

## 1. Contracts and mock

- [x] 1.1 Add `contracts/status.ts` and `contracts/notes.ts` with endpoints (board queries, `PUT /me/status`, `PUT /me/note`, read). Preserve one `Idempotency-Key` per logical save across retries. Add contract tests for ZAPE response fixtures, a 121-grapheme note and stale `note_version_changed` reads.
- [x] 1.2 Add mock handlers (today's events in the relationship zone, a new note id per save, `seenAt` reset) and the partner controls "Partner sets a status", "Partner leaves a note" and "Partner reads my note". Verify with mock tests.
- [x] 1.3 Capture the server clock offset from response `Date` headers in the API client and use it in `formatRelative`. Verify with a unit test.

## 2. Status

- [x] 2.1 Add mood glyphs and the fa/en catalog. Add a test that all ten moods have a glyph and both labels.
- [x] 2.2 Build the Status tab overview (orbs, thread, relative times, action label, in-sync line, today's history list). Add render tests for both-set, unset, in-sync and empty-today.
- [x] 2.3 Build the mood picker sheet (grid, current mark, close) and the optimistic `useSetStatus` with the 1.5 s confirmation halo. Add RNTL tests for picking, closing, and rollback on a server error.
- [x] 2.4 Disable the action offline with the reconnect message, and render "Waiting to sync" for paused mutations. Verify with tests using mocked connectivity.

## 3. Notes

- [x] 3.1 Add `countGraphemes` with a grapheme-aware fallback and tests for emoji, ZWJ sequences and Persian text.
- [x] 3.2 Build the Note tab cards (partner, yours, empty states, NEW badge, edited or updated times, seen receipt) and the action label. Add render tests for each state.
- [x] 3.3 Build the compose sheet (prefill, counter, helper, cancel, disabled save, error kept in the sheet) and the optimistic `useSaveNote` with the saved toast. Add RNTL tests for save, over-limit and a server error.
- [x] 3.4 Implement `useMarkReadWhenVisible` and the unread selector, and wire the tab bar dot through the `(main)` layout. Add tests showing Home-only visibility keeps the note unread and 1.5 s on the Note tab marks it read.
- [x] 3.5 Disable write and edit offline, and queue read receipts until reconnect. Verify with tests.

## 4. Home

- [x] 4.1 Fill the Home orbs with mood glyphs, labels and meta (including the dashed unset state and "Waiting to sync"), linking to the Status tab. Add render tests.
- [x] 4.2 Add the latest-note card (selection rule, quotes per locale, NEW badge, link to the Note tab). Add tests for "unread partner wins" and no notes.
- [x] 4.3 Add fa/en strings for all status and note copy, and verify key parity.

## 5. Integration

- [ ] 5.1 On a dev build, use the mock partner to set a status and leave a note. Confirm Home and the tab dot update within 30 s, reading clears them and your seen receipt appears after "Partner reads my note". Toggle airplane mode during a status save and confirm "Waiting to sync" and then the retry.
- [x] 5.2 Run `pnpm run check` and both bundle exports, and confirm they pass.
- [x] 5.3 Against ZAPE's local `/api/app/v1` gateway and `add-mobile-app-status-and-notes`, verify two accounts share the same boards, a repeated save creates one version, an old queued read cannot clear a new note, and all payloads parse the app schemas. Verified 2026-10-04 against a local ZAPE gateway on :5199 and commerce on :3100, through this app's API client, endpoint functions and schemas: 38 checks passed. Two accounts saw the same boards from their own sides; a repeated save (and six concurrent sends of one key) created one version; a queued read for a replaced note returned `note_version_changed` and left the new note unread; every payload parsed the app schemas; the ended relationship returned `no_relationship`.
