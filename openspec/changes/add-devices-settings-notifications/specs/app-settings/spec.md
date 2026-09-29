# Spec Delta

## Purpose

Defines the More tab and the Account screen: where users find the relationship, device, notification, language and account settings, and how they sign out or delete their account.

## ADDED Requirements

### Requirement: More tab
The More tab SHALL show:
- a pair header «شما و همراه» with «از ۲۴ اسفند ۱۳۹۹ · ۵ سال و ۶ ماه با هم»
- thread stats: current thread, charms, best thread
- a pending shared-date banner when one awaits the user

It SHALL then show these row groups:
- «رابطه»: Our thread, Relationship («تاریخ شروع، اعضا، شناسه»), Occasions (next occasion, pending tag)
- «ساعت و دستگاه‌ها»: Clock style (tone swatch and theme name, opens Rel Clock), Devices (your RelTime summary)
- «شما»: Notifications (quiet-hours summary), Account (email), Language (current language)
- «درباره»: Help & support, Privacy, Version (no chevron)

The footer SHALL read «RelTime Mobile · نسخه‌ی <version> · iOS و Android», with the version taken from the app build.

#### Scenario: Open Devices
- **WHEN** the user taps Devices
- **THEN** the Devices screen opens with Back labelled «بیشتر»

### Requirement: Language switch
The Language row SHALL switch between Persian and English. The choice SHALL persist, and the app SHALL reload only when the writing direction changes, returning to the More tab.

#### Scenario: Switch to English
- **WHEN** the user switches Language to English
- **THEN** the app reloads left-to-right and reopens on More in English

### Requirement: Help and privacy links
Help & support and Privacy SHALL open their configured web pages in an in-app browser. They SHALL be hidden when no URL is configured.

#### Scenario: Not configured
- **WHEN** no help URL is configured
- **THEN** the Help & support row is not shown

### Requirement: Account screen
The Account screen SHALL show an initial avatar, the name, the email and the thread chip. An «حساب» group SHALL list Name (editable), Email, Sign-in method («کد یک‌بارمصرف») and App language. A «حریم خصوصی» group SHALL list:
- «دریافت نسخه‌ای از داده‌های من» («حال‌ها، یادداشت‌ها و تاریخ‌ها در یک فایل»)
- «دستگاه‌های واردشده» with a count

#### Scenario: Rename
- **WHEN** the user changes their name to «محمدرضا»
- **THEN** the partner sees the new name on Relationship within 30 seconds

### Requirement: Data export
Requesting a copy of data SHALL produce a file containing the user's statuses, notes, occasions and relationship dates, and open the system share sheet. The user SHALL see progress while it is prepared and an error with retry on failure.

#### Scenario: Export
- **WHEN** the user taps «دریافت نسخه‌ای از داده‌های من»
- **THEN** after preparation the share sheet opens with the export file

### Requirement: Signed-in devices
«دستگاه‌های واردشده» SHALL list the account's active sessions with device model and last activity, marking this phone. The user SHALL be able to sign out any other session.

#### Scenario: Revoke another phone
- **WHEN** the user signs out their old phone from the list
- **THEN** that session ends and the count decreases

### Requirement: Sign out
«خروج از حساب» SHALL sign out this phone only, with the note «RelTime روی میز همچنان زمان شما را نشان می‌دهد.» It SHALL follow the session-end rule and unregister push.

#### Scenario: Sign out
- **WHEN** the user taps «خروج از حساب»
- **THEN** the Welcome screen is shown and the RelTime keeps working

### Requirement: Delete account
«حذف حساب کاربری» SHALL explain that the account and personal data are deleted and that this differs from ending the relationship, offering «رفتن به رابطه». A confirmation sheet SHALL follow: «حساب شما حذف شود؟», «این کار برگشت‌پذیر نیست. پیش از حذف، رابطه‌ی شما پایان می‌یابد و RelTimeهایتان از آن جدا می‌شوند.», with «حذف حساب» (destructive) and «انصراف». Confirming SHALL end any active relationship, delete the account and sign out.

#### Scenario: Confirm delete
- **WHEN** the user confirms «حذف حساب»
- **THEN** the relationship ends for both, the account is deleted, and the Welcome screen is shown
