# 07: Song Sets consistency pass

**What to build:** The Song Sets editor drops the exposed "2/3 Formula" wording, keeps canvas height
stable when switching between the Title/Verse/Reff tabs, lets the Admin rename a Song Set's code the
same way its title is already renameable, and — once the gating decisions are accepted — matches
Main Spine's "New Slide" layout and title-area button grouping.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Ordinary UX work, no debugging pass needed.
- [ ] Closes `BUG-14`: the "Verse Layout" tab label no longer shows "(2/3 Formula)"; the canvas
      height stays the same when switching between "Title Slide", "Verse Layout", and "Reffrain
      Layout" — either the "Auto Lyric Box" explanatory banner appears with equivalent height on
      all three tabs, or it moves somewhere that isn't above the canvas.
- [ ] Closes the Song Set half of `BUG-15`: a Rename affordance exists next to the Song Set's code
      (`variableName`/slug) field, alongside the existing title Rename.
- [ ] Closes the remainder of the Song Set half of `BUG-15`, **gated on `DEC-009`/`DEC-010`
      (status: draft) being accepted:** the "New Song Set" creation block's layout mirrors Main
      Spine's "New Slide" panel (section label, then fields, then the create button), with the
      accepted button variant and label. If still draft, report this part as waiting.
- [ ] **Gated on `DEC-011` (status: draft) being accepted:** the Title/Verse/Reff sub-slide title
      area applies the same `[Rename] | Canvas: [Reset] [Save]` grouping built in ticket 06.
