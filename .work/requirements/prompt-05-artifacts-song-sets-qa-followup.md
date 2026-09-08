# Prompt 05 — QA Manual Follow-up: Artifacts > Song Sets (pasca W11 Artifacts Overhaul)

- **Tanggal dicatat:** 2026-09-08
- **Sumber:** Prompt pengguna (mentah), hasil test manual pasca commit `68e95c3` (merge W11 Artifacts
  overhaul, mandate DEC-008)
- **Gambar Referensi:** disertakan pengguna sebagai attachment sesi (path temp lokal, TIDAK disalin
  ke repo — lihat `.work/requirements/README.md`)
- **Status:** Raw Requirement (menunggu review & perumusan defect/spek/tiket/TDD)
- **Konteks:** sama dengan `.work/requirements/prompt-04-artifacts-main-spine-qa-followup.md` —
  TIDAK ADA CODING pada tahap ini, fokus ke dokumen + spek/tiket/TDD lanjutan untuk `wdi-autopilot`.

---

## Kutipan mentah dari pengguna (verbatim)

### NEW SONG SET AREA

1. Maunya disamakan dengan main spine dari sisi tata layout, ada tulisan `New Song Set` Kecil
   sama persis dengan yang ada di main spine - tujuannya agar keseragaman UI/UX
2. Lalu dibawahnyalah baru ada:
   - Text field untuk Judul song set
   - Text field untuk kode song set
   - tombol [+ Add] - buat seragamnya apa, apa rule design system kita? apakah misal harusnya
     New? Add? Insert? kapan dia new, add, insert? - agar dibakukan design systemnya / UX nya.

### TITLE AREA

1. Harusnya rename itu berlaku untuk 2 text field: judul song set dan kode song set. Untuk judul
   sudah ada tersedia. Tapi untuk kode maunya disediakan juga (bisa disampingnya?)

### COMPONENT AREA [Image #8]

1. Verse Layout kenapa ada tulisan 2/3 formula? harusnya tidak ada, agar seragam
2. Tulisan `Auto Lyric Box: 2/3 Height Standard — Automated formula for hymn lyrics. Canvas
   customizes background & shapes.` jika mau ada, maunya ada keterangan yang sama ditaruh di
   komponen `Title Slide`, agar jangan canvas itu naik turun Ketika pindah2 komponen
3. Gak perlu ada fitur rename/reset/save untuk Judul Title / Verse / Reff? ini untuk apa
   sebenarnya?

### CANVAS

1. intinya disamakan dengan main spine

---

## Catatan referensi gambar (deskripsi tekstual, karena file tidak disalin ke repo)

- **Image #7**: tab "Song Sets" aktif. Panel kiri: tombol besar `+ New Song Set` (abu-abu terang),
  lalu "Configured Song Sets" (4 items: Bible Talk Opening Song [opening_song_bt], Bible Talk
  Closing Song [closing_song_bt], Divine Service Opening Song [opening_song_dw], Divine Service
  Closing Song [closing_song_dw]). Panel kanan: judul "Bible Talk Opening Song [slot:
  opening_song_bt]" + tombol `Rename`; di bawahnya sub-title area "Title [general]" dengan
  `Rename Reset Save`; lalu tab dalam `1. Title Slide | 2. Verse Layout (2/3 Formula) | 3.
  Reffrain Layout`; lalu toolbar `Add:` yang sama seperti Main Spine; canvas preview slide
  cokelat kosong.
- **Image #8**: tab "2. Verse Layout (2/3 Formula)" aktif. Di atas card judul ada banner biru
  bertuliskan "Auto Lyric Box: 2/3 Height Standard — Automated formula for hymn lyrics. Canvas
  customizes background & shapes." dengan badge "2/3 FORMULA" di kanan. Di bawahnya card "Verse
  [general]" dengan `Rename Reset Save`, lalu toolbar `Add:` yang sama, lalu canvas preview
  background sheet-musik.

Perbandingan Image #7 vs Image #8 menunjukkan tinggi canvas berubah karena banner "Auto Lyric Box"
hanya muncul di tab Verse Layout, tidak di tab Title Slide — ini akar dari poin Component Area
nomor 2 (canvas naik-turun saat pindah komponen).
