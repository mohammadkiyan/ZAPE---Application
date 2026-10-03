# Proposal

## Why

The RelTime Mobile design canvas ("RelTime Mobile", 55 artboards, ZAPE design system) now defines the product, but the app is still a readiness screen with placeholder routes. The canvas describes a single app frame for every feature: five tabs, a clock theme that restyles the whole app, Persian-first RTL copy, and partner data that has to stay fresh. Every later feature change depends on that frame. It is also the first change to leave the "product scope is intentionally empty" rule in AGENTS.md behind, so the project rules need updating at the same time.

## What Changes

- Add the product navigation shell. It has a floating five-tab bar (Rel Clock, Status, Home at the centre, Note, More; Persian labels زمان ما، حال، خانه، یادداشت، بیشتر) and stacked secondary screens, which open from tabs or cards with a Back affordance.
- Add the clock-theme system. Ten named themes (Constellation, Porcelain, Chronograph, Mist, Rings, Astrolabe, Ruler, Editorial, Split-flap, Bracelet) each map to a tone (dark, light or gray), a default background pattern and a dial variant. The theme picked on the phone restyles every in-app surface. Onboarding stays on the white brand canvas.
- Add the ten background patterns (Orbits, Plain, Grid, Dots, Sunburst, Ruled, Contour, Guilloché, Stars, Silk) and a Clock style picker with Theme / Background segments.
- Adopt the ZAPE design tokens from the canvas: burgundy `#65001c`, white, cool gray `#e8eced` and black `#151515`, with Noto Sans Arabic for Persian and Inter for English.
- Add a typed domain API layer over the existing `src/api/client.ts`. It carries zod-validated contracts for ZAPE's `/api/app/v1` gateway, an in-app mock backend for development, connectivity awareness and freshness rules for partner data.
- Add shared locale formatting: Persian digits, Jalali dates, relative times ("۲ ساعت پیش" / "2h ago").
- **BREAKING**: Remove the light/dark/system theme preference and the maroon/mist/void palette. The clock theme replaces them. The Vazirmatn and Cormorant Garamond fonts are dropped.
- **BREAKING**: Remove the root readiness route and the `(auth)` / `(app)` placeholder routes.
- Update AGENTS.md and README.md: the new theme rule, the product scope now defined by these changes, and the mock-backend convention.

## Capabilities

### New Capabilities

- `app-navigation`: The tab shell, secondary-screen stack, tab bar behavior (active lens, unread dot), RTL/LTR mirroring, localized numerals and the connectivity banner.
- `clock-themes`: The theme and background catalog, tone mapping, whole-app restyling, the Clock style picker and persistence of the phone's choice.
- `domain-api`: The client-side API contract conventions, mock backend, authentication header injection, error mapping, offline write blocking and partner-data freshness.

### Modified Capabilities

(none — `openspec/specs/` is empty)

## Impact

- **Code**: `src/app/**` gets new route groups. New `src/features/shell` and `src/features/clock-themes` modules. `src/theme`, `src/preferences`, `src/providers/app-providers.tsx`, `src/localization`, `src/api` and `tailwind.config.js`/`global.css` are reworked.
- **Dependencies**: Add `@expo-google-fonts/noto-sans-arabic`. Remove `@expo-google-fonts/vazirmatn` and `@expo-google-fonts/cormorant-garamond`. `@react-native-community/netinfo` and `react-native-svg` are already installed.
- **Config**: New optional public flag `EXPO_PUBLIC_API_MOCK`. `.env.example` is updated.
- **Docs**: AGENTS.md (theme and scope rules, readiness-route gotcha) and README.md (architecture and configuration).
- **Follow-up changes** build on this one in order: `add-onboarding-and-auth` → `add-relationship` → `add-status-and-notes` → `add-occasions-and-shared-dates` → `add-our-thread` → `add-devices-settings-notifications`.
