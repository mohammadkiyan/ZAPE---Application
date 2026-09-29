# Proposal

## Why

The canvas adds a gentle, cooperative game on top of the daily check-ins, called «رشته‌ی ما» / "Our thread". Each day both partners share a status or a note, a bead lands on the thread. Streaks, charms and two unlockable clock themes reward doing it *together*, with "no points, no competition". It gives the couple a reason to come back daily and gives the clock-theme system its locked Split-flap and Bracelet themes.

## What Changes

- Add daily check-ins and beads. A person checks in on a day by setting a status or leaving a note. When both check in on the same day (days turn over at midnight in the relationship's time zone), that day's bead lands.
- Add streaks. The current thread counts consecutive beaded days, and the best thread is kept on record («بهترین رشته‌تان: ۲۶ روز»). A missed day starts a new thread.
- Add the Our thread screen:
  - the streak hero with the next-goal pill («۱۸ روز تا پوسته‌ی «دستبند»»)
  - a Today card with both people's check-in, the state («کامل شد» / «منتظر همراه» / «نوبت شما» / «تا نیمه‌شب وقت دارید») and actions
  - the next time-together milestone («۵۰٬۰۰۰ ساعت با هم · ۹۷٪»)
  - the 12-charm collection («۸ از ۱۲») with detail sheets
  - the two unlockable themes
  - "How the thread works"
- Add the gentle nudge («یادآوری ملایم»). Once a day, a person who has checked in can nudge a partner who hasn't.
- Add twelve charms, earned together and awarded to both: first note, 7-day thread, In tune, partner's birthday, two RelTimes, Valentine's, 5th anniversary, 2,000 days, 100 notes, 30-day thread, early birds, 100-day thread.
- Add unlockable themes. Split-flap unlocks at 100 notes from either partner. Bracelet unlocks with a 30-day thread. They show as locked with progress in the Clock style picker until unlocked for both.
- Add unlock celebrations: a one-time sheet per person for a new charm or theme.
- Add thread surfaces across the app:
  - Home: the streak chip and the "Our thread" card with a 7-bead week
  - Status: the bead card
  - Note: the Split-flap goal card
  - More: stats and row

## Capabilities

### New Capabilities

- `our-thread`: Check-ins, beads, streaks, nudges, milestones, charms, celebrations and the thread's surfaces.

### Modified Capabilities

- `clock-themes` (from `add-app-foundation`): adds locked themes and their unlock rules. The existing catalog and picker requirements are unchanged.
- `home-dashboard` (from `add-relationship`): adds the streak chip and the Our thread card.

## Impact

- **Code**: `src/features/thread`; route `(main)/together.tsx`; Home, Status, Note and More surfaces; the Clock style panel's lock states.
- **API contract (new)**:
  - `GET /relationships/current/thread` (streak, best, today check-ins, week beads, nudge state, milestone, charms with progress, theme unlocks, unseen celebrations)
  - `POST /relationships/current/thread/nudge`
  - `POST /relationships/current/thread/celebrations/{id}/seen`
- **Server-authoritative**: streaks, charms and unlocks are computed by the backend. The mock mirrors the rules.
- **Mock**: partner controls "Partner checks in today", "Advance the mock day" and "Grant 100th note".
- **Depends on**: `add-app-foundation`, `add-onboarding-and-auth`, `add-relationship`, `add-status-and-notes` and `add-occasions-and-shared-dates` (occasion-based charms).
