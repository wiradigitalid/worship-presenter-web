---
type: decision
id: DEC-002
status: applied
touches:
  - .control/decisions/DEC-002-retire-prior-knowledge-by-wave.md
  - .control/registry/decisions.yaml
  - .control/registry/waves.yaml
  - .what/_product-brief/addendum.md
  - .what/_prd/operator-turn/addendum.md
  - .what/_prd/offline-deck/addendum.md
  - _bmad-output/prior-knowledge/README.md
supersedes: null
superseded_by: null
created: '2026-08-19'
---

# DEC-002 — Each G5 wave deletes the prior-knowledge slice it consumed

## Decision

Each closed G5 wave deletes the `_bmad-output/prior-knowledge/` paths listed on that wave, in the same change set as wave close, once the three retirement conditions in the corpus guide hold for those paths. DEC-001 still holds: the archive is not authority; this decision only governs when feeding files may leave the tree.

## Why

DEC-001 retired the pre-method archive as live fact and removed the folder. The folder was restored as G5 feeding data so `bmad-spec` could project from `.what/` + `.how/` without copying archive files into corpus rooms. Leaving the whole tree until the last wave would keep 186 files that are already mapped, already shipped, or already written into G1–G4. Deleting the tree in one shot would drop feeding data later waves still need. Slice-by-slice at wave close is the only order that both empties the archive and keeps the next spec's input.

The owner directed this on 2026-08-19: sweep prior-knowledge, and open `wdi-build` so each wave retires its slice.

## Cost

A later agent cannot re-read a retired story or SPEC from the working tree; git history is the recovery path. A wave that closes without listing its `retires` paths leaves those files in place until a later wave or a new `DEC-` names them. Accepting this decision is required before any delete; applying it is the first wave close that actually removes files.
