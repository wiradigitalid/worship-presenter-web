---
topic: Hub
artifact: .what/hub/SRS-hub.md
updated: 2026-08-19T11:32
---

- (event) G4 guarded as-built: UC-1, UC-5, UC-7; LC-1..LC-8; picoclaw integration.
- (event) mode deep as-built: UC-2 UC-17; SCN-1..3; SM Service/Account; contracts 01-08; LC-12/13/16; model; webhook+delete flow; ABCE UC-1/2/5/7/17. 01-ux skipped. g4_passed false; wdi-review not yet.
- (event) wdi-review medium: structure+prose+edge-case. Not stamped: open findings. Blocking OQ-7 delete vs PII files. Assumptions OQ-8 same date, OQ-10 empty secret.
- (decision by user) OQ-7: deleting a Service deletes UPLOADS_DIR files belonging to that Service; recurring announcements remain. PPTX cache not answered. deleteService + tests.
- (event by user) Owner set policy.doc_language and doc_filename_language to English and overrode the language-guide default: existing corpus migrated. Markers [MISSING] [ASSUMED] [PARTIAL]; critical column yes/no. Filename slugs English (e.g. rundown-to-service, UC-7-delete-service).
- (event) Link repair after English slug migration: source-material paths expanded to prior-knowledge/; deferred-work citations now the archive file; Artifact reset route written in full; BMad custom config pins document_output_language English.
- (event) wdi-blueprint catalog: Hub G3 recut to Operator Hub intake this phase; UC-1 and UC-17 labelled CAP-11 later; UC-2 also satisfies FR-2; Rundown entity recut; Open Items OQ-17, OQ-1 parked. G4 UC flows not edited.
- (event) wdi-component deep as-built recut: UC-2 this-phase create (FR-27, FR-2); UC-1/UC-17 and LC-8/webhook CAP-11 later. BR-3 source includes UC-2. 01-ux still unwritten. No new AD, no g4_passed.
- (event) wdi-review medium: aligned Hub POST same-date with UC-2/OQ-8 (409 unless override, not upsert). Named empty/no-date reject. Lockout is 429. Quoted AD-12. Hymn on conceptual model. Dictionary PK/created_at rows. Assumptions one-liners. Trace not stamped (dirty tree).
- (event) wdi-review structure+prose+edge-case-hunter at 9ab0996. Contract gaps deferred as OQ-20..23 (generate vs BR-4; no-date/no-fallback; partial save and images; stale-save-gone and session). OQ-8/OQ-12 already cover same-date upsert and nearest Sabbath. Trace stamped.
