# Spec Delta

## ADDED Requirements

### Requirement: Edit time-together settings by proposal

On the Relationship screen, each "Time together" row (start date, start time, calendar, time zone) SHALL be editable by either member through a picker. Saving a change SHALL create a shared-date proposal instead of applying the change, with the note «تغییر تاریخ یا ساعت شروع، پس از تأیید همراه روی همه‌ی گوشی‌ها و RelTimeها اعمال می‌شود.» When approved, the relationship clock, the anniversary occasion and all devices SHALL use the new values.

#### Scenario: Propose a new start time

- **WHEN** a member changes the start time from 20:00 to 21:00 and submits
- **THEN** the clock keeps counting from 20:00 and the partner gets a review banner

#### Scenario: Approved change

- **WHEN** the partner approves the new start time
- **THEN** both phones' clocks count from 21:00 within 30 seconds
