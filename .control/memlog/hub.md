---
topic: Hub
artifact: .what/hub/SRS-hub.md
updated: 2026-08-19T00:06
---

- (event) G4 guarded as-built: UC-1, UC-5, UC-7; LC-1..LC-8; picoclaw integration.
- (event) mode deep as-built: UC-2 UC-17; SCN-1..3; SM Service/Account; contracts 01-08; LC-12/13/16; model; webhook+delete flow; ABCE UC-1/2/5/7/17. 01-ux skipped. g4_passed false; wdi-review not yet.
- (event) wdi-review medium: structure+prose+edge-case. Not stamped: open findings. Blocking OQ-7 delete vs PII files. Assumptions OQ-8 same date, OQ-10 empty secret.
- (decision by user) OQ-7: deleting a Service deletes UPLOADS_DIR files belonging to that Service; recurring announcements remain. PPTX cache not answered. deleteService + tests.
- (event by user) Owner set policy.doc_language and doc_filename_language to English and overrode the language-guide default: existing corpus migrated. Markers [MISSING] [ASSUMED] [PARTIAL]; critical column yes/no. Filename slugs English (e.g. rundown-to-service, UC-7-delete-service).
