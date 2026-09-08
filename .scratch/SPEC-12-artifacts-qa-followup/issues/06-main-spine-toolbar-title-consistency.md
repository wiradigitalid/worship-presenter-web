# 06: Main Spine toolbar and title-area consistency pass

**What to build:** The Main Spine toolbar reads cleanly (icon-only add buttons, a correct
Background icon/label, a sensible order), the Element Properties panel is always visible instead of
appearing and disappearing, and — once the three gating decisions are accepted — create-action
buttons and the title-area button grouping follow the project's now-standard patterns.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Ordinary UX work, no debugging pass needed — these are unbuilt-as-specified, not regressions.
- [ ] Closes `BUG-12`: Text/Rectangle/Image add-buttons show icon only, no "(Drag)" suffix text; the
      Change Background control uses an image/background icon (not one that reads as a
      color-picker swatch) and drops the word "Background" from its visible label; toolbar order is
      `Add: [Text] [Shape] [Image] | [Background icon] | [Placeholder dropdown] [Add Placeholder]`.
- [ ] Closes `BUG-13`: the Element Properties row is always mounted regardless of selection state,
      showing `Properties (Image): No properties to change` or `Properties (None): Select element
      first` as appropriate, instead of being conditionally rendered.
- [ ] **Gated on `DEC-009` (status: draft) being accepted:** the Main Spine "+ Add" button in the
      "New Slide" panel uses the shadcn `Button` `default`/primary variant. If still draft when this
      ticket is picked up, do the non-gated parts above and report this part as waiting.
- [ ] **Gated on `DEC-010` (status: draft) being accepted:** confirm the "New Slide" panel's
      wording already matches the accepted New/Add convention (it likely does — kind is chosen by
      the dropdown first, so "Add" already reads correctly under that rule); relabel only if the
      accepted decision says otherwise.
- [ ] **Gated on `DEC-011` (status: draft) being accepted, Main Spine half:** the title area reads
      `[Rename] | Canvas: [Reset] [Save]`, switching to `[Cancel] [Save] | Canvas: [Reset] [Save]`
      while rename is active.
- [ ] A static structural guard (`tests/operator-shadcn-guard.test.mjs`) confirms no hand-rolled
      element was introduced by the button-variant change.
- [ ] A new test asserts the Properties row is present in the DOM regardless of selection state,
      with both placeholder-text variants — seen failing against the current conditional-render
      code first, then passing.
