# Spec Delta

## Purpose

Defines the first-run journey of RelTime Mobile, from choosing a language through to the Ready screen. It covers the step frame, progress, skipping and resuming.

## ADDED Requirements

### Requirement: White onboarding canvas

All onboarding screens SHALL use the white brand canvas with black text and burgundy accents, independent of the stored clock theme. The primary action SHALL sit at the bottom of the screen.

#### Scenario: Dark theme stored

- **WHEN** the stored clock theme is Constellation and the user is on an onboarding screen
- **THEN** the screen is white with dark text

### Requirement: Welcome and language

The Welcome screen SHALL show the ZAPE · RelTime wordmark and an illustration of "you" («شما») and "partner" («همراه») joined by the red thread around a time dial. It SHALL show the headline «زمان مشترک شما، همیشه پیش روی شما.» / "Your shared time, always in view." and a language radio group with «فارسی» and «English». Persian SHALL be preselected on first launch. Continuing SHALL persist the chosen language. If the writing direction changes, the app SHALL reload and resume at the Account step in the new language.

#### Scenario: Continue in Persian

- **WHEN** the user keeps «فارسی» and taps «ادامه»
- **THEN** the Account step opens in Persian without a reload

#### Scenario: Switch to English

- **WHEN** the user selects English and taps "Continue in English"
- **THEN** the locale is saved as `en`, the app reloads left-to-right, and the Account step opens in English

### Requirement: Step frame and progress

Onboarding steps after Welcome SHALL show a top bar with a Back control, a four-node progress thread and either a skip control («بعداً» / "Later") or the ZAPE mark when the step can't be skipped. The four steps are 1 Account, 2 Relationship, 3 RelTime and 4 Notifications. Completed nodes SHALL be filled burgundy with a solid line, the current node emphasized and future nodes dashed. The progress SHALL have the accessibility label «مرحله N از ۴» / "Step N of 4", or «راه‌اندازی کامل شد» / "Setup complete" on Ready.

#### Scenario: Relationship step

- **WHEN** the user is on the Relationship step
- **THEN** node 1 is filled, node 2 is current, nodes 3–4 are dashed, and the label reads «مرحله ۲ از ۴»

#### Scenario: Account step cannot be skipped

- **WHEN** the user is on the Account step
- **THEN** no «بعداً» control is shown

### Requirement: Step order and skipping

Onboarding SHALL proceed in this order: Account → Relationship → RelTime → Notifications → Ready. Account and Relationship SHALL be mandatory. RelTime and Notifications SHALL be skippable, and skipping a step SHALL NOT block reaching Ready.

#### Scenario: Skip RelTime

- **WHEN** the user taps «RelTime ندارم» on the RelTime step
- **THEN** the Notifications step opens and the RelTime row is omitted from Ready

### Requirement: Resume after interruption

If the app is closed or reloaded mid-onboarding, it SHALL reopen at the first incomplete mandatory step, or at the step the user was on when all earlier steps are complete. Onboarding SHALL be recorded as complete on the account when the user leaves the Ready screen, so reinstalling on another phone with an existing relationship goes straight to Home.

#### Scenario: Killed during relationship creation

- **WHEN** a signed-in user without a relationship relaunches the app
- **THEN** the Relationship step is shown

#### Scenario: New phone, existing relationship

- **WHEN** a user whose account has completed onboarding signs in on a new phone
- **THEN** after verification the Home tab is shown

### Requirement: Ready screen

The Ready screen SHALL show a confirmation headline and a summary that includes only the rows that apply:

- Relationship «از <start date>»
- RelTime with the device name
- Notifications, either «روشن · ساعت آرام ۲۳ تا ۸» or off
- Our thread «اولین مهره، امروز»

Its primary action «مشاهده زمان ما» / "See our time" SHALL open Home and mark onboarding complete.

#### Scenario: With a device

- **WHEN** the user connected a RelTime named «اتاق نشیمن» and allowed notifications
- **THEN** Ready shows the relationship, RelTime «اتاق نشیمن», notifications on, and Our thread rows under the headline «اتصال انجام شد.» and the subline «RelTime و این گوشی آماده‌اند.»

#### Scenario: Without a device

- **WHEN** the user skipped the RelTime step
- **THEN** the headline refers to the phone only, and no RelTime row is shown
