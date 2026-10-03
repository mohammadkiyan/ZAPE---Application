# Spec Delta

## ADDED Requirements

### Requirement: Style target

Choosing a theme or background in the Clock style panel SHALL preview it on the phone immediately. The phone's own style SHALL persist when applied with either target. Whether the selection is also sent to the user's RelTimes SHALL depend on the "Apply to" choice defined in `reltime-devices`. A RelTime's current style SHALL be shown on its management screen and connected screen.

#### Scenario: Phone only

- **WHEN** the user applies Ruler with «فقط این گوشی»
- **THEN** the phone uses Ruler and the RelTime keeps its previous theme
