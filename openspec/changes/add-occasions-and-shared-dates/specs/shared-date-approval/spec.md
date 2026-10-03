# Spec Delta

## Purpose

Guarantees that dates both partners share only change when both agree. It defines how a change is proposed, reviewed, approved or declined, and where pending proposals are surfaced.

## ADDED Requirements

### Requirement: Shared dates change only by approval

With two members, changes to shared dates SHALL be submitted as proposals: the wedding, engagement and first-date occasions, and the relationship's start date, start time, time zone and calendar. A proposal SHALL NOT change the value in effect. The value in effect, on every phone, web surface and RelTime, SHALL change only when the other member approves. First-time setting of an unset shared occasion SHALL also go through approval when two members are present. While a relationship has one member, that member SHALL be able to set a shared date immediately with an audit record, consistent with ZAPE's solo-card consent rule.

#### Scenario: Current value stays

- **WHEN** the partner proposes moving the wedding date from 28 to 31 Ordibehesht
- **THEN** both phones keep using 28 Ordibehesht until the user approves

#### Scenario: Solo member sets a date

- **WHEN** a relationship has one member and that member sets its first-date occasion
- **THEN** the date is applied immediately and recorded without an unanswerable pending proposal

### Requirement: One open proposal per date

Each shared date SHALL have at most one open proposal. While it is open, the proposer SHALL see the date as «در انتظار تأیید» and SHALL NOT be able to propose another change to it. The other member SHALL be the only one able to approve or decline.

#### Scenario: Proposer can't approve

- **WHEN** the proposer opens their own pending proposal
- **THEN** they see its status and no approve or decline actions

### Requirement: Review screen

The «تاریخ مشترک» review screen SHALL show:

- the occasion mark and a title («همراه تاریخ ازدواج را تغییر داده است.»)
- meta with age and state («۲ ساعت پیش · منتظر تأیید شما»)
- the current and proposed dates side by side, each with day, month, year and weekday in the relationship's calendar
- a sentence describing the effect («سالگرد ازدواج از این پس هر سال ۳۱ اردیبهشت خواهد بود.»)
- the note «تا وقتی تأیید نکنید، تاریخ فعلی روی گوشی‌ها و RelTimeها می‌ماند.»
- the actions «تأیید تغییر» and «نگه داشتن تاریخ فعلی»
- a «سابقه» history of the proposal and decision events with times

#### Scenario: Approve

- **WHEN** the user taps «تأیید تغییر»
- **THEN** the title reads «تاریخ ازدواج به‌روز شد.», the meta reads «روی همه‌ی گوشی‌ها و RelTimeها اعمال شد.», the old date is labelled «تاریخ قبلی» (dimmed), and history adds «شما تغییر را تأیید کردید · همین حالا · همراهتان باخبر شد»

#### Scenario: Decline

- **WHEN** the user taps «نگه داشتن تاریخ فعلی»
- **THEN** the title reads «تاریخ فعلی ماند.», the proposed date is labelled «پیشنهاد رد شد» (dimmed), and the proposer is informed within 30 seconds

### Requirement: Pending surfaces

When a proposal awaits the user's decision, a banner with the proposal summary and «بررسی و تأیید» / "Review" SHALL appear:

- at the top of More
- on the Relationship screen
- in the occasion's editor («همراه پیشنهاد داده این تاریخ به ۳۱ اردیبهشت تغییر کند.»)

The More "Occasions" row SHALL carry a «N در انتظار» tag. Each banner SHALL open the review screen.

#### Scenario: Banner leads to review

- **WHEN** the user taps «بررسی و تأیید» on More
- **THEN** the review screen for that proposal opens

#### Scenario: Banner clears

- **WHEN** the proposal is decided
- **THEN** all banners and tags for it disappear

### Requirement: Decided proposals stay viewable

After a decision or expiry, the review screen SHALL remain viewable from history, with «بازگشت به رابطه» to return. Decided or expired proposals SHALL NOT be reopenable. Expiry SHALL keep the current value and explain that the proposer may submit a new proposal.

#### Scenario: Revisit

- **WHEN** the user opens a decided proposal
- **THEN** it shows the final state and history with no decision actions

#### Scenario: Proposal expires

- **WHEN** a pending proposal reaches ZAPE's configured expiry without a partner decision
- **THEN** the current date stays active and the review screen shows an expired state without decision actions
