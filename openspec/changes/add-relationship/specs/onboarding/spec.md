# Spec Delta

## ADDED Requirements

### Requirement: Relationship onboarding step
Onboarding step 2 SHALL be mandatory and complete once the user belongs to an active relationship. It SHALL start with «رابطه‌تان را آغاز کنید.», explaining that phones and RelTimes of both people connect to the same relationship. It SHALL offer two choices:
- «ساختن رابطه‌ی تازه»: "if your partner doesn't have RelTime Mobile yet"
- «پیوستن با کد دعوت»: "if your partner created it and invited you"

It SHALL also carry the note that the relationship can be ended later from «بیشتر» without losing the account. The create path SHALL continue through the invite screen. Both paths SHALL continue to step 3.

#### Scenario: Create path
- **WHEN** the user creates a relationship and taps «ادامه» on the invite screen
- **THEN** onboarding moves to step 3 with nodes 1–2 filled

#### Scenario: Join path
- **WHEN** the user joins with a valid code
- **THEN** onboarding moves to step 3

#### Scenario: Relationship ended later
- **WHEN** a user whose relationship was ended opens the app
- **THEN** the Relationship step is shown as the next incomplete step
