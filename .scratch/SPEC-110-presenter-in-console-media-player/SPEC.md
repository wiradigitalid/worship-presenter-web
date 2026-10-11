# SPEC-110 — Presenter In-Console Media Player & Congregation Video Projection

## Requirement Traceability & Scope
- **PRD**: `operator-turn`
- **Architectural Decisions**:
  - `AD-23` (Transition Style Is One Value, Described Once, Consumed Identically) — governs the one shared slide/scripture transition table (`src/lib/transitions.ts`); the media layer's enter/exit animation reuses that same table (`getGuestTransitionStyle`), keeping visual duration and easing consistent.
  - `AD-24` (Operator Chrome State Is Browser-Local, and Room-Facing Surface Is Closed to It) — Room display renders solely media content without operator UI chrome.
  - `AD-10` (presenter-authority BroadcastChannel, state-not-instruction, idempotent-on-the-wire) — governs presenter-authored `isPlaying`/`mediaTime` fields on `ProjectedSource.kind: 'media'`, broadcast from the single authority (the Presenter).
  - `AD-29` (The Projector Reports Its Own Liveness and Nothing Else, and One Predicate Decides It) — governs projector-originated media status messages (`attached`/`unavailable`), keeping telemetry strictly one-directional.
- **Functional Requirements**:
  - `FR-16` (Two-Screen Presenter View in the Browser) — Presenter console maintains single authority over slide, overlay, and media projection.
  - `FR-33` (New: Background Media Playback & Congregation Video Projection) — In-console audio/video playback during service intervals without window minimization.
- **Use Cases**:
  - `UC-12` (Two-Screen Presenter: Operator Console Controls and Projector Sync)
  - `UC-28` (New: Operator Plays Interval BGM and Projects Video)
- **Components**: `presenter`
- **Touches**: `present-channel`, `operator-present`, `projector-client`, `uploads`

---

## 1. Problem Statement & User Need

In sanctuary operations, church services frequently encounter intervals (pre-service gathering, prayer transitions, offering, post-service fellowship) where background music (BGM) or occasional announcement/testimony videos must be played.

Currently, operators must alt-tab or minimize the presenter browser to open an external media player (Windows Media Player, VLC, Spotify). This workflow suffers from critical operational failure modes:
1. **Window Focus Loss**: Returning to the presenter console requires clicking through taskbars/windows, frequently causing missed cues when the worship leader or speaker abruptly resumes.
2. **Panic Reaction Inability**: When a pastor unexpectedly begins praying or speaking while music is playing, the operator cannot immediately pause, fade, or mute audio if the player is hidden or trapped inside an obstructive modal window.
3. **No Direct Video Projection**: Projecting video requires separate screen routing or dragging windows onto extended desktop outputs, risking accidental desktop leaks onto the sanctuary projector.

---

## 2. Core Architectural & UX Decisions (Ratified by Pengarah Opus & Reviewers)

### 2.1 The Two-Tier Surface Rule: Drawer for Preparation, Dock for Live Execution
- **Non-Modal Slide-Over Drawer (`MediaDrawer.tsx`)**:
  - Serves as the **preparation surface**.
  - Slides in from the right, overlaying **only the right column** (minimum width `22rem`), strictly leaving the Current slide, header, and dock unoccluded.
  - **Non-modal by design**: No backdrop, no focus trap, no `aria-modal`. Clicking outside the drawer does **not** close it, because outside clicks are used for slide navigation.
  - Opening or closing the drawer does **not** disturb playback or unmount media elements.
- **Fixed Grid Bottom Mini-Dock (`MediaDock.tsx`)**:
  - Serves as the **live execution surface**.
  - Acts as a dedicated grid row at the base of the console (height 48–56px) spanning across both columns, avoiding overlaying or hiding the thumbnail filmstrip.
  - **Persistence Guard**: The dock does not abruptly disappear when a track finishes (`ended`), preventing sudden layout shifts while the operator is clicking slides. It clears only upon explicit operator dismissal (■ Stop & Tutup) or playlist emptying.

