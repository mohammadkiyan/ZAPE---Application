# Spec Delta

## Purpose

Lets each partner share how they feel right now with a single mood, and see the other's mood and how both moods changed during the day.

## ADDED Requirements

### Requirement: Mood catalog
A status SHALL be one of ten moods, in this order and with these labels:

| id | fa | en |
|---|---|---|
| happy | شاد | Happy |
| calm | آرام | Calm |
| loved | عاشق | Loved |
| missing | دلتنگ | Missing you |
| focused | متمرکز | Focused |
| tired | خسته | Tired |
| sad | غمگین | Sad |
| upset | دلخور | Upset |
| stressed | نگران | Stressed |
| unwell | ناخوش | Unwell |

Each mood SHALL have a distinct line glyph, the same one used on the RelTime device. A person may also have no status yet.

#### Scenario: Labels follow the locale
- **WHEN** the partner's status is `missing` and the locale is `en`
- **THEN** it is labelled "Missing you"

### Requirement: Status tab overview
The Status tab SHALL show the title «حال» / "Status" and the subtitle «حال هر دوی شما در این لحظه چطور است؟» / "How are you both feeling right now?". Below them, two orbs joined by the thread:
- "you" («شما»): your mood glyph, label and relative time, or «ثبت نشده» / "Not set"
- "partner" («همراه»): theirs, or «هنوز حالی ثبت نشده» / "No status yet"

A primary action SHALL read «تغییر حال» / "Change status" when you have a status and «ثبت حال» / "Set status" when you don't.

#### Scenario: Both set
- **WHEN** you set Happy 10 minutes ago and your partner set Calm 32 minutes ago
- **THEN** the orbs read «شاد · ۱۰ دقیقه پیش» and «آرام · ۳۲ دقیقه پیش»

### Requirement: Pick a mood
The status action SHALL open a picker sheet titled «حالتان چطور است؟» / "How are you feeling?". It shows the ten moods as a grid of labelled buttons, marks the current mood (announced as «، حال فعلی» / ", current status") and has a Close control. Picking a mood SHALL save it, close the sheet and show «حال شما به‌روز شد» / "Status updated" on your orb for about 1.5 seconds, with a burgundy halo.

#### Scenario: Change mood
- **WHEN** the user opens the picker and picks Tired
- **THEN** the sheet closes, the "you" orb shows Tired with the confirmation, and the partner sees Tired within 30 seconds

#### Scenario: Close without picking
- **WHEN** the user closes the picker
- **THEN** the status is unchanged

### Requirement: In-sync moment
When both current statuses are the same mood, the Status tab SHALL say so («هم‌حال شدید» / "You're in sync").

#### Scenario: Same mood
- **WHEN** both partners' current status is Calm
- **THEN** the Status tab shows the in-sync line

### Requirement: Today's history
The Status tab SHALL list today's status changes by both people, newest first, under «امروز» / "Today" (accessibility label «تاریخچه‌ی حال امروز»). Each entry shows the glyph, mood label, time (hh:mm) and owner. "Today" is the current calendar day in the relationship's time zone.

#### Scenario: New change appears first
- **WHEN** the user sets Loved at 16:25
- **THEN** a "Loved · 16:25 · You" entry appears at the top of today's list

#### Scenario: Day rollover
- **WHEN** midnight passes in the relationship's time zone
- **THEN** today's list is empty until someone sets a status, while current statuses stay visible

### Requirement: Status offline behavior
While offline, the status action SHALL be disabled and the tab SHALL show «برای تغییر حال، دوباره به اینترنت متصل شوید.» / "Reconnect to change your status." If a status save fails because the connection dropped, it SHALL follow the domain API "waiting to sync" rule.

#### Scenario: Offline
- **WHEN** the phone is offline
- **THEN** the picker can't be opened and the reconnect message is shown
