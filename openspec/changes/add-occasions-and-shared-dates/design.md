# Design

## Context

The canvas sources are the `Occasions` (list and edit modes), `OccasionEdit`, `OccasionsEn`, `DateApproval` (pending, approved and declined states), `HomeWeekBirthday` and `HomeDayAnniversary` screens, the `OccasionMark` part, and the occasion patterns in `Backdrop` (`oc-rosette`, `oc-lattice`, `oc-facets`, `oc-constellation`, `oc-sparkle`, `oc-cardioid`). The canvas's `occasions()` function is the reference recurrence algorithm. The relationship calendar, time zone and the Jalali helpers come from `add-relationship` and `add-app-foundation`.

## Goals / Non-Goals

**Goals:**

- One server-owned occasion result (next occurrence, days to go, years, phase) shared by Home, Occasions, Rel Clock and later the thread charms, with a pure client preview for unsaved edits and mock parity.
- A generic proposal model covering both occasions and the relationship start settings.

**Non-Goals:**

- Custom user-defined occasions, removing a shared date, and withdrawing a proposal (not in the canvas).
- Push reminders (`add-devices-settings-notifications` sends the week and day notifications).

## Decisions

### Recurrence calendar

The canvas prototype recurs in Jalali whenever the UI locale is Persian. That would make two partners with different app languages see different dates for the same occasion. Instead, recurrence uses the **relationship's calendar** setting, the same value for both. The UI locale only changes the display. This is recorded in the `occasions` spec.

### Occasion authority and preview

ZAPE's `add-mobile-app-occasions-and-shared-dates` owns effective dates, recurrence, years, `nextUp` and the week/day phase on the existing relationship card. Known historical dates are stored as canonical Gregorian dates in ZAPE; yearless birthdays retain month/day and calendar without a fabricated year. The app sends editor values in the relationship calendar, displays the returned board and uses `src/features/occasions/engine.ts` only for an unsaved editor preview and a faithful development mock. Its table tests cover Esfand 30, Feb 29, yearless birthdays, rank ties and the canvas dates, then compare the outputs to ZAPE contract fixtures.

### Proposal model

```
DateProposal {
  id, subject: {kind:'occasion', occasion:'wedding'|'engagement'|'firstDate'}
             | {kind:'relationship', field:'startDate'|'startTime'|'timeZone'|'calendar'},
  current, proposed, proposedBy: 'you'|'partner', createdAt,
  state: 'pending'|'approved'|'declined'|'expired', decidedAt?,
  history: [{event:'proposed'|'approved'|'declined'|'expired', by, at}]
}
```

Pending proposals are part of the `occasions` query payload and polled at the partner-data interval. The review screen reads a single proposal by id so it can deep-link from notifications later.

### Home phase integration

Home uses the server board's `nextUp` and caller-specific phase to pick `normal | week | day`. The day variant hides the dial, so it doesn't mount the clock tick. The pattern id comes from the effective occasion in week/day phase and from the theme's background otherwise. Rel Clock uses the same returned phase. A local date preview never replaces the approved server value.

### Steppers vs wheel pickers

The editor uses the canvas's stepper rows (day, month, year with previous/next buttons) rather than a wheel. They are accessible, calendar-agnostic and match the design. The relationship-start picker from `add-relationship` is reused for the Relationship screen edits.

## Risks / Trade-offs

- **[Divergence from the canvas's locale-based recurrence]** → Deliberate, see Decisions. A Persian user with a Gregorian relationship sees Gregorian-recurring dates formatted in Persian.
- **[Stale pending state after a partner decides]** → The 30 s polling plus an optimistic update on the decider's side. The review screen refetches on focus.
- **[Proposal races, where both propose at once]** → The server enforces one open proposal per subject and returns `proposal_exists`. The client then shows the existing proposal.
