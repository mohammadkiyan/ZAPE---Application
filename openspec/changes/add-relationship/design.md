# Design

## Context

This change builds on:

- **add-app-foundation**: tabs, tone palettes, `Backdrop`, format helpers, domain API and mock, and 30 s freshness.
- **add-onboarding-and-auth**: `ONBOARDING_STEPS` registration and `resolveEntry`.

The canvas sources are:

- `StartRelationship`, `CreateRelationship`, `InvitePartner` and `JoinRelationship` (onboarding)
- `Relationship`
- `Home` and `HomeSetup`
- `Clock`
- the `ClockFace` and `TimeDial` parts

The canvas `Home` script contains a reference implementation of the elapsed-time math (`wall`, `addM`) and the Jalali conversions (`g2j` / `j2g`).

## Goals / Non-Goals

**Goals:**

- A single pure elapsed-time function that is exhaustively unit-tested and shared by Home, Rel Clock, Relationship and the join preview.
- Smooth ticking without re-rendering whole screens 25 times a second.

**Non-Goals:**

- Editing the start date, time, calendar or time zone after creation. That needs partner approval (`add-occasions-and-shared-dates`). This change shows those values read-only.
- Status orbs content, note card, occasions, thread streak and device row (later changes).

## Decisions

### Data model (contract)

```
Relationship {
  id: string              // "RLT-4K7Q-92MD"
  status: 'pending_partner' | 'active' | 'ended'
  start: { date: 'YYYY-MM-DD', time: 'HH:mm', timeZone: IANA }   // stored Gregorian
  calendar: 'jalali' | 'gregorian'
  members: [{ userId, name, joinedAt, isYou }]
  invite?: { code: string, expiresAt: string }                    // only for the creator while pending
}
InvitePreview { creatorName, start, calendar, elapsedSummary? }
```

The start is stored as a Gregorian local date and time plus an IANA zone, never as a UTC instant. Wall-clock semantics then stay stable across DST rule changes, and the result matches the canvas math.

### Elapsed-time engine

`src/features/relationship-clock/elapsed.ts` exports `elapsed(start, nowUtcMs) → {y, mo, d, h, mi, s, ms, yearProgress}`.

1. Convert `nowUtcMs` to wall-clock parts in `start.timeZone` with `Intl.DateTimeFormat(...).formatToParts`.
2. Treat both as naive UTC timestamps and apply calendar-month arithmetic with month-end clamping (`addMonths`, as in the canvas).

Tests pin the canvas example, month-end clamps, Feb 29 starts, DST zones (Europe/Berlin) and the start at exactly "now".

The calendar-month arithmetic is always Gregorian, even for Jalali relationships, because the canvas computes it that way. The Jalali setting only affects how dates are displayed and entered. See Risks.

### Ticking

`useClockTick(fps)` is driven by Reanimated's `useFrameCallback`. It writes the current time into a shared value, and only the leaf text nodes (`AnimatedText` via `useAnimatedProps`) for `hh:mm:ss.mmm` and the fast dial arcs read it. Years, months and days recompute in React state once per minute or on foreground. `AppState` and `useIsFocused` pause the frame callback. Alternative: `setInterval(40ms)` with `setState`, as in the prototype. Rejected because it re-renders the whole Home tree 25×/s on device.

### Dials

`TimeDial` (SVG) is ported from the canvas part with `variant: classic | chrono | hairline`, `tone`, `value`, `unit`, `progress` and `size`. `ClockFace` composes six dials plus the milliseconds line, and takes names, since, tone, background and variant.

### Date and time entry

The create screen uses its own sheet pickers, with steppers or wheels in the selected calendar, instead of the OS date picker. iOS and Android native pickers do not offer the Jalali calendar consistently. Time zones come from a curated list: the phone's zone first, then common zones. Each shows a localized city plus `UTC±hh:mm`, computed at the start date.

### Invite codes

Codes are generated server-side (the mock mirrors this) from the Crockford-like alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`. The client normalizes input by upper-casing, stripping spaces and mapping Persian digits. Sharing uses React Native `Share.share` and copy uses `expo-clipboard`, a new SDK-matched dependency.

### Membership polling

`GET /relationships/current` is a partner-mutable query (30 s interval). The invite screen polls every 5 s while it is focused so that "partner joined" feels immediate. An ended status triggers `resolveEntry` to route to the Relationship step.

## Risks / Trade-offs

- **[Jalali users may expect month counts on Jalali months]** → The canvas counts Gregorian months. Jalali and Gregorian month lengths differ, so a "month" boundary can shift by a day or two relative to the Jalali date. This is kept for parity with the RelTime device firmware (same algorithm) and documented. If product wants Jalali-month arithmetic, the change is isolated to `elapsed.ts`.
- **[Frame callbacks drain battery]** → They run only while focused and foregrounded. Milliseconds can be hidden in a later setting without spec changes.
- **[`Intl` time-zone data on Android]** → Hermes ships ICU with tz data. A test asserts Asia/Tehran and Europe/Berlin offsets so a regression is caught.

## Migration Plan

Additive. The Home and Clock tab skeletons from the foundation get their real content.
