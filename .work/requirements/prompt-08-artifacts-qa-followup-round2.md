# Prompt 08 — QA Manual Follow-up Round 2: Artifacts (pasca SPEC-12)

- **Tanggal dicatat:** 2026-09-08
- **Sumber:** Prompt pengguna (mentah), hasil test manual pasca merge SPEC-12 (`d01bd84`, mandate
  DEC-013)
- **Gambar Referensi:** disertakan pengguna sebagai attachment sesi (path temp lokal, TIDAK disalin
  ke repo — lihat kebijakan repo publik di `.work/requirements/README.md`). Delapan gambar dirujuk
  di kutipan di bawah sebagai `[Image #1]`..`[Image #8]`; tidak ada data jemaat riil/pribadi di
  dalamnya (screenshot UI admin dengan konten sintetis "BANDUNG INTERNATIONAL COMMUNITY").
- **Status:** Raw Requirement — sudah diproses ke `.control/registry/defects.yaml` (reopen +
  entri baru), `.control/decisions/DEC-014-canvas-reset-becomes-discard-unsaved-changes.md`, dan
  `.scratch/SPEC-13-artifacts-qa-followup-round2/`
  pada sesi ini.
- **Konteks:** SPEC-12 (DEC-013 mandate) menutup BUG-1..BUG-17 dengan status `fixed`. Pengguna
  menjalankan test manual round kedua atas hasilnya dan menemukan beberapa perbaikan tidak benar2
  bekerja (regresi atau fix tidak lengkap), plus temuan baru. Pengguna secara eksplisit meminta:
  TIDAK ADA CODING pada tahap ini — fokus tindak lanjut adalah ke dokumen (defect/DEC/spek/tiket/
  TDD), agar bisa dieksekusi lewat sesi `wdi-autopilot` terpisah.

---

## Kutipan mentah dari pengguna (verbatim, per area)

### BUG-11 — Vertical scrollbar & Deck Sequence height

