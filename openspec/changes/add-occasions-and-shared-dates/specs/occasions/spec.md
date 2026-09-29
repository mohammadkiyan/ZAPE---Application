# Spec Delta

## Purpose

Defines the yearly days a couple celebrates in RelTime Mobile: which occasions exist, who owns each date, how dates recur, and how each person chooses the reminders and theming they get before and on the day.

## ADDED Requirements

### Requirement: Occasion catalog and ownership
The app SHALL support exactly these occasions, ranked in this order for ties:

| kind | fa / en | date source | owner | editable by |
|---|---|---|---|---|
| anniversary | سالگرد ما / Our anniversary | relationship start date | shared | via Relationship (approval) |
| wedding | سالگرد ازدواج / Wedding anniversary | set by either | shared | either (approval) |
| engagement | سالگرد نامزدی / Engagement anniversary | set by either | shared | either (approval) |
| firstDate | اولین قرار / First date | set by either | shared | either (approval) |
| birthdayPartner | تولد همراه / Partner's birthday | the partner's own birthday | partner's | nobody here (read-only) |
| birthdayYou | تولد شما / Your birthday | your birthday | yours | you, immediately |
| valentine | روز ولنتاین / Valentine's Day | February 14 | shared | nobody (fixed) |

Wedding, engagement, first date and birthdays MAY be unset. Each occasion SHALL have a distinct mark (rosette, lattice, facets, constellation, sparkle, cardioid) used in lists, chips and Home patterns.

#### Scenario: Partner's birthday is read-only
- **WHEN** the user opens the partner's birthday in the editor
- **THEN** the date is shown as fixed with «این تاریخ را همراهتان تنظیم می‌کند؛ یادآوری‌ها مال شماست.», and only the reminder switches are editable

### Requirement: Yearly recurrence
Each set occasion SHALL recur yearly on its month and day in the relationship's calendar (Jalali or Gregorian). Valentine's Day SHALL always recur on Gregorian February 14. Two edge cases SHALL be handled:
- A Jalali 30 Esfand SHALL fall on 29 Esfand in years without it.
- A Gregorian February 29 SHALL fall on February 28 in non-leap years.

When the occasion has a year, anniversaries (anniversary, wedding, engagement, first date) SHALL carry a years count for the next occurrence. Birthdays MAY be saved without a year («بدون سال ذخیره می‌شود و هر سال تکرار می‌شود.»).

#### Scenario: Jalali recurrence
- **WHEN** the relationship calendar is Jalali and the wedding is 28 Ordibehesht 1403
- **THEN** the next wedding anniversary is 28 Ordibehesht of the coming Jalali year, with a years count one higher than last year's

#### Scenario: Esfand 30
- **WHEN** an occasion is 30 Esfand and the next Jalali year has no 30 Esfand
- **THEN** it falls on 29 Esfand that year

### Requirement: Next occasion
The "next" occasion SHALL be the set occasion with the fewest days until its next occurrence. "Today" counts as 0 days, in the relationship's time zone. Ties SHALL be broken by catalog rank.

#### Scenario: Two occasions the same day
- **WHEN** the anniversary and Valentine's Day are both in 3 days
- **THEN** the anniversary is the next occasion

### Requirement: Occasions screen
The Occasions screen SHALL show:
- the title «مناسبت‌ها» / "Occasions", the subtitle «روزهایی که جشن می‌گیرید», and the explanation that Home and the clock take the occasion's theme the week before and Home celebrates on the day
- a highlighted «مناسبت بعدی» / "Next up" card
- «همه‌ی مناسبت‌ها», a list of all set occasions ordered by days to go. Each row shows the mark, name, date, owner word («مشترک» / «شخصی» / «از همراه»), years when known, «امروز» / «فردا» / «N روز», and «در انتظار تأیید» / "Pending" when a proposal is open.
- the footer «تاریخ‌های مشترک فقط با تأیید هر دو نفر تغییر می‌کنند.»

Unset occasions SHALL be listed with an "Add a date" affordance. Back SHALL read «بازگشت به خانه» when opened from Home.

#### Scenario: Pending tag
- **WHEN** a wedding-date proposal is open
- **THEN** the wedding row shows «در انتظار تأیید»

### Requirement: Occasion editor
Tapping an occasion SHALL open its editor. It shows the mark, name, «هر سال · <date>» and a Date section:
- **Editable dates**: day, month and year steppers in the relationship's calendar, each with labelled previous/next buttons. The year is optional for your birthday. Hints: «سال، شمار سالگرد را روی ساعت می‌سازد.» or the no-year hint.
- **Fixed dates**: a label, value and explanation. Anniversary: «آغاز رابطه» with a pointer to Relationship. Valentine's: «هر سال · ۱۴ فوریه». Partner's birthday: the partner-set note.

The save action SHALL read «ذخیره» for your birthday and reminder-only changes, and «ارسال برای تأیید» when a shared date changed. After saving, a toast («ذخیره شد» or «برای تأیید همراه فرستاده شد») is shown and the list returns.

#### Scenario: Change your birthday
- **WHEN** the user changes their birthday and taps «ذخیره»
- **THEN** it is saved immediately, and the partner's "Partner's birthday" updates within 30 seconds

#### Scenario: Change a shared date
- **WHEN** the user moves the first date and taps «ارسال برای تأیید»
- **THEN** a proposal is created, the current first date stays in effect, and the row shows «در انتظار تأیید»

### Requirement: Personal reminder preferences
For every occasion, each person SHALL have two switches, both on by default. They affect only that person's phone:
- «تم ویژه در هفته‌ی پیش از آن» / "Theme the week before": Home and the clock take on its look for seven days
- «جشن در همان روز» / "Celebrate on the day": Home becomes a celebration for the whole day

Changing them SHALL never require approval.

#### Scenario: Turn off the week theme
- **WHEN** the user turns off "Theme the week before" for Valentine's Day
- **THEN** the week before Valentine's, the user's Home stays in its normal look, while the partner's Home is unaffected
