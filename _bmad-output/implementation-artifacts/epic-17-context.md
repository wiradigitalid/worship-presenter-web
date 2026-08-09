# Epic 17 Context: An operator surface that is readable and honest

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give volunteer operators a calm, readable, and truthful interface for Friday preparation and live Sabbath operation: theme and contrast must support work in a dim sanctuary, important state must be visible before it causes loss or projection failure, and feedback must accurately describe what happened and what to do next. This improvement is confined to operator chrome. The projector, web slideshow, and downloaded PPTX must remain independent of every operator-specific visual choice so the congregation never sees operator UI or theme state.

## Stories

- Story 17.1: Reachable Dark Mode
- Story 17.2: `muted-foreground` Contrast
- Story 17.3: The App Says Its Own Name
- Story 17.4: Unsaved Canvas Work Is Not Lost Silently
- Story 17.5: The Presenter Knows When the Projector Is Gone
- Story 17.6: The Toast Channel Two Documents Describe Does Not Exist
- Story 17.7: The Room-Facing Shell Belongs to the Route, Not to the App
- Story 17.8: The Guard Encodes Its Criteria, Not Its Spellings
- Story 17.9: The Toast Channel Gets Wired

## Requirements & Constraints

- Operator theme choice must support system, light, and dark modes, persist only for that browser, and default to the operating system when no choice is stored. The presenter and slide-grid operator surfaces deliberately retain their fixed dark presentation treatment.
- Projected output must not vary with operator theme or other browser-local chrome state. This closure includes the projected component tree, inherited `html`/`body` shell, server first paint, route error states, `notFound()` handling, and future shells above room-facing pages. Downloaded PPTX output is part of the same separation guarantee.
- Operator chrome uses a restrained, high-contrast, largely achromatic visual identity. Secondary text on all recorded light-theme hosts must meet WCAG AA for normal text; measured success does not imply a complete accessibility audit or compliant non-text contrast.
- Product metadata must identify the application as Worship Presenter Web and describe it as the operator hub for preparing and projecting a worship service.
- Unsaved Artifact canvas work must be visibly marked and guarded at every supported destructive exit. Dirty state is session memory only; it is neither durable data nor a browser preference.
- Projector loss must be reported persistently on the presenter, remain distinct from popup blocking, stay silent before a projector has ever connected, name reopening as the recovery, and clear automatically on renewed evidence of life.
- A transient confirmation uses exactly one reporting channel. Use a toast only when the inline reporting surface is no longer visible; a self-dismissing toast must never be the sole report for an error that blocks work.
- Full-screen congregation surfaces contain no operator chrome. Failure states use literal, theme-independent colors, remain readable on constrained viewports, and expose operator recovery navigation only on the operator-controllable slideshow surface, not in the projector window.

## Technical Decisions

- Browser state has three non-interchangeable homes: shared durable values in SQLite settings, local view preferences in `localStorage`, and shared session-only state over the existing presentation `BroadcastChannel`. Domain drafts never belong in `localStorage`, and room-facing surfaces never read browser-local state.
- The root layout remains a Server Component. A client provider mounts at the narrowest route-segment layout containing all of its consumers; root is valid only when every route consumes it. Operator-only providers must never wrap room-facing routes.
- Every room-facing URL belongs to one route-group layout. Shell isolation must take effect before the server-rendered first paint; React client lifecycle work alone cannot satisfy that timing. The chosen mechanism must also release cleanly when navigation returns to operator routes.
- Projected chrome enforcement derives room-facing roots from the route structure rather than maintaining independent leaf-file lists. The guard must cover Server Component default exports, including async functions, and must protect shells above projected pages as well as their transitive component trees.
- Presenter/projector coordination stays local and same-origin. The presenter remains the sole authority over deck state. A projector may send one idempotent, state-free liveness acknowledgement, and receiving it may affect only liveness.
- One evaluator owns the `never-opened`/`live`/`lost` verdict. An acknowledgement is authoritative evidence of `live`; an observed closed window is immediate evidence of `lost`; a missing or stale handle is not evidence by itself. Heartbeat interval and freshness threshold are defined once and shared by both windows. Liveness is never persisted and never uses a server realtime path.
- Route or surface changes update the experience IA in the same change set. Closing the room-facing shell gap also requires the architecture decision to be amended through the architecture workflow, not by an informal inline edit.

## UX & Interaction Patterns

- Copy is plain, operational, and uses worship vocabulary. Errors state the recovery rather than exposing internal causes.
- Theme selection cycles system to light to dark one step per activation. The pre-hydration state must remain inert without disappearing from keyboard order.
- Unsaved canvas state appears beside Save and Reset. Supported exits ask before discarding work; a read-only template never arms the warning.
- Lost projector sync appears as a persistent presenter-header line, independent of the popup-blocked fallback. It must not add any congregation-facing warning.
- Slideshow and projector failures share the same black, literal-color presentation and headline. The slideshow may link back to operator recovery surfaces; the projector must not.

## Cross-Story Dependencies

- Story 17.1 closes projected-tree theme isolation; Story 17.7 closes the inherited-shell half and completes the room-facing closure decision.
- Story 17.8 hardens the theme/chrome guard separately from Story 17.7; shell work must preserve those criterion-based protections rather than reintroducing spelling lists.
- Story 17.6 owns the toast-channel decision, while Story 17.9 owns its wiring. Story 17.9 requires an operator-scoped route segment; Story 17.7 may create that segment as part of its route split, but is required to create only the room-facing segment. If the operator segment still does not exist, Story 17.9 creates it and updates the IA.
