# Spec Delta

## Purpose

Defines how RelTime desk devices join a relationship from the phone, how both partners see the relationship's phones and devices, and how an owner manages, updates, styles and detaches their own RelTime.

## ADDED Requirements

### Requirement: Pair a RelTime by code
To connect a RelTime, the phone SHALL show a 6-digit connection code in two groups of three, valid for 10 minutes, with a countdown («۹:۴۲ مانده») and «ساختن کد تازه» to replace it. The screen SHALL explain that the RelTime enters the code and the phone does not need to be nearby. It SHALL list the steps on the device:
1. «RelTime را به برق بزنید و به Wi-Fi وصل کنید.»
2. «روی RelTime «اتصال» را بزنید.»
3. «این کد را روی RelTime وارد کنید.»

While waiting, it SHALL show «منتظر RelTime…» and advance on its own when the device connects. A RelTime SHALL belong to the member who paired it.

#### Scenario: Device enters the code
- **WHEN** the RelTime submits the displayed code
- **THEN** within 5 seconds the phone shows the connected screen for that device

#### Scenario: Code expired
- **WHEN** the countdown reaches zero
- **THEN** the code boxes are dimmed and «خطا: این کد اتصال منقضی شده است. کد جدیدی بسازید.» is shown with «ساختن کد تازه»

### Requirement: Name a newly connected RelTime
After pairing, the connected screen SHALL show «RelTime به رابطه‌ی شما پیوست.» and «حال‌ها، یادداشت‌ها و مناسبت‌ها روی آن همگام شد.». It SHALL also show:
- an editable name field (1–24 characters), with «فقط خودتان و همراهتان این نام را می‌بینید.»
- the theme it received (the phone's current theme)
- the firmware version with state
- the Wi-Fi network

«تمام» SHALL save the name and return to Devices, or continue onboarding.

#### Scenario: Name the device
- **WHEN** the user enters «اتاق خواب» and taps «تمام»
- **THEN** the device is listed as «RelTime · اتاق خواب» for both partners

### Requirement: Devices overview
The Devices screen SHALL show «گوشی‌ها و RelTimeها همه به یک رابطه وصل‌اند، نه به یکدیگر.» with a diagram of the relationship at the center and its attached devices. A section «مال شما» lists your RelTimes (name, online/offline, last sync, firmware) and this phone (model, «همین گوشی»). A section «مال همراه» lists the partner's RelTimes and phone with their state. Only your own RelTimes SHALL be manageable. The footer SHALL state «همراهتان دستگاه‌های شما را می‌بیند، اما نمی‌تواند آن‌ها را مدیریت کند یا سبکشان را تغییر دهد.» «افزودن RelTime» SHALL start pairing.

#### Scenario: Partner's device
- **WHEN** the user taps the partner's RelTime row
- **THEN** no management screen opens

#### Scenario: Offline partner device
- **WHEN** the partner's RelTime last synced 3 hours ago
- **THEN** its row reads «آفلاین · ۳ ساعت پیش»

### Requirement: Manage my RelTime
The management screen for your own RelTime SHALL show:
- a live preview of what the device currently displays, drawn in its theme
- a status group: connection (Wi-Fi name), last sync, theme
- a software group: current version, and any available update with its release notes
- a display group:
  - «کم‌نور شدن در شب» (23:00–07:00) switch
  - «روشنایی» segmented Auto/Low/High («خودکار / کم / زیاد»)
  - «ثانیه‌شمار» switch («ثانیه‌ها و میلی‌ثانیه‌ها روی ساعت»)
- a device group: name (editable), «راه‌اندازی دوباره», «جدا کردن از رابطه»

Display changes SHALL apply to the device within 30 seconds while it is online.

#### Scenario: Turn off seconds
- **WHEN** the user turns off «ثانیه‌شمار»
- **THEN** the device stops showing seconds and milliseconds, and the preview updates

#### Scenario: Device offline
- **WHEN** the device is offline
- **THEN** changes are saved and marked as pending until the device next syncs

### Requirement: Firmware update
When an update is available, the software group SHALL show «آماده است», the notes and «به‌روزرسانی», with the warning that the RelTime turns off for a few minutes while the time is kept. During the update it SHALL show «در حال به‌روزرسانی…» with a percentage and «RelTime را از برق نکشید؛ پس از نصب خودش دوباره روشن می‌شود.» Afterwards it SHALL show «به‌روز است · <version> · همین حالا نصب شد.».

#### Scenario: Update progresses
- **WHEN** the user starts an update
- **THEN** progress is shown and refreshed at least every 5 seconds until done

### Requirement: Detach a RelTime
«جدا کردن از رابطه» SHALL ask for confirmation first: «RelTime جدا شود؟», explaining that the device stops showing statuses, notes and occasions and can be reconnected with a new code, with «جدا کردن» and «انصراف». After detaching, the device SHALL disappear from both partners' device lists and show only a clock.

#### Scenario: Confirm detach
- **WHEN** the user confirms «جدا کردن»
- **THEN** the device is removed from Devices and the user returns to the Devices screen

### Requirement: Apply the phone's style to my RelTime
The Rel Clock style panel SHALL include «اعمال روی» with the options «RelTime من» and «فقط این گوشی», plus the action «اعمال سبک». Applying to "My RelTime" SHALL set the selected theme and background on all RelTimes you own and confirm «سبک روی RelTime شما اعمال شد». "This phone only" SHALL confirm «سبک این گوشی تغییر کرد». When you own no RelTime, only the phone option SHALL be shown. A partner SHALL NOT be able to change your RelTime's style.

#### Scenario: Apply to device
- **WHEN** the user picks Astrolabe, selects «RelTime من» and taps «اعمال سبک»
- **THEN** the user's RelTime switches to Astrolabe and the toast confirms it

#### Scenario: Locked theme
- **WHEN** the selected theme is locked
- **THEN** «اعمال سبک» is disabled
