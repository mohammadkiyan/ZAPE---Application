# Design

## Context

The canvas sources are the `Status`, `StatusPicker`, `StatusPorcelain`, `Note`, `NoteCompose`, `NoteMist`, `Home` and `HomeOffline` screens, and the `TabBar` part (unread dot). The prototype script in `Main.dc.html` shows the intended state transitions: status-pick → confirm for 1.5 s, note-save → saved toast for 1.5 s, and note-read after 1.5 s.

## Goals / Non-Goals

**Goals:**

- Optimistic, instant-feeling status and note saves on top of the foundation's online-only mutations.
- One read-state source feeding the Note tab card, the Home badge and the tab-bar dot.

**Non-Goals:**

- Check-in and streak effects of statuses and notes (`add-our-thread`). This change emits nothing thread-specific; the thread derives from the same server data.
- Note history, reactions and media.
- Push notifications for a new status or note (`add-devices-settings-notifications`).

## Decisions

### Contracts

```
Mood = 'happy'|'calm'|'loved'|'missing'|'focused'|'tired'|'sad'|'upset'|'stressed'|'unwell'
StatusBoard { you: {mood, at} | null, partner: {mood, at} | null, today: [{owner:'you'|'partner', mood, at}] }
NoteBoard  { you: Note | null, partner: Note | null }
Note { id, text, updatedAt, edited: boolean, seenAt: string | null }
```

The server computes `today` in the relationship's time zone, so both phones agree. `Note.id` changes on every save, which is how a "new version" resets `seenAt`.

The real routes are served by ZAPE's `/api/app/v1` gateway (`add-mobile-app-status-and-notes`). Each status or note save carries a stable `Idempotency-Key` reused across a connectivity retry; `X-Request-Id` remains a per-request tracing identifier. A stale read receipt returns `note_version_changed`, which triggers a board refetch without marking the replacement note read.

### Optimistic mutations

The status and note mutations use TanStack Query `onMutate` to patch the `StatusBoard` / `NoteBoard` cache, `onError` to roll back and `onSettled` to invalidate. A mutation paused for connectivity is surfaced as `pending` on the "you" item to render "Waiting to sync". Confirmation and saved toasts are local component state with 1.5 s timers, cleared on unmount.

### Read tracking

`useMarkReadWhenVisible(noteId)` starts a 1.5 s timer when the Note tab is focused, the app is active and the partner card is laid out on screen (an `onLayout` + scroll-viewport check). On fire, it optimistically sets `seenAt` in the cache and calls `POST …/read`. The unread selector `partnerNote && !partnerNote.seenAt` drives the tab bar dot, the Home badge and the Note badge. It lives in `src/features/notes/selectors.ts` and is passed to the shell's tab bar through a `(main)` layout prop, so the shell never imports the feature.

### Grapheme counting

`countGraphemes()` uses `Intl.Segmenter` when available and a grapheme-aware fallback when it is not. `Array.from` is not a valid fallback for ZWJ emoji. ZAPE enforces the same 120 limit, and shared fixtures pin emoji and ZWJ sequences.

### Glyphs

The ten mood glyph paths are copied from the canvas's `G` map into `src/features/status/mood-glyphs.ts` and rendered with `react-native-svg` `Path` at a 24×24 viewBox. They are shared with Home, the Status tab and the picker.

### Compose sheet

The compose sheet uses a React Native `Modal` presentation (page sheet on iOS) with a keyboard-avoiding layout. The foundation has no sheet primitive, so this change adds `src/components/ui` Reusables `dialog` only if needed, via the CLI rather than hand-rolled; otherwise it uses `Modal`.

## Risks / Trade-offs

- **[Read-on-visible can miss short scrolls]** → 1.5 s continuous visibility matches the canvas. The worst case is the dot staying until the next visit, which is harmless.
- **[Optimistic status shown then rejected]** → The rollback shows a localized error toast. The server is authoritative, and the 30 s refetch reconciles it.
- **[Clock skew makes relative times drift]** → Relative times are computed against the server `Date` header offset, captured by the API client and stored in a module-level `serverOffsetMs`.