### 2.2 Instant Panic Control Group
- Positioned on the far left of the dock (minimum 32px click target, 44px on touch):
  - **Play / Pause**: Instantaneous toggle.
  - **Fade Out**: Linear volume attenuation over ~3s followed by auto-pause, preserving original volume setting for subsequent playback. Clicking Fade while fading immediately stops.
  - **Mute**: Instant mute toggle.
  - **Take Off Screen**: Immediately pulls projected video off the congregation screen back to slides.
- **Presentation Lock Invariant**: Panic controls (Pause, Fade, Mute, Take off screen, Stop) **remain fully active** even when presentation lock is engaged.
- **Focus Safety Invariant**: Buttons on transport/dock apply `onMouseDown={(e) => e.preventDefault()}` (precedent from `HymnNumberAutocomplete` and `ScriptureRefAutocomplete`), preventing button focus retention so global `Space` key reliably advances slides.

### 2.3 Single Playlist Model & Ordering
- Supports Audio (`.mp3`, `.wav`, `.m4a`, `.ogg`) and Video (`.mp4`, `.webm`).
- Row click selects; playback requires explicit ▶ or `Enter` to prevent accidental triggers.
- Reordering supported via drag-and-drop and `Alt+↑/↓` (with `stopPropagation` to prevent slide advance).
- Currently playing/loaded item cannot be deleted.
- Auto-advance: Audio auto-advances to next audio; halts if next item is video or completed item was video.

### 2.4 Congregation Screen Video Projection & Exclusivity
- **Manual Toggle**: `[📽️ Project to Screen]` per video item.
- **Mutual Exclusivity on `z-30`**: `kind: 'guest'` and `kind: 'media'` are strictly mutually exclusive presenter-enforced states. Activating video projection immediately tears down any active guest stream, and vice versa. Only one video occupant exists at layer `z-30`.
- **Wire Parsing (`present-channel.ts`)**: `projectionOf()` explicitly parses `kind: 'media'`, carrying `{ kind: 'media', mediaId, mediaUrl, isPlaying, mediaTime, at, revision }`. Absent or unrecognized kinds fail closed to `{ kind: 'deck' }`.
- **Confirmation Badge**: Displays `DI LAYAR` only after the projector acknowledges attachment via `projector-media-status` message with matching `mediaId`.
- **Slide Continuity**: Current slide frame displays an indicator banner ("Proyektor menampilkan video, slide tersembunyi"); underlying slide navigation continues in background so returning immediately displays the latest slide.
- **Audio Routing Invariant**: Audio plays exclusively on the Presenter console (connected to church audio mixer). The projector window video is strictly `muted` (enforced at mount and on every sync update) to prevent HDMI audio feedback.

---

## 3. Storage & Resilience Architecture (Ratification of Simpang S5)

### 3.1 Server-Backed Media Asset Storage
- **Ratified Decision**: Server upload extension (`POST /api/upload` / `POST /api/media`) serving stable same-origin URLs `/api/uploads/<hash>.<ext>` supported by HTTP range requests (`Accept-Ranges: bytes`) for clean video/audio seeking.
- **Rejection of Client-Only Blob / IndexedDB**: `blob:` URLs die upon tab reload and cannot cross to the projector window document. IndexedDB cannot stream multi-megabyte video blobs across window boundaries reliably without building a complex bespoke streaming protocol.
- **Size Cap & Limits**: Explicit cap of **500 MiB per file** with total quota check, matching realistic sanctuary testimony/announcement video lengths (1080p up to 30 mins).
- **Public-Repo Guard Safety**: `tests/public-repo-guard.test.mjs` explicitly verifies that `.mp3/.mp4/.wav/.m4a` files in `data/uploads/` remain gitignored and uncommitted to prevent sanctuary recording and copyright leaks.

### 3.2 Operational Failure Modes & Fail-Closed Mitigations
1. **Presenter Tab Reload Mid-Playback**:
   - On Presenter mount / boot, if in-memory `media-store` is empty, Presenter explicitly broadcasts an authoritative `{ kind: 'deck' }` `sync` message to guarantee no orphaned video is left playing on the sanctuary projector.
