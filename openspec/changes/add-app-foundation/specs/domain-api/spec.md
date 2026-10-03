# Spec Delta

## Purpose

Defines how RelTime Mobile talks to ZAPE's `/api/app/v1` mobile gateway: validated request and response contracts, a development mock, error handling, offline behavior, and how quickly partner changes become visible.

## ADDED Requirements

### Requirement: Validated contracts

Every domain request and response SHALL have a declared schema. A response that does not match its schema SHALL be treated as an error and SHALL NOT reach the interface as data.

#### Scenario: Malformed response

- **WHEN** the backend returns a status payload missing the `mood` field
- **THEN** the request fails with an invalid-response error and the previously cached status stays on screen

### Requirement: Backend selection

The app SHALL use the real backend when `EXPO_PUBLIC_API_BASE_URL` is configured and `EXPO_PUBLIC_API_MOCK` is not `true`. In development builds it SHALL use the in-app mock backend when `EXPO_PUBLIC_API_MOCK` is `true` or no base URL is configured. A release build with no base URL SHALL show a non-dismissable configuration error instead of silently using the mock.

#### Scenario: Development without a backend

- **WHEN** a development build starts with no `EXPO_PUBLIC_API_BASE_URL`
- **THEN** all domain calls are served by the mock backend and a small "Mock data" marker is shown in the More tab footer

#### Scenario: Release build misconfigured

- **WHEN** a release build starts with no `EXPO_PUBLIC_API_BASE_URL`
- **THEN** the app shows a configuration error screen and makes no domain calls

### Requirement: Mock backend fidelity

The mock backend SHALL implement the same contracts as the real API. It SHALL persist its state on the device between launches in development, seed a scenario matching the design canvas (user «محمد» / mohammad@example.com, relationship started 1399-12-24 20:00 Asia/Tehran), and provide development-only controls to act as the partner (for example: join, set a status, leave a note, answer a shared-date proposal). It SHALL also let a developer reset its state.

#### Scenario: Acting as the partner

- **WHEN** a developer uses the mock control "Partner leaves a note"
- **THEN** within the freshness window the Note tab shows the unread dot and Home shows the new note

#### Scenario: Reset

- **WHEN** a developer resets the mock backend
- **THEN** the app returns to the signed-out onboarding start

### Requirement: Authenticated requests

Domain requests made while signed in SHALL carry the session credential in the `Authorization` header. An expired access token with `try_refresh_token` SHALL first use the single-flight refresh defined by `account-auth` and retry once. A revoked session or failed refresh SHALL clear the local session and return the user to onboarding without showing partner data.

#### Scenario: Session revoked

- **WHEN** a request returns `unauthorised`, or refresh fails after `try_refresh_token`
- **THEN** the stored session is deleted and the Welcome screen is shown

### Requirement: Partner data freshness

While the app is in the foreground, shared data that the partner can change (status, note, check-ins, shared-date proposals, relationship membership, device state) SHALL refresh at least every 30 seconds. It SHALL also refresh immediately when the app returns to the foreground or connectivity is restored. No polling SHALL occur while the app is in the background.

#### Scenario: Partner changes status

- **WHEN** the partner changes their status while the user has Home open
- **THEN** Home shows the new status within 30 seconds

#### Scenario: Returning to the app

- **WHEN** the app returns to the foreground after 10 minutes in the background
- **THEN** shared data is refetched before the user interacts

### Requirement: Writes require connectivity

Mutations of shared data SHALL NOT be attempted while the phone is known to be offline. If a mutation fails because the connection dropped mid-request, the affected item SHALL show a "waiting to sync" state («در انتظار همگام‌سازی» / "Waiting to sync"). The mutation SHALL be retried automatically once connectivity returns, and the item SHALL revert with an error message if the retry is rejected.

#### Scenario: Connection drops during a status change

- **WHEN** the user picks a new status and the request fails with a network error
- **THEN** Home shows the new status with the "Waiting to sync" meta, and the request is retried when the phone comes back online

### Requirement: User-facing errors

Network, timeout and server errors SHALL be shown as short localized messages with a retry action where retry makes sense. Raw error text, request IDs and stack traces SHALL NOT be shown to the user.

#### Scenario: Server error on save

- **WHEN** saving a note returns a 500 error
- **THEN** the compose sheet stays open with the draft intact and shows a localized "Couldn't save — try again" message
