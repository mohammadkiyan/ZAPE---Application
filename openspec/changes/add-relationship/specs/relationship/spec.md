# Spec Delta

## Purpose

Defines the two-person relationship that RelTime Mobile users, phones and RelTime devices attach to. It covers how it is created, how the partner is invited and joins, what both people can see about it, and how it ends.

## ADDED Requirements

### Requirement: One relationship per person, two members

A user SHALL belong to at most one active relationship at a time, and a relationship SHALL have at most two members. The creator is the first member. The second member joins by invitation.

#### Scenario: Already in a relationship

- **WHEN** a user who is in an active relationship tries to accept another invite
- **THEN** joining is refused with a localized message explaining they must end their current relationship first

### Requirement: Create a relationship

The creator SHALL set:

- the start date (required, not in the future)
- the start time (default 00:00)
- the calendar used to show and enter dates («جلالی» / «میلادی»; Jalali by default for Persian, Gregorian for English)
- the time zone (defaulting to the phone's zone, shown as e.g. «تهران · UTC+03:30»)

A preview dial SHALL show the resulting elapsed time. The screen SHALL state that the start date is shared and that later changes need the partner's confirmation.

#### Scenario: Create with a past date

- **WHEN** the user sets 24 Esfand 1399, 20:00, Tehran and taps «ساختن رابطه»
- **THEN** the relationship is created and the invite screen opens

#### Scenario: Future date rejected

- **WHEN** the user picks a start date after today
- **THEN** «ساختن رابطه» is disabled and an inline message explains the date can't be in the future

#### Scenario: Calendar toggle

- **WHEN** the user switches the calendar from Jalali to Gregorian
- **THEN** the selected date is shown as March 14, 2021 without changing the underlying date

### Requirement: Invite the partner

After creation, and whenever the partner has not joined, the creator SHALL be able to see an invite code of 8 characters from an unambiguous alphabet (no 0/O, 1/I/L), displayed in two groups of four («7K4P 9RM2»). A code SHALL be valid for 7 days and usable once. The screen SHALL offer:

- «ارسال دعوت‌نامه»: opens the system share sheet with a localized message containing the code
- copy (confirmed by «کد کپی شد»)
- «بعداً دعوت می‌کنم»: continue without waiting

While on this screen the state SHALL update from «در انتظار پیوستن همراه…» to «همراهتان پیوست.» when the partner joins.

#### Scenario: Partner joins while waiting

- **WHEN** the partner accepts the code while the creator is on the invite screen
- **THEN** within 30 seconds the dashed partner orb becomes solid, the thread turns burgundy, and the status reads «همراهتان پیوست.»

#### Scenario: Expired code replaced

- **WHEN** the creator opens the invite and the previous code has expired
- **THEN** a new code is issued and shown

### Requirement: Join with a code

The joining user SHALL enter the 8-character code. Entry is case-insensitive and spaces are ignored. Before joining, the app SHALL show a preview with the creator's name, the start date and the elapsed time («رابطه با محمد · از ۲۴ اسفند ۱۳۹۹ · ۵ سال و ۶ ماه»), and state that status, notes and occasions will be shared between the two. «پیوستن به رابطه» joins. «کد ندارم» returns to the create-or-join choice.

#### Scenario: Valid code

- **WHEN** the user enters `7k4p9rm2`
- **THEN** the preview for that relationship is shown and «پیوستن به رابطه» is enabled

#### Scenario: Invalid, expired or used code

- **WHEN** the code does not exist, has expired, or was already used
- **THEN** a specific localized message is shown and no preview appears

### Requirement: Relationship screen

The Relationship screen SHALL show:

- the two members' orbs
- the start date and time («از ۲۴ اسفند ۱۳۹۹ · ۲۰:۰۰»)
- the elapsed summary («۵ سال، ۶ ماه و ۱۲ روز با هم»)
- a "Time together" group listing start date, start time, calendar and time zone
- the members with names, «(شما)» on the current user, and join dates
- the relationship ID in the form `RLT-XXXX-XXXX`, copyable with confirmation «شناسه کپی شد»

If the partner has not joined, the partner member SHALL appear as invited, with access to the invite code.

#### Scenario: Copy relationship ID

- **WHEN** the user taps the copy control next to `RLT-4K7Q-92MD`
- **THEN** the ID is copied and «شناسه کپی شد» is shown briefly

### Requirement: End the relationship

Either member SHALL be able to end the relationship from the Relationship screen. A confirmation sheet SHALL come first: «رابطه پایان یابد؟», explaining that shared time, statuses and notes close for both, RelTimes detach, the account stays and the partner is notified, with «پایان رابطه» (destructive) and «انصراف». After ending:

- both members lose access to the relationship's shared data
- all RelTime devices detach
- each member is returned to the onboarding Relationship step on their next foreground

#### Scenario: Confirm ending

- **WHEN** the user confirms «پایان رابطه»
- **THEN** the relationship is ended, and the user sees the create-or-join step with their account still signed in

#### Scenario: Partner ended it

- **WHEN** the partner ends the relationship while the user has the app open
- **THEN** within 30 seconds the user is taken to the create-or-join step and told the relationship was ended by their partner
