# Spec Delta

## ADDED Requirements

### Requirement: RelTime onboarding step
Onboarding step 3 SHALL be the pairing flow titled «RelTime خود را وصل کنید.». Once the device connects, it SHALL show «RelTime · <name> وصل شد.» and enable «ادامه». «RelTime ندارم» SHALL skip to step 4. The step SHALL contribute the Ready summary row «RelTime · <name>» when a device was connected.

#### Scenario: Pair during onboarding
- **WHEN** the device enters the code during step 3
- **THEN** «اتصال انجام شد.» is shown, and «ادامه» moves to step 4

#### Scenario: No device
- **WHEN** the user taps «RelTime ندارم»
- **THEN** step 4 opens and Ready has no RelTime row

### Requirement: Notifications onboarding step
Onboarding step 4 SHALL be the notifications permission step defined in the notifications capability. It SHALL contribute the Ready summary row for notifications (on with quiet hours, or off).

#### Scenario: Skip notifications
- **WHEN** the user taps «بعداً» on step 4
- **THEN** Ready opens with notifications shown as off
