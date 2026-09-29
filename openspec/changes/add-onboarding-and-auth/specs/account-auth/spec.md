# Spec Delta

## Purpose

Defines how a person signs in to (or creates) their Relationship OS account from RelTime Mobile with a one-time code, how the session is stored and ended, and how signed-out users are kept away from shared data.

## ADDED Requirements

### Requirement: Request a one-time code
On the Account step («وارد حساب Relationship OS شوید.») the user SHALL enter an email address or a phone number and request a sign-in code («دریافت کد ورود»). The app SHALL validate the format before sending. No password SHALL ever be requested. The screen SHALL state that an account will be created with that email if none exists («اگر حساب ندارید، با همین ایمیل ساخته می‌شود.»).

#### Scenario: Valid email
- **WHEN** the user enters `mohammad@example.com` and taps «دریافت کد ورود»
- **THEN** a code is requested and the screen switches to code entry, naming the destination address

#### Scenario: Invalid identifier
- **WHEN** the user enters `mohammad@` and taps the button
- **THEN** no request is sent and an inline localized format error is shown under the field

### Requirement: Enter the 6-digit code
Code entry SHALL show six digit boxes grouped 3 + 3 left-to-right, with the active box highlighted. It SHALL accept typed or pasted digits and support the platform's one-time-code autofill. It SHALL enable «ورود» only when all six digits are present. It SHALL offer «تغییر ایمیل» to go back to the identifier.

#### Scenario: Paste a code
- **WHEN** the user pastes `318742`
- **THEN** all six boxes fill in order and «ورود» becomes enabled

#### Scenario: Correct code
- **WHEN** the user submits the correct code
- **THEN** a session is created and onboarding advances to the next incomplete step

#### Scenario: Wrong code
- **WHEN** the user submits a wrong code
- **THEN** the boxes are cleared, a localized "That code isn't right" message is shown, and the identifier is kept

### Requirement: Code lifetime and resend
A code SHALL be valid for 10 minutes and for at most 5 verification attempts. After a code is sent, resending SHALL be unavailable for 60 seconds, shown as a countdown («ارسال دوباره · ۰:۴۲»). After that, «ارسال دوباره» sends a new code and invalidates the previous one.

#### Scenario: Resend cooldown
- **WHEN** 18 seconds have passed since the code was sent
- **THEN** the resend control is disabled and reads «ارسال دوباره · ۰:۴۲»

#### Scenario: Too many attempts
- **WHEN** a fifth wrong code is submitted
- **THEN** the code is invalidated and the user is told to request a new code

### Requirement: Display name for new accounts
When verification creates a new account, the user SHALL be asked once for a display name (1–40 characters, trimmed) before continuing onboarding. The partner sees this name on shared screens. Existing accounts SHALL skip this prompt.

#### Scenario: First sign-in
- **WHEN** a new account is verified
- **THEN** a name prompt is shown, and continuing is blocked until a non-empty name is entered

#### Scenario: Returning account
- **WHEN** an existing account signs in on a new phone
- **THEN** no name prompt is shown

### Requirement: Session storage
The session credential SHALL be an opaque token stored only in the platform's secure storage. It SHALL never be written to AsyncStorage, logs or public configuration. The app SHALL send it on every authenticated request.

#### Scenario: Restart while signed in
- **WHEN** a signed-in user force-quits and relaunches the app
- **THEN** the session is read from secure storage and the user lands on Home without signing in again

### Requirement: Session gate
Signed-out users SHALL only be able to reach onboarding screens. Signed-in users who have not completed onboarding SHALL be routed to their next incomplete onboarding step. Signed-in users who have completed onboarding SHALL be routed to the main tabs. Deep links into main screens SHALL be deferred until the gate allows them.

#### Scenario: Signed-out deep link
- **WHEN** a signed-out user opens a link to the Note tab
- **THEN** the Welcome screen is shown instead

### Requirement: Session end
When the backend reports the session invalid or expired, or the user signs out, the app SHALL delete the stored token, clear all cached account and relationship data from memory and persistent query caches, and show the Welcome screen. Local look preferences (locale, clock theme) SHALL be kept.

#### Scenario: Expired session
- **WHEN** a request returns unauthorized
- **THEN** the token is deleted, no partner data remains visible, and the Welcome screen is shown in the user's language
