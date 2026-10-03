# Spec Delta

## ADDED Requirements

### Requirement: Streak chip

While online and once both members have joined, the Home header chip SHALL show the current thread («۱۲ روز») with the accessibility label «رشته‌ی ما: ۱۲ روز پشت‌سرهم». Tapping it SHALL open Our thread. While offline, the offline chip SHALL replace it.

#### Scenario: Tap the chip

- **WHEN** the user taps the streak chip
- **THEN** the Our thread screen opens with Back labelled «خانه»

### Requirement: Our thread card

The Home card row SHALL include a «رشته‌ی ما» card with the current thread count, «روز پشت‌سرهم», and a week of seven beads (oldest to today). Beads for days in the current thread are filled. Today's bead is emphasized when landed and pulses gently while it is still open, unless reduce motion is on. Tapping the card SHALL open Our thread.

#### Scenario: Three-day thread

- **WHEN** the current thread is 3 and today's bead has landed
- **THEN** the last three beads are filled, with today's emphasized
