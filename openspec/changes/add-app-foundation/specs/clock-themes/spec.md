# Spec Delta

## Purpose

Defines the clock-theme system: the catalog of themes and background patterns, how a theme's tone restyles the whole app, how the user picks a style on the phone, and how that choice persists.

## ADDED Requirements

### Requirement: Theme catalog

The app SHALL offer these ten clock themes. Each one has a fixed tone, a default background and a dial variant:

| id            | fa / en name              | tone  | default background | dial     |
| ------------- | ------------------------- | ----- | ------------------ | -------- |
| constellation | صورت فلکی / Constellation | dark  | orbits             | classic  |
| porcelain     | چینی / Porcelain          | light | plain              | classic  |
| chronograph   | کرنوگراف / Chronograph    | dark  | sunburst           | chrono   |
| mist          | مه / Mist                 | gray  | contour            | hairline |
| rings         | حلقه‌ها / Rings           | dark  | guilloche          | classic  |
| astrolabe     | اسطرلاب / Astrolabe       | dark  | stars              | classic  |
| ruler         | خط‌کش / Ruler             | light | graticule          | hairline |
| editorial     | نوشتار / Editorial        | light | ruled              | hairline |
| flap          | ورقی / Split-flap         | gray  | dots               | classic  |
| bracelet      | دستبند / Bracelet         | light | silk               | hairline |

The default theme for a new install SHALL be Constellation.

#### Scenario: Fresh install

- **WHEN** the app is launched for the first time after onboarding
- **THEN** the Constellation theme (dark tone, Orbits background) is applied

### Requirement: Background catalog

The app SHALL offer ten background patterns: orbits (مدارها / Orbits), plain (ساده / Plain), graticule (شبکه / Grid), dots (نقطه‌ها / Dots), sunburst (پرتو / Sunburst), ruled (خط‌دار / Ruled), contour (تراز / Contour), guilloche (گیوشه / Guilloché), stars (ستارگان / Stars) and silk (ابریشم / Silk). The background setting SHALL be either "auto", which uses the current theme's default, or one explicit pattern.

#### Scenario: Picking a theme resets background to auto

- **WHEN** the user picks the Mist theme after having chosen the Stars background
- **THEN** the background returns to "auto" and the Contour pattern is shown

#### Scenario: Explicit background survives

- **WHEN** the user picks the Dots background while on Constellation
- **THEN** Home and Rel Clock show the Dots pattern on the dark tone

### Requirement: Whole app follows the theme tone

All in-app surfaces after onboarding (tabs, secondary screens, sheets, tab bar, status bar style) SHALL use the palette of the current theme's tone:

- dark: background `#151515`, primary text white
- light: background `#ffffff`, primary text `#151515`
- gray: background `#e8eced`, primary text `#151515`

The burgundy accent `#65001c` SHALL mark the one emphasized element per view (the thread, the active tab halo, primary buttons). Burgundy SHALL NOT be used as text colour on the dark tone. Muted text SHALL keep at least 4.5:1 contrast against its tone background.

#### Scenario: Switching to a light theme

- **WHEN** the user applies Porcelain
- **THEN** every tab and secondary screen switches to the white background with dark text, and the system status bar switches to dark content

#### Scenario: Onboarding is unaffected

- **WHEN** a signed-out user goes through onboarding while the stored theme is Constellation
- **THEN** onboarding screens use the white brand canvas regardless of the stored theme

### Requirement: Clock style picker

The Rel Clock tab SHALL contain a "Clock style" («سبک ساعت») panel with two segments, Theme («پوسته») and Background («پس‌زمینه»). Each segment SHALL show a thumbnail per option with its localized name, mark the current choice, and apply a selection immediately as a live preview on the phone.

#### Scenario: Previewing a theme

- **WHEN** the user taps the Rings thumbnail in the Theme segment
- **THEN** the phone's interface immediately switches to the Rings theme and Rings is marked as current

#### Scenario: Background segment

- **WHEN** the user switches to the Background segment
- **THEN** ten background thumbnails are shown and the current one (or the theme default, when auto) is marked

### Requirement: Phone style persists locally

The phone's chosen theme and background SHALL persist on the device across restarts. They SHALL NOT be stored in secure storage and SHALL NOT be sent to the partner.

#### Scenario: Restart keeps the theme

- **WHEN** the user picks Editorial and restarts the app
- **THEN** the app reopens in the Editorial theme

### Requirement: Typography

Persian text SHALL use Noto Sans Arabic (Regular, Medium, SemiBold), with no letter-spacing and a body line-height of at least 1.7. English text SHALL use Inter. English eyebrow labels SHALL be uppercase with tracking. Persian labels SHALL NOT be uppercased or tracked. Fonts SHALL be bundled with the app and never downloaded at runtime.

#### Scenario: Offline first launch

- **WHEN** the app is launched for the first time with no connectivity
- **THEN** Persian and English text render in the bundled fonts

### Requirement: Reduced motion

Decorative motion (thread draw-in, bead pulses, celebration bursts, pattern animation) SHALL be disabled when the operating system's reduce-motion setting is on. Functional updates such as the ticking clock SHALL continue.

#### Scenario: Reduce motion enabled

- **WHEN** reduce motion is on and Home opens
- **THEN** the thread appears fully drawn without animation, and the clock still ticks
