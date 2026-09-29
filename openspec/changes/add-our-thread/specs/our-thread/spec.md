# Spec Delta

## Purpose

Defines "Our thread", RelTime's cooperative daily ritual. Both partners checking in on the same day adds a bead, and streaks, charms, milestones and unlockable themes reward doing it together, never against each other.

## ADDED Requirements

### Requirement: Check-ins and beads
A member SHALL be checked in for a day once they have set a status or saved a note during that day. A day is a calendar day in the relationship's time zone, turning over at midnight. When both members are checked in for a day, that day's bead SHALL land. Check-ins SHALL be determined by the backend so both phones agree.

#### Scenario: Both check in
- **WHEN** the user sets a status at 16:15 and the partner saved a note at 16:13 the same day
- **THEN** today's bead lands and both phones show «کامل شد»

#### Scenario: Midnight passes
- **WHEN** only one member checked in before midnight
- **THEN** no bead lands for that day

### Requirement: Streaks
The current thread SHALL be the number of consecutive days with a bead, ending today if today's bead has landed, otherwise ending yesterday. A day without a bead SHALL end the thread, and the next bead starts a new one at 1. The best thread SHALL be the longest thread ever reached and SHALL never decrease.

#### Scenario: Today still open
- **WHEN** the last 12 days all have beads and today's bead hasn't landed yet
- **THEN** the current thread is 12

#### Scenario: Missed day
- **WHEN** yesterday has no bead and today's bead lands
- **THEN** the current thread is 1 and the best thread is unchanged

### Requirement: Our thread screen
The «رشته‌ی ما» / "Our thread" screen SHALL show, in order:

1. **Streak hero**: the current thread («۱۲ روز پشت‌سرهم»), the best thread line, and a next-goal pill. The pill reads «N روز تا پوسته‌ی «دستبند»» until 30 days, then «N روز تا نشان «۱۰۰ روز پشت‌سرهم»», and is hidden from 100 days.
2. **Today card**:
   - rows for "you" and "partner" with what they did («حال «شاد» · ۱۶:۱۵», «یادداشت · ۱۶:۱۳») or «امروز هنوز نه»
   - the state:
     - «کامل شد» with «مهره‌ی امروز روی رشته نشست.»
     - «منتظر همراه», when only you checked in
     - «نوبت شما», when only the partner did
     - «تا نیمه‌شب وقت دارید», when neither did
   - «ثبت حال» on your row when you haven't checked in
3. **Next milestone**: the eyebrow «نقطه‌ی عطف بعدی», the title, date and days to go, the previous milestone, and percent progress.
4. **Charms**: «نشان‌ها» with «N از ۱۲» and a grid; newly earned charms are tagged «تازه».
5. **Themes you unlock together**: the two unlockable themes.
6. **How the thread works**: three lines stating the bead rule, the midnight turnover in the relationship's time zone with the best thread kept, and «نشان‌ها و پوسته‌ها را فقط با هم باز می‌کنید؛ امتیاز و رقابتی در کار نیست.»

#### Scenario: Waiting for partner
- **WHEN** only the user has checked in today
- **THEN** the Today card shows «منتظر همراه» and the partner row offers «یادآوری ملایم»

### Requirement: Gentle nudge
When the user has checked in today and the partner has not, the partner row SHALL offer «یادآوری ملایم» / "Gentle nudge". Sending SHALL notify the partner, show «یادآوری ملایمی برای همراهتان رفت», and change the action to a disabled «یادآوری شد» / "Nudged" for the rest of the day. At most one nudge per member per day SHALL be allowed.

#### Scenario: Second nudge
- **WHEN** the user already nudged today
- **THEN** the nudge action is disabled and reads «یادآوری شد»

### Requirement: Time-together milestones
The next milestone SHALL be the nearest upcoming round amount of time together, either every 1,000 days or every 10,000 hours, counted from the relationship start. It is shown with its date, days to go, and progress as elapsed divided by the milestone amount. The most recently passed milestone SHALL be shown as «قبلی». Passing a days milestone that is a multiple of 1,000 SHALL award the matching day charm when one exists.

#### Scenario: Canvas example
- **WHEN** the elapsed time is 2,022 days (48,5xx hours) since 2021-03-14 20:00
- **THEN** the next milestone is «۵۰٬۰۰۰ ساعت با هم» about 61 days ahead with 97% progress, and the previous is «۲٬۰۰۰ روز»

