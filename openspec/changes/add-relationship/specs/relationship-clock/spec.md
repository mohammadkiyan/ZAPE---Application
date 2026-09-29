# Spec Delta

## Purpose

Defines how RelTime Mobile computes and shows the time a couple has been together. That time is counted from the shared start moment in the relationship's time zone, down to milliseconds.

## ADDED Requirements

### Requirement: Elapsed-time calculation
Elapsed time SHALL be computed from the relationship's start date and time, taken as wall-clock time in the relationship's time zone, to the current wall-clock time in that same zone. It SHALL be expressed as years, months, days, hours, minutes, seconds and milliseconds.

Whole months SHALL be counted calendar-wise. When the start day does not exist in a target month, the month's last day SHALL be used (e.g. a start on the 31st anniversaries on the 30th in 30-day months). The remainder after the whole months SHALL be split into days, hours, minutes, seconds and milliseconds.

The result SHALL be identical on both partners' phones regardless of the phones' own time zones.

#### Scenario: Canvas example
- **WHEN** the start is 2021-03-14 20:00 Asia/Tehran and now is 2026-09-26 23:31:11.508 Tehran time
- **THEN** the elapsed time is 5 years, 6 months, 12 days, 03:31:11.508

#### Scenario: Partner in another time zone
- **WHEN** one partner's phone is set to Europe/Berlin
- **THEN** both phones show the same elapsed values at the same instant

#### Scenario: Month-end clamp
- **WHEN** the start is January 31 and now is March 1 of a non-leap year
- **THEN** the elapsed time is 1 month and 1 day

### Requirement: Year progress
The years value SHALL carry a progress fraction toward the next anniversary: the time since the last anniversary divided by the length of the current anniversary year. Dials SHALL render it as an arc.

#### Scenario: Halfway through the year
- **WHEN** the last anniversary was 182.5 days ago in a 365-day anniversary year
- **THEN** the years dial arc is at 50%

### Requirement: Home clock hero
Home SHALL show the eyebrow «زمان ما» / "Time together", then:
- a years dial with the progress arc
- months and days values with unit labels
- a running `hh:mm:ss.mmm` line
- the since line «از ۲۴ اسفند ۱۳۹۹» / "Since March 14, 2021", formatted in the relationship's calendar for Persian and in Gregorian for English

Tapping the hero SHALL open the Rel Clock tab. The hero's accessibility label SHALL summarize years, months and days («زمان ما: ۰۵ سال، ۰۶ ماه، ۱۲ روز»).

#### Scenario: Tap the clock
- **WHEN** the user taps the Home clock hero
- **THEN** the Rel Clock tab becomes active

### Requirement: Rel Clock face
The Rel Clock tab SHALL show the clock face, matching the canvas ClockFace part:
- «شما» and «همراه» labels joined by the thread
- the title «زمان ما»
- six dials: years, months, days, hours, minutes, seconds, each with its value, unit label and progress arc toward its next unit
- a milliseconds readout
- the since line

All of it is drawn in the current theme's dial variant (classic, chrono or hairline) over the current background. The Clock style panel from `clock-themes` SHALL appear below the face.

#### Scenario: Chronograph variant
- **WHEN** the theme is Chronograph
- **THEN** the six dials render in the chrono variant over the Sunburst background

### Requirement: Live ticking
While the clock is on screen and the app is in the foreground, the displayed values SHALL update continuously: seconds and milliseconds visibly advance, and milliseconds update at least 20 times per second. Ticking SHALL stop while the app is in the background or the screen is not visible. Ticking SHALL continue while offline. Screen-reader announcements SHALL NOT be triggered by ticks.

#### Scenario: App backgrounded
- **WHEN** the app goes to the background
- **THEN** no clock updates are computed until it returns, and on return the values jump to the correct current time

#### Scenario: Offline
- **WHEN** the phone is offline
- **THEN** the clock keeps ticking from the cached start date and time zone
