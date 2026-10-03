# Design

## Context

The canvas sources are the `Together` screen (props `streak`, `checkin`, `unlocked`), `TogetherWaiting`, `TogetherUnlocked`, `TogetherTheme`, `TogetherEn`, the thread surfaces in `Status`, `Note`, `More` and `Home`, and the lock data in `Clock` (`bracelet: 12/30 days`, `flap: 64/100 notes`). The canvas prototype hard-codes these numbers. This change makes them real.

## Goals / Non-Goals

**Goals:**

- Server-authoritative game state, so two phones can never disagree about a bead, a streak or an unlock.
- A single thread query powering all six surfaces.

**Non-Goals:**

- Streak repair or freezes, and extra charms beyond the twelve.
- Push delivery of the 21:00 reminder, nudges and unlock notifications. Those are defined in `add-devices-settings-notifications`. This change only exposes the state.

## Decisions

### Authority

Beads, streaks, charms, milestones and unlocks are computed by ZAPE (`add-mobile-app-our-thread`) from accepted status and note events at write time and at the day turnover. This daily ritual is private and separate from ZAPE's spendable club Threads and annual occasion-knot streak. The client never derives awards from local history. Alternative: compute on the client from status and note history. Rejected because history is not fully downloaded, and the two phones could disagree after offline edits.

### Contract

```
Thread {
  streak, best, today: { you: CheckIn|null, partner: CheckIn|null, state:'both'|'you'|'partner'|'none' },
  week: [{date, beaded:boolean}] (7, oldest→today),
  nudge: { canSend:boolean, sentToday:boolean },
  milestone: { next:{unit:'days'|'hours', amount, date, daysLeft}, prev:{unit, amount, date}|null, progress:number },
  charms: [{ id, earnedAt|null, progress?:{have, need} }],
  themes: { flap:{unlocked, have, need:100}, bracelet:{unlocked, have, need:30} },
  celebrations: [{ id, kind:'charm'|'theme', ref }]   // unseen by *this* member
}
CheckIn { kind:'status'|'note', mood?, at }
```

The thread query is partner-mutable (30 s), and is also invalidated after the user's own status and note mutations succeed, so "Complete" appears instantly.

### Milestone computation

The milestone is computed on the server. The client may animate its displayed `progress` between refetches from the approved relationship start, but the next/previous milestone identity, awards and unlocks never change from a local calculation. A small `milestones.ts` helper and ZAPE contract fixtures pin the canvas numbers.

### Locked themes in the picker

`clock-themes` gets an `isLocked(themeId)` input fed from `thread.themes`. The shell and theme modules don't import the thread feature. The `(main)` layout passes a `lockedThemes` map into the Clock style panel. If a stored phone theme is somehow locked (for example on a new relationship), the app falls back to Constellation.

### Celebrations

On foreground, if `celebrations` is non-empty, the first unseen one is presented as a sheet over the current tab. Dismissing it posts `seen`. Only one is shown per foreground to avoid stacking.

### Mock rules

The mock implements the same rules against a mock "today" (shared with the occasion engine's dev override). "Advance the mock day" moves the turnover, so streak breaks and celebrations can be exercised.

## Risks / Trade-offs

- **[Time-zone turnover confusion]** → The "How it works" copy states the relationship's zone, e.g. Tehran. Both phones show the same state because the server decides.
- **[Celebration spam after a long absence]** → Show one per foreground. The rest queue.
- **[Canvas milestone copy implies arbitrary milestones]** → Fixed to 1,000-day and 10,000-hour steps, which reproduce the canvas examples. Other series can be added server-side without client changes, since the client renders whatever `unit/amount` it receives.