### Requirement: Charm catalog
There SHALL be twelve charms, each earned once per relationship and awarded to both members at the same moment:

| id | fa / en | earned when |
|---|---|---|
| firstNote | اولین یادداشت / First note | the first note is saved by either member |
| thread7 | ۷ روز پشت‌سرهم / 7-day thread | the best thread reaches 7 |
| inTune | هم‌حال / In tune | both members' current status is the same mood on the same day |
| birthday | تولد همراه / Partner's birthday | either member's birthday passes while both are in the relationship |
| twoDevices | دو RelTime / Two RelTimes | each member has connected their own RelTime |
| valentine | ولنتاین / Valentine's | the first Valentine's Day passes in the relationship |
| anniv5 | پنجمین سالگرد / 5th anniversary | the 5th anniversary of the start is reached |
| days2000 | ۲۰۰۰ روز / 2,000 days | 2,000 days together are reached |
| notes100 | ۱۰۰ یادداشت / 100 notes | 100 notes saved in total by both |
| thread30 | ۳۰ روز پشت‌سرهم / 30-day thread | the best thread reaches 30 |
| early | سحرخیزها / Early birds | on 7 different days both checked in before 08:00 |
| thread100 | ۱۰۰ روز پشت‌سرهم / 100-day thread | the best thread reaches 100 |

Charms with a count SHALL expose progress («۶۴ از ۱۰۰»).

#### Scenario: Charm detail
- **WHEN** the user taps the locked 100 notes charm
- **THEN** a sheet shows its name, «صد یادداشت برای هم بنویسید.», «۶۴ از ۱۰۰ یادداشت», «۳۶ یادداشت مانده», «پاداش: پوسته‌ی «ورقی»» and «برای RelTime و گوشی هر دو نفر», with «بستن»

#### Scenario: Earned charm detail
- **WHEN** the user taps the earned First note charm
- **THEN** the sheet shows «به دست آمد · ۱۲ مهر ۱۴۰۴» and its description

### Requirement: Unlock celebrations
When a charm or theme is newly earned, each member SHALL see a celebration sheet once, the next time they open the app. The sheet shows:
- the eyebrow «نشان تازه» or «پوسته‌ی تازه»
- a title (e.g. «۲۰۰۰ روز با هم», «ورقی» باز شد)
- a sentence (noting the partner got it too)
- «N از ۱۲ نشان»
- a primary action: «دیدن نشان‌ها» for charms, «امتحانش روی RelTime» for themes, which opens Rel Clock
- a secondary action: «یادداشتی برای این روز» for charms, «بعداً» for themes

Dismissing SHALL mark it seen for that member only.

#### Scenario: Theme unlocked
- **WHEN** the 100th note is saved
- **THEN** both members get a one-time "Split-flap is unlocked" celebration on their next foreground

### Requirement: Thread surfaces
The thread SHALL also appear in these places:
- **Status tab**: a bead card, «مهره‌ی امروز روی رشته نشست» with «هر دو امروز حالتان را گذاشتید · N روز پشت‌سرهم», or the in-sync variant «هم‌حال شدید؛ نشان «هم‌حال» یک قدم نزدیک‌تر است.» when moods match.
- **Note tab**: a goal card «تا پوسته‌ی «ورقی»» with «۶۴ / ۱۰۰» and «هر یادداشت شما دو نفر یک قدم است…», until Split-flap is unlocked. After saving a note, the saved toast includes the count («یادداشت شما ثبت شد · ۶۵ از ۱۰۰»).
- **More tab**: stats for current thread, charms and best thread, plus the «رشته‌ی ما» row with «۱۲ روز پشت‌سرهم · ۸ نشان از ۱۲».

Each surface SHALL open the Our thread screen. Back from Our thread SHALL return to the originating tab.

#### Scenario: From Status
- **WHEN** the user taps the bead card on the Status tab
- **THEN** Our thread opens with Back labelled «حال»

### Requirement: No competition
The thread SHALL NOT show points, scores, leaderboards or per-person comparisons. It SHALL never state which partner broke a thread.

#### Scenario: Thread broken
- **WHEN** a thread ends because the partner didn't check in
- **THEN** the screen shows the new thread and best thread without attributing the missed day
