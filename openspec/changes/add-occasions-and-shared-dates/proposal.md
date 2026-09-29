# Proposal

## Why

The canvas turns the couple's important days into moments. The week before an occasion, Home and the clock take on that occasion's look and count down with beads. On the day, Home becomes a celebration. Dates like the wedding anniversary belong to both people, so the canvas insists that a shared date never changes without the other person's approval, and gives that approval its own screen. None of this exists yet, and the thread's anniversary charms depend on it.

## What Changes

- Add seven occasion kinds:
  - «سالگرد ما» Our anniversary: from the relationship start
  - «سالگرد ازدواج» Wedding anniversary
  - «سالگرد نامزدی» Engagement anniversary
  - «اولین قرار» First date
  - «تولد همراه» Partner's birthday
  - «تولد شما» Your birthday
  - «روز ولنتاین» Valentine's Day: fixed Feb 14

  Each has its own mark and pattern, an owner (shared / yours / partner's), yearly recurrence and a years count.
- Add the Occasions screen, reached from Home's "Next up" card and More:
  - the next occasion, highlighted
  - all occasions, with date, owner, years and days to go
  - a pending tag and the footer «تاریخ‌های مشترک فقط با تأیید هر دو نفر تغییر می‌کنند.»
- Add the occasion editor:
  - day/month/year steppers in the relationship's calendar, with an optional year for birthdays
  - fixed-date explanations for the anniversary, Valentine's and the partner's birthday
  - per-person reminder switches: «تم ویژه در هفته‌ی پیش از آن» and «جشن در همان روز»
  - «ذخیره» vs «ارسال برای تأیید»
- Add shared-date approval. Changing a shared date (wedding, engagement, first date, or the relationship start date/time/time zone/calendar) creates a proposal. The current date stays in force until the partner approves on the «تاریخ مشترک» screen (current vs proposed, «تأیید تغییر» / «نگه داشتن تاریخ فعلی», history). Pending proposals surface as banners on More, Relationship and Occasions.
- Add Home occasion phases:
  - week phase: occasion eyebrow, a 7-bead countdown, the occasion pattern on Home and Rel Clock
  - day phase: the celebration layout with «امروز · <date>», the headline, a subline and «نوشتن یادداشت» / «نوشتن یادداشت تولد»
  - the "Next up" card
- Add editing of the relationship's time-together settings from the Relationship screen through the same approval flow.

## Capabilities

### New Capabilities

- `occasions`: The occasion catalog, recurrence, ownership, the list and editor, and personal reminder preferences.
- `shared-date-approval`: Proposals, approval/decline, pending surfaces and history for shared dates.

### Modified Capabilities

- `home-dashboard` (from `add-relationship`): adds the occasion week/day phases and the "Next up" card.
- `relationship` (from `add-relationship`): adds editing the start date/time/time zone/calendar via approval. The read-only display requirement is unchanged.

## Impact

- **Code**: `src/features/occasions` and `src/features/shared-dates`; routes `(main)/occasions/{index,[id]}.tsx` and `(main)/shared-dates/[proposalId].tsx`; Home, Rel Clock backdrop, More and Relationship banners.
- **API contract (new)**:
  - `GET /relationships/current/occasions` (dates, owners, my reminder prefs, pending proposals)
  - `PUT /me/birthday`
  - `PUT /me/occasions/{kind}/reminders`
  - `POST /relationships/current/date-proposals`
  - `GET /relationships/current/date-proposals/{id}`
  - `POST …/{id}/approve`
  - `POST …/{id}/decline`
- **Mock**: partner controls "Partner proposes a wedding date change" and "Partner answers my proposal (approve/decline)".
- **Depends on**: `add-app-foundation`, `add-onboarding-and-auth`, `add-relationship` and `add-status-and-notes` (note CTA on the celebration day).
