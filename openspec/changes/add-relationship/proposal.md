# Proposal

## Why

RelTime is built around one shared thing: the time two people have been together. In the canvas, every phone and every RelTime device attaches to a _relationship_, not to each other. The relationship clock (years, months, days down to milliseconds since the start date) is the hero of Home and the whole Rel Clock tab. Status, notes, occasions, the thread and devices all need a relationship to exist first.

## What Changes

- Add the onboarding Relationship step. «رابطه‌تان را آغاز کنید.» offers two choices: create a new relationship, or join with an invite code.
- Add relationship creation. The user picks a start date and time, a calendar (Jalali / Gregorian) and a time zone, with a live preview dial and the note that the start date is shared and later changes need the partner's approval.
- Add partner invitations. The code looks like «7K4P 9RM2»: 8 characters, valid 7 days, single use. The screen has share and copy, a live waiting/joined state and «بعداً دعوت می‌کنم».
- Add joining with a code. Entry is case-insensitive. A preview of the relationship («رابطه با محمد · از ۲۴ اسفند ۱۳۹۹») and a consent line appear before joining.
- Add the relationship clock: calendar-aware elapsed time in the relationship's time zone, ticking live. It is shown as the Home hero and as the six-dial clock face on the Rel Clock tab.
- Add the Home dashboard frame: wordmark header, the you/partner thread, the clock hero, the "partner hasn't joined" state with «ارسال دوباره‌ی دعوت‌نامه», and slots for the cards later changes add.
- Add the Relationship screen (from More): pair summary, time-together facts (start date, time, calendar, time zone), members with join dates, a copyable relationship ID («RLT-4K7Q-92MD»), and «پایان رابطه» with confirmation.

## Capabilities

### New Capabilities

- `relationship`: Creating, inviting to, joining, viewing and ending a two-person relationship.
- `relationship-clock`: Elapsed-time calculation and its presentation (Home hero, Rel Clock six-dial face).
- `home-dashboard`: The Home tab's composition and its relationship-level states.

### Modified Capabilities

- `onboarding` (introduced by `add-onboarding-and-auth`, not yet archived): adds the mandatory Relationship step as new requirements. The existing requirements are unchanged.

## Impact

- **Code**: `src/features/relationship`, `src/features/relationship-clock`, `src/features/home`; routes `(onboarding)/start-relationship/{index,create,invite,join}.tsx` (not `relationship/`, which would share the URL `/relationship` with the Relationship screen), `(main)/relationship.tsx` and `(main)/invite.tsx` (Home's resend); the Home and Clock tabs.
- **API contract (new)**: `POST /relationships`, `GET /relationships/current`, `POST /relationships/current/invites`, `GET /invites/{code}` (preview), `POST /invites/{code}/accept` and `POST /relationships/current/end`. `GET /me` gains `relationship`.
- **Mock**: partner controls "Partner joins with the invite" and "Partner ends the relationship".
- **Depends on**: `add-app-foundation` and `add-onboarding-and-auth`.
