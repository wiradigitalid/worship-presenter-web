---
type: uc
id: UC-25
component: registry
satisfies: [FR-31]
critical: false
created: 2026-08-20
---

# UC-25 — I maintain the background library and set the global default

## Trigger

Admin adds, removes, or re-marks the default image in the Background Library.

## Precondition

Admin is signed in.

## Main Flow

1. Admin adds an image to the Background Library (images only — S10).
2. Admin marks one image the global default.
3. The system makes the library available to every Song Set entry's Verse/Reff background choice (weekly, on Hub) and to the Operator's live switch (Presenter, UC-27).

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Admin removes an image that a weekly choice or the global default currently points at | Allowed; that reference falls through the resolution order — weekly choice → global default → blank (AD-33, AD-34) — the same way a deleted Song Set entry leaves its weekly value inert |
| 2 | Admin marks a different image the default | The prior default stops being default; exactly one image is marked default at a time |
| 2 | Admin removes the last image, or never sets a default | Verse/Reff renders on a blank canvas (AD-33) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Uploaded reference is not an image, or fails the same image-resolution rules as any other Registry image (AD-8) | Rejects the add | Library unchanged |
| 1 | Not Admin | Rejects | Library unchanged |
| 2 | Save fails | Does not claim the new default | Prior default remains after restart |

## Outcome

The Background Library is Admin's to maintain; the Operator's live choice (UC-27) picks from it but never edits it. A generate that resolves no weekly and no default background renders blank, never a broken slide.

## Business Rules

BR-8 · BR-12
