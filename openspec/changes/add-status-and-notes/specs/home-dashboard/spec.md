# Spec Delta

## ADDED Requirements

### Requirement: Status orbs on Home
The "you" and "partner" orbs on the Home thread SHALL show each person's current mood glyph and label. The meta line SHALL be «شما · ۱۰ دقیقه پیش» / "You · 10m ago" and «همراه · ...» / "Partner · ...". If you have no status, your orb SHALL be dashed with «ثبت حال» / "Set status". If the partner has none, theirs SHALL read «بدون حال» / "No status". Tapping either orb SHALL open the Status tab.

#### Scenario: Set status from Home
- **WHEN** the user has no status and taps their dashed orb
- **THEN** the Status tab opens

#### Scenario: Unsent status
- **WHEN** the user's latest status is waiting to sync
- **THEN** their orb shows the new mood with the meta «در انتظار همگام‌سازی» / "Waiting to sync"

### Requirement: Latest note card on Home
When both members have joined and at least one note exists, Home SHALL show a note card with:
- the author («همراه» or «شما»)
- the time («امروز · hh:mm» / relative within the last hour)
- a NEW badge when unread
- the text in guillemets «…» (fa) or curly quotes “…” (en)

The card SHALL show the partner's note while it is unread; otherwise it shows whichever current note is newer. Tapping it SHALL open the Note tab.

#### Scenario: Unread partner note wins
- **WHEN** the partner's unread note is older than yours
- **THEN** Home shows the partner's note with the NEW badge

#### Scenario: No notes
- **WHEN** neither member has a note
- **THEN** no note card is shown
