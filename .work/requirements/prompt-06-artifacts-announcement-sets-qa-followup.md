# Prompt 06 — QA Manual Follow-up: Artifacts > Announcement Sets (pasca W11 Artifacts Overhaul)

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

(catatan: judul sub-bagian ini persis seperti ditulis pengguna — "NEW SONG SET AREA" — meski
konteksnya adalah Announcement Set; kemungkinan salin-tempel dari bagian Song Set. Jangan
diperbaiki di sini, tapi ditandai saat perumusan spek karena ini area Announcement Set.)

1. Maunya disamakan dengan main spine dari sisi tata layout, ada tulisan `New Announcement Set`
   Kecil sama persis dengan yang ada di main spine - tujuannya agar keseragaman UI/UX
2. Lalu dibawahnyalah baru ada:
   - Text field untuk Judul Announcement set
   - tombol [+ Add] - buat seragamnya apa, apa rule design system kita? apakah misal harusnya
     New? Add? Insert? kapan dia new, add, insert? - agar dibakukan design systemnya / UX nya.
3. Warna tombol add masih abu2 (sama persis dengan yang ada di song set)

### SLIDES IN SET

1. Ini sudah oke di atasnya ada Active Announcement Set
2. Cuma Ketika rename, dia teks `Active Announcement Set`nya berpindah tempat, bagaimana
   mencegah itu?
3. Untuk dropdown predefined placeholder, harusnya on selected dan on listed item, teksnya
   harusnya sama. ILni sama persis dengan yang ada di dropdown list lainnya.

### TITLE AREA

1. Ketika active rename mode, height dari title area berubaah, jadinya canvasnya terdorong
   Ketika mode rename dan selesai mode rename
2. Kenapa ada 2 title area? harusnya cuma 1 toh? title area untuk slides in set [Image #10]

---

## Catatan referensi gambar (deskripsi tekstual, karena file tidak disalin ke repo)

- **Image #9**: tab "Announcement Sets" aktif. Panel kiri: tombol besar `+ Add New Announcement
  Set` (abu-abu terang), lalu "ACTIVE ANNOUNCEMENT SET" dengan `Rename · Delete` dan sebuah
  dropdown kosong di bawahnya, lalu "Slides in Set" (`+ Add Slide`) dengan 6 slide contoh (data
  dummy "asdasdas", "asdasd", dst — bukan konten produksi, kemungkinan besar dipakai murni untuk
  uji coba UI). Panel kanan menampilkan **dua** blok judul bertumpuk: blok atas "asdasdas [set:
  Opening Announcement]" dengan tombol `Rename`, dan blok bawah "asdasdas [general]" dengan
  `Rename Save` — inilah yang dimaksud poin "Kenapa ada 2 title area?".
- **Image #10**: skenario sama seperti Image #9 tapi dengan data judul berbeda ("Satu" / "Satu")
  dan menampilkan pesan error merah: "Slide was modified by another session. Nothing was saved:
  the editor reloaded the version that is on the server, so any elements you added or deleted in
  this session — and any unsaved moves — have been discarded. Re-apply them on the reloaded
  template." — pesan ini tampil di bawah blok judul kedua ("Satu [general]"), di atas toolbar
  `Add:`. Pesan concurrency ini muncul sebagai temuan tambahan yang terlihat di screenshot,
  meskipun tidak disebut eksplisit di poin manapun oleh pengguna — dicatat di sini agar tidak
  hilang, untuk diklarifikasi saat diskusi (apakah ini reproducible bug yang perlu diangkat
  terpisah, atau race condition insidental saat testing).

Urutan `[Image #N]` mengikuti urutan yang disebut pengguna di teks aslinya.
