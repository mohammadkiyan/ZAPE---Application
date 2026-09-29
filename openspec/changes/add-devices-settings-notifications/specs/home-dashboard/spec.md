# Spec Delta

## ADDED Requirements

### Requirement: RelTime row on Home
Home SHALL end with a RelTime row:
- **You own a RelTime**: «RelTime شما» with its name and state: «همگام» when synced, «آفلاین» when the device is offline, or the last sync time («۱۲ دقیقه پیش») when the phone itself is offline. Tapping it SHALL open Devices.
- **You own none**: «اتصال RelTime» with «بدون دستگاه هم کار می‌کند». Tapping it SHALL start pairing.

#### Scenario: No device
- **WHEN** the user has no RelTime
- **THEN** the row reads «اتصال RelTime · بدون دستگاه هم کار می‌کند» and opens pairing

#### Scenario: Phone offline
- **WHEN** the phone is offline and the RelTime last synced 12 minutes ago
- **THEN** the row shows «۱۲ دقیقه پیش»
