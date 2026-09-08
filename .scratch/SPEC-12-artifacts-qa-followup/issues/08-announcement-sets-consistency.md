# 08: Announcement Sets consistency pass

**What to build:** The Announcement Set editor shows one title area for the slide being edited
(not two near-identical stacked blocks), the "Active Announcement Set" label and title-area height
stay stable through a rename, and — once the gating decisions are accepted — the "New Announcement
Set" creation area matches Main Spine's layout.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] Start with `wdi-systematic-debugging` for `BUG-9` (the duplicate title area) specifically.
      This is not only cosmetic: the owner clarified live that the two blocks held identical
      content, and saving the top one then editing the bottom one produced a "modified by another
      session" conflict banner. Confirm exactly what each block reads from and writes to (the same
      record with two independent concurrency tokens, two records meant to mirror each other, or
      something else) before deciding the fix.
- [ ] Closes `BUG-9`: collapse the two stacked title blocks into one title area for "slides in
      set" — unless the reproduction shows they are genuinely different actions on genuinely
      different objects, in which case do not collapse the UI, but still fix the stale-conflict bug
      (the two objects need to share or synchronize one concurrency token), and report the UI
      question back to the owner separately from that fix.
- [ ] Closes `BUG-16`: the "Active Announcement Set" label does not move, and the title area's
      height does not change, when rename mode toggles on or off.
- [ ] Closes the Announcement Set half of `BUG-15`, **gated on `DEC-009`/`DEC-010` (status: draft)
      being accepted:** the "New Announcement Set" creation block mirrors Main Spine's "New Slide"
      panel layout, button variant, and label. If still draft, report this part as waiting.
- [ ] A new test proves the reproduction from the debugging step fails against current code, then
      passes after the fix.
