# Spec Delta

## Purpose

Lets each partner leave one short note for the other, visible on the phone and on the RelTime, with read tracking so the writer knows it was seen.

## ADDED Requirements

### Requirement: One current note per person
Each member SHALL have at most one current note. Saving a note SHALL replace that member's previous note. A note SHALL be non-empty after trimming and at most 120 grapheme clusters. Emoji count as one character each.

#### Scenario: Replace a note
- **WHEN** the user saves «به تو فکر می‌کنم.» while an older note exists
- **THEN** the older note is no longer shown to either partner

#### Scenario: Emoji length
- **WHEN** the draft is 119 letters plus «❤️»
- **THEN** the counter reads «۱۲۰ / ۱۲۰» and saving is allowed

### Requirement: Note tab
The Note tab SHALL show the title «یادداشت‌ها» / "Notes" and the subtitle «یادداشتی کوتاه، برای یکدیگر.», then two cards:

- **Partner's note** («یادداشت همراه»): the text, «امروز · hh:mm» / «دیروز · hh:mm» / a date for older notes, and a NEW badge («جدید») while unread. Empty state: «هنوز یادداشتی نیست.»
- **Your note** («یادداشت شما»): the text, «آخرین تغییر hh:mm» or, after an edit, «ویرایش شده · hh:mm», plus «همراه دید · hh:mm» once your partner has read this version. Empty state: «هنوز یادداشتی نگذاشته‌اید.»

The action SHALL read «ویرایش یادداشت» / "Edit note" if you have a note, otherwise «نوشتن یادداشت» / "Write a note".

#### Scenario: Partner has read your note
- **WHEN** the partner read your current note at 10:05
- **THEN** your card shows «همراه دید · ۱۰:۰۵»

#### Scenario: Edit clears the receipt
- **WHEN** you edit your note after it was seen
- **THEN** the card shows «ویرایش شده · <time>» and no seen receipt until the partner reads the new version

### Requirement: Compose sheet
Writing or editing SHALL open a compose sheet prefilled with your current note (empty when writing a new one). It has a multiline field, a counter «n / ۱۲۰», the helper «همراهتان آن را روی گوشی و RelTime خود می‌بیند.», «انصراف» and «ثبت یادداشت». Saving SHALL be disabled when the trimmed draft is empty or over 120. After saving, the sheet SHALL close and «یادداشت شما ثبت شد» / "Your note was left" SHALL show briefly. Cancel SHALL discard the draft.

#### Scenario: Save
- **WHEN** the user types a note and taps «ثبت یادداشت»
- **THEN** the note is saved, the sheet closes, and the partner sees it within 30 seconds with a NEW badge

#### Scenario: Over the limit
- **WHEN** the draft reaches 121 characters
- **THEN** «ثبت یادداشت» is disabled and the counter is emphasized

#### Scenario: Save fails
- **WHEN** saving fails with a server error
- **THEN** the sheet stays open with the draft intact and shows a retryable error

### Requirement: Read tracking
A partner's note SHALL be marked read when its card has been visible on the Note tab for 1.5 continuous seconds while the app is in the foreground. Marking read SHALL clear the NEW badge, the Home NEW badge and the Note tab unread dot, and record the read time shown to the author. A note that appears on Home but is not opened on the Note tab SHALL stay unread.

#### Scenario: Glance on Home only
- **WHEN** the partner's new note is shown on Home and the user never opens the Note tab
- **THEN** it stays unread and the Note tab keeps its dot

#### Scenario: Open the Note tab
- **WHEN** the user opens the Note tab and stays 2 seconds
- **THEN** the note is marked read and the dot disappears

### Requirement: Notes offline behavior
While offline, write and edit SHALL be disabled with «برای ویرایش یادداشت، دوباره به اینترنت متصل شوید.» / "Reconnect to edit your note." Read receipts gathered offline SHALL be sent when connectivity returns.

#### Scenario: Read offline
- **WHEN** the user reads the partner's note while offline
- **THEN** the badge clears locally and the read time is sent once the phone is back online
