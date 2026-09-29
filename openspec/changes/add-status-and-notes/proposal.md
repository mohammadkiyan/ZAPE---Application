# Proposal

## Why

The daily heart of RelTime is two small gestures: telling your partner how you feel right now, and leaving them a short note they'll find on their phone and on the RelTime on their desk. The canvas gives both a full tab (Status, Note) and puts them at the center of Home. They are also the "check-ins" that later drive Our thread.

## What Changes

- Add shared statuses. There are ten moods, each with its own glyph: شاد Happy, آرام Calm, عاشق Loved, دلتنگ Missing you, متمرکز Focused, خسته Tired, غمگین Sad, دلخور Upset, نگران Stressed, ناخوش Unwell.
- Add the Status tab:
  - both people's current status with relative times
  - the «تغییر حال» / «ثبت حال» action opening a mood picker sheet
  - a brief «حال شما به‌روز شد» confirmation
  - an "in sync" line when both share the same mood
  - today's status history for both people
  - offline blocking
- Add shared notes. Each person has one current note of up to 120 characters (grapheme clusters, so emoji count as one). Writing again replaces it.
- Add the Note tab:
  - the partner's note with a NEW badge until read
  - your note with «آخرین تغییر» / «ویرایش شده» times and a «همراه دید · hh:mm» seen receipt
  - a compose sheet with a live counter, «انصراف» and «ثبت یادداشت»
  - offline blocking
- Add read tracking. A partner note counts as read after it has been visible on the Note tab for 1.5 seconds. That clears the Note tab dot and the Home NEW badge, and shows the author a seen receipt.
- Add to Home: the you/partner status orbs on the thread (tap → Status tab), a "waiting to sync" meta for an unsent status, and the latest-note card (tap → Note tab).

## Capabilities

### New Capabilities

- `mood-status`: The mood catalog, setting and viewing statuses, today's history and offline rules.
- `partner-notes`: One current note per person, compose rules, read tracking and seen receipts.

### Modified Capabilities

- `home-dashboard` (introduced by `add-relationship`): adds requirements for status orbs and the note card. Existing requirements are unchanged.

## Impact

- **Code**: `src/features/status`, `src/features/notes`, Home slots, and the Status and Note tabs. The tab bar unread input is wired to note read state.
- **API contract (new)**:
  - `GET /relationships/current/statuses` (current for both, plus today's events)
  - `PUT /me/status {mood}`
  - `GET /relationships/current/notes` (both current notes with `updatedAt`, `edited`, `seenAt`)
  - `PUT /me/note {text}`
  - `POST /relationships/current/notes/{noteId}/read`
- **Mock**: partner controls "Partner sets a status" and "Partner leaves a note".
- **Depends on**: `add-app-foundation`, `add-onboarding-and-auth` and `add-relationship`.
