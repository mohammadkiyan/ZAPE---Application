# Spec Delta

## Purpose

Defines the navigation frame of RelTime Mobile: the five main tabs, how secondary screens open and close, and how layout, numerals and connectivity state are presented consistently in Persian (RTL) and English (LTR).

## ADDED Requirements

### Requirement: Five main tabs
The app SHALL present a floating tab bar with exactly five tabs in this order: Home, Rel Clock, Status, Note, More. Persian labels SHALL be «خانه»، «زمان ما»، «حال»، «یادداشت»، «بیشتر». English labels SHALL be "Home", "Rel Clock", "Status", "Note", "More". Home SHALL be the initial tab for a signed-in user who has completed onboarding.

#### Scenario: Signed-in user opens the app
- **WHEN** a user who has completed onboarding launches the app
- **THEN** the Home tab is shown and marked as the current tab

#### Scenario: Switching tabs
- **WHEN** the user taps the Status tab
- **THEN** the Status screen is shown, the tab bar's active indicator moves to Status, and the tab exposes the "selected" accessibility state

### Requirement: Tab bar indicates unread partner note
The Note tab SHALL show an unread dot when the partner has left a note the user has not yet viewed, unless the Note tab is currently active. The tab's accessibility label SHALL then say that a new note from the partner is waiting ("، یادداشت تازه از همراه شما" / ", new note from your partner").

#### Scenario: Unread dot visible
- **WHEN** the partner's note is unread and the user is on the Home tab
- **THEN** the Note tab shows an unread dot and its accessibility label mentions the new note

#### Scenario: Unread dot hidden on the Note tab
- **WHEN** the user is on the Note tab
- **THEN** the Note tab shows the active indicator and no unread dot

### Requirement: Secondary screens stack above tabs
Secondary screens (for example Our thread, Occasions, Relationship, Account, Notifications, Devices) SHALL open above the tab they were opened from. The tab bar SHALL stay visible with the originating section highlighted. Each secondary screen SHALL provide a labelled Back control that returns to the screen it came from.

#### Scenario: Opening a secondary screen from More
- **WHEN** the user taps "Devices" on the More tab
- **THEN** the Devices screen opens with a Back control labelled with the originating section ("بیشتر" / "More"), and the More tab stays highlighted

#### Scenario: Returning from a secondary screen
- **WHEN** the user activates Back on a secondary screen
- **THEN** the previous screen is shown with its scroll position preserved

### Requirement: Writing direction follows the locale
With the Persian locale the whole interface SHALL lay out right-to-left. With English it SHALL lay out left-to-right. Directional glyphs (Back chevrons, forward chevrons) SHALL mirror with the direction. Latin-only values (email addresses, Wi-Fi names, version strings, codes, UTC offsets) SHALL render left-to-right inside RTL layouts.

#### Scenario: Persian layout
- **WHEN** the locale is `fa`
- **THEN** the tab order runs right-to-left starting with Home on the right, and Back chevrons point right

#### Scenario: Latin value inside Persian text
- **WHEN** an email address is shown on a Persian screen
- **THEN** the address renders left-to-right and is not reordered

### Requirement: Localized numerals and relative times
With the Persian locale all user-visible numbers (counts, times, dates, codes shown as digits, percentages) SHALL use Persian digits (۰–۹), and dates SHALL use the Jalali calendar with Persian month names. Relative times SHALL read «همین حالا», «N دقیقه پیش», «N ساعت پیش» in Persian and "Just now", "N minutes ago", "N hours ago" in English (a compact "Nm ago" / "Nh ago" form where space is tight).

#### Scenario: Persian time display
- **WHEN** a status was set 2 hours ago and the locale is `fa`
- **THEN** its time reads «۲ ساعت پیش»

#### Scenario: English date display
- **WHEN** the relationship start date 2021-03-14 is shown and the locale is `en`
- **THEN** it reads "March 14, 2021"

### Requirement: Connectivity state is visible and writes are blocked offline
The app SHALL detect when the phone has no internet connection. While offline, Home SHALL replace its header chip with «آفلاین · ساعت همچنان می‌شمارد» / "Offline · the clock keeps counting". Screens whose primary action writes shared data SHALL disable that action and show a reconnect message. Read-only content SHALL remain visible from the last successful sync.

#### Scenario: Going offline
- **WHEN** the phone loses connectivity while Home is shown
- **THEN** the offline chip appears within 5 seconds and the relationship clock keeps counting

#### Scenario: Coming back online
- **WHEN** connectivity returns
- **THEN** the offline chip disappears and shared data is refreshed without user action

### Requirement: Accessible touch targets and labels
Every interactive control SHALL have a touch target of at least 44×44 points and an accessibility label in the active locale. Icon-only controls SHALL have explicit labels. Decorative graphics (threads, patterns, glows) SHALL be hidden from assistive technology.

#### Scenario: Icon-only Back button
- **WHEN** a screen reader focuses the Back chevron on a secondary screen
- **THEN** it announces «بازگشت» (fa) or "Back" (en)
