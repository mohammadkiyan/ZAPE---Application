# Spec Delta

## Purpose

Defines what the Home tab shows and in what order: the at-a-glance view of the couple's shared time and each other's latest updates, across normal, setup and offline states.

## ADDED Requirements

### Requirement: Home layout
Home SHALL be laid out top to bottom:
1. The header: the «ZAPE · RelTime» wordmark, with a chip slot for the thread streak or the offline notice.
2. The occasion eyebrow slot.
3. The red thread with the "you" and "partner" orbs.
4. The relationship clock hero.
5. The note or invite card.
6. A two-card row for "Our thread" and "Next up".
7. The RelTime device row.

The page SHALL sit on the current theme's background pattern and scroll above the floating tab bar. Slots whose feature is not yet available SHALL be omitted without leaving gaps.

#### Scenario: Minimal Home
- **WHEN** only the relationship features are available
- **THEN** Home shows the header, the thread with orbs and the clock hero, and nothing else

### Requirement: The thread
Home SHALL draw the red thread as two halves that meet at the clock. In Persian the "you" half comes from the right; in English from the left. When both members have joined, both halves SHALL be solid burgundy and animate in on first display (unless reduce motion is on). When the partner has not joined, the partner's half SHALL be dashed.

#### Scenario: Partner not joined
- **WHEN** the relationship has only one member
- **THEN** the partner half of the thread is dashed and the partner orb is dashed and empty

### Requirement: Partner-not-joined state
While the partner has not joined, the partner orb SHALL read «هنوز نپیوسته» with the meta «دعوت شده». Instead of the note card, Home SHALL show an invite card with «همراهتان هنوز نپیوسته است.», «رشته‌ی ما از روزی آغاز می‌شود که هر دو حالتان را بگذارید.» and the action «ارسال دوباره‌ی دعوت‌نامه», which opens the invite screen.

#### Scenario: Resend invitation
- **WHEN** the user taps «ارسال دوباره‌ی دعوت‌نامه»
- **THEN** the invite screen opens with a valid code and the share action

#### Scenario: Partner joins while Home is open
- **WHEN** the partner joins
- **THEN** within 30 seconds the invite card is replaced and the thread becomes solid
