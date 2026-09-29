# Spec Delta

## ADDED Requirements

### Requirement: Locked themes
Split-flap («ورقی») and Bracelet («دستبند») SHALL be locked until the relationship unlocks them:
- Split-flap when 100 notes have been saved in total by both members
- Bracelet when the best thread reaches 30 days

Unlocks SHALL apply to both members, their phones and their RelTimes, and SHALL never be lost afterward. The other eight themes SHALL always be available.

#### Scenario: Locked in the picker
- **WHEN** Split-flap is locked and the user views the Theme segment
- **THEN** its thumbnail shows a lock and «۶۴ از ۱۰۰ یادداشت», and its accessibility label says it is locked with that progress

#### Scenario: Tapping a locked theme
- **WHEN** the user taps the locked Bracelet thumbnail
- **THEN** the current theme doesn't change and a toast says «دستبند با ۳۰ روز پشت‌سرهم باز می‌شود»

#### Scenario: Unlocked for both
- **WHEN** the relationship's best thread reaches 30
- **THEN** Bracelet becomes selectable on both partners' phones

### Requirement: Picker explains shared unlocks
The Clock style panel SHALL include the helper «دو پوسته‌ی قفل را با هم باز می‌کنید؛ همراهتان نمی‌تواند سبک RelTime شما را تغییر دهد.» / "Unlock the two locked themes together. Your partner can't restyle your RelTime."

#### Scenario: Helper visible
- **WHEN** the Theme segment is shown
- **THEN** the helper text is visible below the thumbnails
