# Spec Delta

## ADDED Requirements

### Requirement: Occasion week phase

When the next occasion is 1 to 7 days away and the user's "Theme the week before" is on for it, Home SHALL:

- replace the «زمان ما» eyebrow with the occasion's mark, name and «N روز دیگر» / "in N days"
- show a row of seven beads counting down, where filled beads are days passed and the next bead is emphasized
- hide the since line
- swap the background pattern for the occasion's pattern

The Rel Clock tab SHALL use the occasion's pattern as its backdrop during the same period.

#### Scenario: Five days before the partner's birthday

- **WHEN** the partner's birthday is in 5 days and the week theme is on
- **THEN** Home shows the sparkle mark, «تولد همراه · ۵ روز دیگر», and a countdown with 2 beads filled

#### Scenario: Week theme off

- **WHEN** the week theme is off for that occasion
- **THEN** Home keeps its normal eyebrow and pattern

### Requirement: Occasion day phase

On the day of an occasion, when the user's "Celebrate on the day" is on, Home SHALL:

- show «امروز · <day month>»
- show the occasion headline, for example:
  - «سالگردمان مبارک» with «N سال با هم»
  - «سالگرد ازدواجمان مبارک» with «N سال زندگی مشترک»
  - «امروز تولد همراه شماست» with «یادداشتی بگذارید تا امروز آن را ببیند.»
  - «تولدتان مبارک», «ولنتاین مبارک»
- hide the clock dial
- thicken the thread and intensify the occasion pattern
- offer «نوشتن یادداشت تولد» on the partner's birthday and «نوشتن یادداشت» otherwise, opening the note compose sheet

An unread partner note SHALL be shown as a quote on the celebration.

#### Scenario: Anniversary day

- **WHEN** today is the 5th anniversary and celebrate is on
- **THEN** Home shows «سالگردمان مبارک» and «۵ سال با هم», with no dial

#### Scenario: Write from the celebration

- **WHEN** the user taps «نوشتن یادداشت تولد»
- **THEN** the Note tab opens with the compose sheet

### Requirement: Next up card

The Home card row SHALL include a «مناسبت بعدی» / "Next up" card showing the next occasion's mark, name and «امروز» / «فردا» / «N روز دیگر». With no occasions set, it SHALL read «مناسبتی ثبت نشده» and «افزودن تاریخ». Tapping it SHALL open Occasions.

#### Scenario: No occasions

- **WHEN** no occasions are set besides the anniversary and Valentine's Day
- **THEN** the card shows whichever of those two is next