1. Masih ada scrollbar vertical. Canvas sudah muncul dengan aman/tepat, tapi terlihat ada
   scrollbar vertical di window, bahkan deck sequence pun terlihat masih panjang ke bawah —
   harusnya deck sequence pun heightnya menyesuaikan mirip2 canvas, atau sebesar layer. Ekspektasi:
   (a) tidak ada vertical scrollbar di window; (b) deck sequence memiliki height tepat di tepi
   layer window (mungkin sekarang terlalu membesar karena mengikuti vertical scrollbar). [Image #1]

### BUG-8, DEC-009, DEC-010 — New Slide dropdown initial state

1. Dropdown new slide sudah menampilkan teks seharusnya (label vs value fixed, confirmed).
2. Tapi dropdown new slide ketika di awal sekali (new form load), kenapa dia seperti gak aktif,
   mesti di-trigger memilih satu slide di deck sequence baru dia aktif. [Image #2]
3. Warna tombol Add sudah sesuai (confirmed).

### BUG-1 — Deck Sequence default selection

1. Kenapa saya musti klik 1 slide dulu baru fitur click-drag-release aktif? Ketika new form load
   dia gak bisa click-drag-release. Hal ini berbeda di announcement-sets yang otomatis slide
   pertama terpilih. Kalau begitu buat aja agar pas new form load, slide pertama otomatis selected.
2. Fitur click-drag-release bekerja dengan baik dan berhasil save (selain nomor 1 di atas) —
   confirmed, bukan regresi pada mekanisme drag itu sendiri.

### BUG-12, BUG-17 — Toolbar icons (confirmed fixed)

1. Tombol text, rectangle, dan image sudah icon-only.
2. Tombol ganti background sudah sesuai (icon + text).
3. Tombol placeholder sudah sesuai warnanya.

### BUG-13 (confirmed fixed)

1. Property bar sudah muncul terus, sudah sesuai.

### BUG-4, BUG-5, BUG-6, BUG-10 (confirmed fixed)

1. Text: font size, font color, underline, bold, italic, alignment sudah berjalan dengan baik dan
   realtime.
2. Color picker untuk shape sudah sesuai realtime.

### BUG-2, BUG-3, DEC-012 — Context menu & delete

1. Context menu belum muncul (klik kanan tidak menampilkan menu apa pun). Masih rusak.
2. Keyboard delete berfungsi untuk semua elemen KECUALI hasil seeder (harusnya bisa dihapus) —
   muncul error: `Cannot delete e2 — shipped and required elements are part of the template.`
   Ini berkaitan dengan makna tombol Reset|Save untuk canvas. Seeder seharusnya hanya jalan sekali
   di awal sekali (first launch), jadi seeder tidak bisa dijadikan acuan untuk Reset canvas. Reset
   seharusnya bermakna seperti "discard changes".
3. Text sudah bisa diubah pakai double-click, dan delete/backspace berjalan sesuai harapan
   (confirmed, untuk elemen non-seeder).

### BUG-7 — Image resize tidak mengikuti handle

1. Gambar sudah inserted sesuai ratio aslinya (aspect-ratio fix dari SPEC-12 dikonfirmasi bekerja
   di titik insert), tapi gambar hanya bisa "muncul" di area kotak tertentu — saat resize
   sebesar-besarnya, handle (persegi) di canvas sudah membesar sesuai drag, tapi gambar (contoh:
   QR code) yang dirender tetap kecil, tidak ikut membesar bersama handle-nya. [Image #3]

### DEC-011 (confirmed fixed)

1. Sudah sesuai untuk tombol-tombol di header dan rename.

### BUG-14 — Song Set tab height instability (masih ada)

1. Teks "(2/3 Formula)" sudah dihapus dari label tab — confirmed fixed.
2. Berpindah tab, canvas tetap naik-turun, karena badge `VERSE LAYOUT` ada di baris yang sama
   dengan teks banner `📐 Auto Lyric Box: 2/3 Height Standard — Automated formula for hymn
   lyrics. Canvas customizes background & shapes.`, dan banner ini multi-line — marginnya memaksa
   baris itu punya height lebih besar. Berlaku juga di `REFFRAIN LAYOUT`.

### BUG-15, DEC-009, DEC-010 — Song Set / Announcement Set layout parity

1. Layout New Song Set / New Announcement Set sudah sama dengan Main Spine — confirmed fixed.

### Title Card (BUG-15, DEC-011) — confirmed fixed

1. Sudah sesuai, sudah rapi.

### Peniadaan Header Duplikat & Stale Conflict (BUG-9) — confirmed fixed

1. Sudah sesuai.

### Stabilitas Label Active Set (BUG-16, sebagian)

1. Sudah stabil ukurannya ketika rename — confirmed fixed **untuk Announcement Set's "Active
   Announcement Set" label** secara spesifik. (Lihat Catatan Tambahan #4 di bawah: masalah height
   instability yang lebih umum tetap ada di tempat lain.)

---

## Catatan Tambahan (verbatim, dinomori pengguna)

1. Soal notification sukses/error: saat ini ada toaster DAN inline information. Toaster oke. Tapi
   inline information suka muncul di area yang membuat layout aplikasi berubah-ubah — contoh:
   tulisan `Template renamed` muncul di area yang tidak seharusnya, sehingga panel canvas menurun
   posisinya. [Image #4]
2. Button Reset canvas maunya sistemnya seperti discard perubahan, bukan reset ke seeder. Sehingga
   elemen hasil dari seeder juga bisa dihapus. Sama halnya background (karena gambar di canvas2
   seeder sekarang dianggap sebagai background yang bisa diganti) — harusnya dia bisa diganti-ganti,
   bukan malah ditumpuk.
3. Untuk properties text, tambahkan indentation untuk teks vertical, biar jarak antar baris bisa
   diatur — mungkin modelnya slider saja, ketika diubah dia realtime render di canvas pada teks
   yang selected. Modelnya bebas, sudah pasti icon-only untuk tombolnya. Tambahkan juga efek shadow
   pada teks (berupa icon saja).
4. Ketika rename mode, height dari panel membesar — tidak suka posisi tata letak berubah-ubah.
   Berlaku untuk di Main Spine, Song Books, Announcement Sets. Di title Song Set lebih parah lagi,
   ada tambahan tulisan `TITLE:` sehingga makin membesar. [Image #5]
5. Untuk apa tulisan `Title`, `Verse`, `Reff` bisa diubah (rename)? Ada rename mode disini juga,
   dan berubah-ubah heightnya. Ini untuk apa sebenarnya — kalau tidak perlu, boleh dihapus.
6. Tombol "Apply to selection" — apakah berlaku untuk mengubah multiple element sekaligus? Kalau
   iya, tidak usah dihapus. Minta dipertegas fungsinya untuk apa.
7. Kode Song Set (`variableName`) belum bisa direname, harusnya bisa.
8. Song Set maunya bisa di-clone/duplikat, tujuannya agar tidak perlu menyesuaikan canvas ulang
   (jika mau semuanya sama).
9. Announcement Set: by default terpilih index pertama, tapi text-nya kosong — harusnya text-nya
   langsung muncul. Kalau di-trigger rename, baru muncul. [Image #6, #7, #8]

---

## Investigasi yang sudah dilakukan sesi ini (read-only, tidak ada perubahan kode)

Dua poin di atas (#5 dan #6) diminta untuk DIJAWAB, bukan sekadar dicatat sebagai bug. Hasil
pembacaan kode (tidak ada perubahan):

- **#6 "Apply to selection" — TETAP DIPERTAHANKAN.** `applyTextStyle`
  (`src/components/admin/ArtifactEditor.tsx:1133-1150`) melakukan
  `canvas.getActiveObjects()` lalu men-`set` `{ fill, fontSize, underline }` ke SETIAP objek teks
  yang sedang dipilih — jadi tombol ini memang untuk bulk-apply ke multi-selection. Kontrol
  per-elemen tunggal (mis. `handleFontColorChange`) sudah realtime tanpa perlu tombol ini; tombol
  "Apply to selection" tetap perlu untuk kasus multi-select, sesuai hint teks yang sudah ada:
  `'Colour and size need "Apply to selection"; text applies as you type.'`
  (`src/lib/i18n/catalogue-en.ts:364-366`). Tidak ada tiket yang dibuka untuk ini.
- **#5 "Title"/"Verse"/"Reff" rename — TEMUAN: kontrol ini kemungkinan besar vestigial (tidak
  berfungsi berarti) dan direkomendasikan DIHAPUS.** `createSongSetTrioAdapter()`
  (`src/lib/registry/canvas-adapters.ts:381-386`) mendefinisikan tiga role tetap
  (`id: 'title'|'verse'|'reff'`) dengan label yang HARDCODED sebagai konstanta UI
  (`{ id: 'title', label: 'Title' }`, dst.) — bukan field yang tersimpan/dapat di-rename. Rename
  control yang tampil di header editor untuk trio ini diwariskan dari komponen title-area generik
  yang sama dipakai Main Spine (yang memang punya `template.label` tersimpan & benar-benar
  renameable). Filed sebagai **BUG-23** di bawah: hapus kontrol Rename khusus untuk tiga tab trio
  ini (Song Set Title/Verse/Reff), pertahankan label statis "Title Slide"/"Verse Layout"/
  "Reffrain Layout". Ini juga menutup sebagian dari BUG-16 yang dibuka ulang (sumber salah satu
  instance height-instability).

---

## Pemetaan ke dokumen (hasil sesi ini)

| Temuan | Dokumen |
|---|---|
| BUG-1, BUG-2, BUG-7, BUG-8, BUG-11, BUG-14, BUG-15, BUG-16 | Dibuka ulang (`status: open`) di `.control/registry/defects.yaml`, dengan catatan regresi/sisa scope |
| Reset = discard, elemen seeder & background jadi bisa diganti (Catatan #2) | `DEC-014` (accepted 2026-09-08) + `BUG-18`, `BUG-19` baru |
| Inline notification menggeser layout (Catatan #1) | `BUG-20` baru |
| Line-height/indentation slider + text shadow (Catatan #3) | `BUG-22` baru |
| Title/Verse/Reff rename vestigial (Catatan #5) | `BUG-23` baru (folds ke BUG-16) |
| Apply to selection (Catatan #6) | Dijawab langsung di atas, tidak ada tiket |
| Song Set code belum bisa direname (Catatan #7) | Reopen `BUG-15` (sub-item b) |
| Song Set clone/duplicate (Catatan #8) | `BUG-24` baru — **dikoreksi saat `wdi-review` SPEC-13**: ternyata canvas Title/Verse/Reff itu SATU shared trio untuk semua Song Set (`AD-33`), jadi tidak ada apa pun per-entry untuk di-clone. Owner konfirmasi: masalah sebenarnya adalah UI-nya menyesatkan (terlihat seolah tiap entry punya canvas sendiri seperti Main Spine/Announcement Set). BUG-24 diubah jadi perbaikan kejelasan UI (shared-scope messaging), lihat `defects.yaml` dan tiket 13 |
| Announcement Set default text kosong (Catatan #9) | `BUG-21` baru |

Spec/tiket lanjutan: `.scratch/SPEC-13-artifacts-qa-followup-round2/SPEC.md` dan
`.scratch/SPEC-13-artifacts-qa-followup-round2/issues/`, terdaftar di
`.control/registry/specs.yaml` sebagai wave `SPEC-13` (`status: open`, belum ada mandate autopilot
— itu diputuskan di sesi `wdi-autopilot` terpisah).
