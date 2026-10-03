# Spec Delta

## Purpose

Defines RelTime Mobile's deliberately quiet notifications: which events notify, how each person controls them and their quiet hours, and where a tapped notification leads.

## ADDED Requirements

### Requirement: Notification categories

The app SHALL support these categories. Push categories have a per-person switch and default; the shared-date row describes an in-app request that cannot be hidden:

| group     | category                  | trigger                                                     | default                                 |
| --------- | ------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| از همراه  | حال تازه                  | partner changes status                                      | on                                      |
| از همراه  | یادداشت تازه              | partner leaves or edits a note                              | on                                      |
| رشته‌ی ما | یادآوری رشته              | at 21:00 relationship time, if you haven't checked in today | on                                      |
| رشته‌ی ما | یادآوری ملایم همراه       | partner sends a gentle nudge                                | on                                      |
| رشته‌ی ما | نشان یا پوسته‌ی تازه      | a charm or theme unlocks                                    | on                                      |
| مناسبت‌ها | یک هفته پیش از مناسبت     | the day an occasion's week theme starts                     | on                                      |
| مناسبت‌ها | روز مناسبت                | 09:00 on the occasion day                                   | on                                      |
| رابطه     | درخواست تغییر تاریخ مشترک | partner proposes a shared-date change                       | always shown in-app; no category switch |
| رابطه     | RelTime آفلاین شد         | your RelTime is offline for more than 30 minutes            | off                                     |

Occasion notifications SHALL respect that person's per-occasion reminder switches.

#### Scenario: Category off

- **WHEN** the user turns off «حال تازه» and the partner changes status
- **THEN** no notification is delivered to the user

#### Scenario: In-app shared-date row

- **WHEN** the user views the Relationship group
- **THEN** the shared-date request row has no push switch and explains that approval requests stay visible in-app even when push is off

### Requirement: Master switch

The Notifications screen SHALL have a master switch «اعلان‌های RelTime Mobile». When it is off, or the OS permission is denied, all push category switches SHALL be shown disabled with «اعلان‌ها خاموش است؛ حال و یادداشت‌ها همچنان در برنامه و روی RelTime به‌روز می‌شوند.» The shared-date row SHALL explain that approval requests remain visible in-app even with push off. If the OS permission is denied, the screen SHALL offer to open the system settings.

#### Scenario: Master off

- **WHEN** the user turns the master switch off
- **THEN** category switches are dimmed and disabled, no push is delivered, and shared-date requests remain visible in-app

### Requirement: Quiet hours

Each person SHALL have quiet hours with an on/off switch and from/to times (default on, 23:00–08:00), shown with a 24-hour bar. Eligible notifications during quiet hours SHALL be delivered once when quiet hours end if still relevant and permitted. Quiet hours SHALL be private: «فقط برای شما؛ همراهتان باخبر نمی‌شود. اعلان‌های این ساعت‌ها پس از ساعت آرام می‌رسند.»

#### Scenario: Note at midnight

- **WHEN** the partner leaves a note at 00:30 and the user's quiet hours are 23:00–08:00
- **THEN** the user is notified at 08:00

### Requirement: Permission in onboarding

Onboarding step 4 SHALL explain «فقط چیزهایی که مهم است.» and list the categories (new partner status, new note, thread reminder at 21:00, occasions a week before and on the day, shared-date changes) and the quiet hours «ساعت‌های آرام: ۲۳:۰۰ تا ۰۸:۰۰». «اجازه دادن به اعلان‌ها» SHALL trigger the OS permission prompt and then continue. «بعداً» SHALL continue without prompting.

#### Scenario: Allow

- **WHEN** the user taps «اجازه دادن به اعلان‌ها» and grants permission
- **THEN** the push token is registered, and Ready shows notifications «روشن · ساعت آرام ۲۳ تا ۸»

#### Scenario: Deny

- **WHEN** the user denies the OS prompt
- **THEN** onboarding continues and Ready shows notifications as off

### Requirement: Push registration

When permission is granted and the user is signed in, the phone SHALL register its push token with the backend. It SHALL update the token when it changes and unregister it on sign-out. Preferences SHALL be stored on the backend so they apply to server-sent pushes.

#### Scenario: Sign out

- **WHEN** the user signs out
- **THEN** this phone's push token is unregistered and no further notifications arrive on this installation for that account

### Requirement: Notification routing

Tapping a notification SHALL open the relevant screen once the session gate allows it:

- partner status → Status tab
- note → Note tab
- thread reminder, nudge, unlock → Our thread
- occasion → Occasions
- shared-date request → its review screen
- RelTime offline → that device's management screen

#### Scenario: Tap a shared-date request

- **WHEN** the user taps a shared-date request notification while the app is closed
- **THEN** the app opens on the review screen for that proposal