2. **Projector Disconnect / Reconnect Mid-Video**:
   - Reconnecting projector fails closed to `{ kind: 'deck' }` by default, protecting the sanctuary screen from visual glitches. Operator can re-engage `[📽️ Project to Screen]` once connection is re-established.
3. **Runtime Decode Failure (`onerror` / `MEDIA_ERR_*`)**:
   - On decode error, media engine immediately pauses, marks row as `Gagal` (non-blocking), surfaces an operator toast, and automatically pulls projection off-screen back to `{ kind: 'deck' }`.
4. **`play()` Promise Rejection & Buffering Stalls**:
   - Engine catches `play()` rejections (browser autoplay blocks or buffering stalls) and surfaces status without throwing. Panic controls (Fade, Mute, Take Off Screen) remain responsive at all times.
5. **Cancelled Fade Attenuation**:
   - Stopping playback or switching tracks mid-fade immediately cancels the 3s attenuation timer and restores unity gain so subsequent tracks start at normal volume.

---

## 4. Component Architecture & File Layout

```
src/operator/present/media-player/
  index.ts                  // Exports MediaPlayerProvider, MediaLauncherButton, MediaDock, MediaDrawer
  MediaPlayerProvider.tsx   // Root provider & media engine lifecycle mounted once in PresenterOperator
  media-store.ts            // External store via useSyncExternalStore with granular selectors
  playlist-model.ts         // Pure domain functions: add, remove, move, next, prev, auto-advance rules
  media-engine.ts           // Wraps HTMLMediaElement: load, play, pause, seek, fade, volume, mute, error catch
  projection-sync.ts        // Wire messages, heartbeat calculation, drift correction
  MediaStage.tsx            // Singleton host for media elements; persists across view toggles
  MediaLauncherButton.tsx   // Header trigger button with item count badge
  MediaDock.tsx             // Fixed bottom grid mini-player
  MediaDrawer.tsx           // Non-modal slide-over preparation drawer
  TransportControls.tsx     // Shared panic & transport controls
  SeekBar.tsx               // Seekbar committing on pointer release
  VolumeControl.tsx         // Volume slider & mute button
  ProjectToggle.tsx         // Manual projector toggle & status badge
  PlaylistList.tsx          // Reorderable playlist items
  PlaylistRow.tsx           // Individual track row with type icon & duration
  MediaUploader.tsx         // Multi-file uploader with canPlayType validation & 500MB cap
src/projected/media/ProjectedMediaLayer.tsx   // Plain <video muted src={url}> synchronizing to console clock
src/lib/present-channel.ts                     // Extended ProjectedSource with kind: 'media' & status telemetry
```

---

## 5. Automated Guard Tests & Absence Verification

All eight absence guards must be proven red through defect injection before being asserted green:
1. **Guard 1: Projector Video Mute Invariant**: Projector media element is strictly `muted`, verified upon mount and re-asserted upon state updates.
2. **Guard 2: Drawer Mount Independence**: Closing the drawer does not pause, unmount, or re-parent playing media elements.
3. **Guard 3: Item Transition Projection Safety**: Changing items or reaching `ended` immediately sets projection to `OFF` (`kind: 'deck'`) without auto-projecting subsequent tracks.
4. **Guard 4: Presentation Lock Panic Guard**: Panic controls (Pause, Fade, Mute, Take Off Screen) remain functional when presentation lock is enabled.
5. **Guard 5: Drift & Clock Calculation**: Pure unit tests for `expectedTime(mediaTime, at, now)` and drift compensation boundary logic.
6. **Guard 6: Guest/Media Projection Exclusivity**: `kind: 'guest'` and `kind: 'media'` never resolve to simultaneously-true projection state; activating one tears down the other.
7. **Guard 7: Projector Resync Fail-Closed Safety**: Projector reconnecting without active in-memory media state falls back cleanly to `{ kind: 'deck' }` rather than rendering an unhandled/broken video source.
8. **Guard 8: Fade Cancellation & Volume Restoration**: Stopping mid-fade or switching tracks cancels attenuation and restores standard volume for subsequent playback.
