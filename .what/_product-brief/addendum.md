---
title: "Addendum: Worship Presenter Web"
status: draft
created: 2026-08-18
updated: 2026-08-18
note: "Detail yang tidak muat di brief 1–2 halaman. Bahan mentah tetap di _bmad-output/; di sini hanya kendala teknis dan rujukan path."
---

# Addendum

## Bahan mentah (tetap di `_bmad-output/`, tidak dilebur)

- Brief awal: `_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/brief.md`
- Addendum operasional + contoh Rundown: `.../addendum.md`
- Anatomi Deck sumber: `.../source-pptx-structure.md`
- PRD: `_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md`
- Spine: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`

Mereka masuk korpus hanya lewat skill yang punya slot (G2 PRD, G3 blueprint). Folder run **tidak** dihapus selama intent `update` masih membacanya.

## Kendala teknis (hanya membentuk implementasi)

Arah pemilik, 2026-08-18, untuk arsitektur *berikutnya* — bukan masalah G1:

- API produksi adalah proses **Go** yang selalu nyala.
- UI Operator dan projector adalah **React SPA** (bukan Next.js di live).
- **Node terpasang** di host, tetapi **tidak** sebagai server 24/7. PptxGenJS dijalankan sebagai proses anak saat Operator mengunduh PPTX, lalu exit.
- Plan slide dirakit di server Go; worker Node hanya menggambar plan yang sudah jadi. Worker tidak membuka SQLite.
- SQLite tetap satu proses / satu file.
- Next.js yang ada hari ini adalah as-built, bukan bentuk yang brief ini kuncikan.

Ini menjadi `AD-N` di spine saat G3, bukan baris Constraints di brief.

## Yang sudah pernah di-ship (konteks, bukan janji baru)

As-built di `src/` sudah mencakup Hub, webhook, generate PPTX, slideshow, presenter/projector, scripture, Song Book, canvas registry, dark mode. Brief ini **mengunci mengapa produk ada**, bukan mendaftar fitur yang sudah dikode. Fitur yang masih backlog (authoring registry Epic 20, concurrency, dsb.) diurus PRD/wave, bukan di sini.
