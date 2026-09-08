# Prompt 07 — QA Manual Follow-up: Lainnya / Cross-cutting (pasca W11 Artifacts Overhaul)

- **Tanggal dicatat:** 2026-09-08
- **Sumber:** Prompt pengguna (mentah), hasil test manual pasca commit `68e95c3` (merge W11 Artifacts
  overhaul, mandate DEC-008)
- **Gambar Referensi:** disertakan pengguna sebagai attachment sesi (path temp lokal, TIDAK disalin
  ke repo — lihat `.work/requirements/README.md`)
- **Status:** Raw Requirement (menunggu review & perumusan defect/spek/tiket/TDD)
- **Konteks:** sama dengan `.work/requirements/prompt-04-artifacts-main-spine-qa-followup.md` —
  TIDAK ADA CODING pada tahap ini, fokus ke dokumen + spek/tiket/TDD lanjutan untuk `wdi-autopilot`.
  Poin ini eksplisit ditulis pengguna sebagai lintas-area (bukan spesifik Main Spine / Song Sets /
  Announcement Sets saja), lihat juga poin serupa yang sudah dicatat per-area di prompt-04, -05,
  -06.

---

## Kutipan mentah dari pengguna (verbatim)

### LAINNYA

1. Untuk dropdown predefined placeholder, harusnya on selected dan on listed item, teksnya
   harusnya sama. Scan seluruh dropdown list, agar behaviournya seragam di seluruh aplikasi.
   [Image #5]

---

## Catatan referensi gambar (deskripsi tekstual, karena file tidak disalin ke repo)

- **Image #5** di bagian ini dirujuk ulang oleh pengguna sebagai instruksi untuk men-scan
  **seluruh** aplikasi, bukan hanya dropdown yang sudah difoto — jadi cakupan tindak lanjutnya
  lebih luas dari sekadar dropdown "NEW SLIDE" (Main Spine) dan "predefined placeholder"
  (Toolbar Element, Song Sets, Announcement Sets) yang sudah disebut eksplisit di prompt-04/05/06.
  Perlu inventarisasi semua komponen dropdown/select di `spa/src` dan `src/` sebelum menulis
  spek, agar tidak ada satupun yang terlewat.
