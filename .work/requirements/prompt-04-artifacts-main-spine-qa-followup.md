# Prompt 04 — QA Manual Follow-up: Artifacts > Main Spine (pasca W11 Artifacts Overhaul)

- **Tanggal dicatat:** 2026-09-08
- **Sumber:** Prompt pengguna (mentah), hasil test manual pasca commit `68e95c3` (merge W11 Artifacts overhaul,
  mandate DEC-008)
- **Gambar Referensi:** disertakan pengguna sebagai attachment sesi (path temp lokal, TIDAK disalin ke
  repo — lihat catatan kebijakan repo publik di `.work/requirements/README.md`; dua di antaranya
  menampilkan data pembayaran/QR pada slide "Break Time" contoh, dan status sintetis/realnya belum
  diverifikasi, jadi berkas gambar sengaja tidak dibawa masuk ke repo)
- **Status:** Raw Requirement (menunggu review & perumusan defect/spek/tiket/TDD)
- **Konteks:** Bug/request ini ditemukan lewat test manual atas hasil W11-01..W11-06 (lihat
  `.control/decisions/DEC-008-autopilot-artifacts-overhaul.md`,
  `.control/memlog/autopilot-DEC-008.md`, `_bmad-output/specs/spec-w11-artifacts-overhaul/`).
  Pengguna secara eksplisit meminta: TIDAK ADA CODING pada tahap ini — fokus tindak lanjut adalah ke
  dokumen (defect/FR/UC) dan penyiapan spek/tiket/TDD lanjutan, agar bisa dieksekusi lewat sesi
  `wdi-autopilot` terpisah. Boleh dipetakan ke defect/spek/tiket/TDD baru ATAU yang sudah ada.

---

## Kutipan mentah dari pengguna (verbatim)

### PAGE LAYOUT

1. Height dari page layout harusnya 100% terhadap screen / window, tapi memang harus ada minimal
   height agar canvas terender dengan baik secara full. Saat ini area saya itu sudah luas sekali,
   tapi entah kenapa ada scroll dari page/windownya, dan Ketika saya scroll cuma ada sedikit area
   deck sequence yang ada. Bukan berarti kalua height window/page dia jadi kecil sekali, karena
   harusnya ada minimal height agar seluruh area editor canvas bisa terlihat [Image #3]

### NEW SLIDE AREA

1. Sudah sesuai harapan ada dropdown slide type dan button add
2. Untuk dropdown, harusnya on selected dan on listed item, teksnya harusnya sama. Contoh missal
   saya pilih bible talk opening song, tapi pas selected malah munculnya
   `song:opening_song_bt`, sepertinya ini soal key vs teks, harusnya secara visual tetap teks,
   tapi secara value yah tetap key. [Image #4]
3. Tombol Add warnanya abu2 dan tulisan putih -> sulit dibaca. saat on hover warna button berubah
   menjadi primary. Coba riset soal baik benarnya bagaimana untuk desain system terbaik. Agar
   menjadi acuan yang seragam untuk case serupa di tempat lain. [Image #2]

### DECK SEQUENCE AREA

- Kenapa belum bisa model drag move and release -> agar bisa memindahkan dengan cepat (saya gak
  tahu nama fitur umumnya)

### TITLE AREA

- Sudah sesuai by default title gak bisa diedit, harus klik tombol rename
- Tombol default sudah tepat ada [Rename] [Reset] [Save], tapi kasih batas antara Rename dengan
  kedua tombol lainnya, seperti ini: `[Rename] | Canvas: [Reset] [Save]`, tujuannya agar jelas
  mana action untuk title, mana action untuk canvas. Sepertinya perlu juga ada label Canvas
  disitu.
- Ketika rename di klik, maka tombol2nya harusnya menjadi seperti ini: `[Cancel] [Save] |
  Canvas: [Reset] [Save]`

### TOOLBAR ELEMENT

1. Text dan rectangle, gak perlu ada Tulisan `(Drag)`, cukup: icon Text, icon Rectangle, icon
   image. Tanpa perlu ada teksnya.
2. Change background iconnya jangan itu, kok seperti color picker. dan textnya cukup begini:
   `[icon image] Background` -> tulisan backgroundnya dihilangkan.
3. Untuk dropdown predefined placeholder, harusnya on selected dan on listed item, teksnya
   harusnya sama (cek dropdown di new slide area)
4. Urutan toolbar harusnya: `Add: [Icon Teks] [Icon shape] [Icon Image] | [Icon Image + Teks
   Background] | [Dropdown predefined placeholder] [Button dengan teks + Placeholder]`
5. Ketika menambahkan image, kenapa ukurannya salah, terlalu gepeng, harusnya rationnya apa
   adanya si gambar [Image #6]

### TOOLBAR ELEMENT PROPERTIES

1. Saat ini muncul Ketika on selected item yang memiliki properties, sehingga posisi canvas
   secara visual naik turun, karena hide/show element properties -> harusnya element properties
   tetap muncul fixed tanpa hide/show. Mungkin isinya jika tidak ada property di elemnt yang
   dipilih, atau jika tidak ada element yang dipilih:
   `Properties (Image): No properties to change`, `Properties (None): Select element first`
2. Untuk font size agar besarin widthnya agar bisa menampung ukuran ratusan dengan baik. Font
   size belum bisa mengubah element secara realtime (tidak terjadi apapun Ketika saya edit font
   size)
3. Bold, italic sudah berjalan dengan baik. Tapi belum ada underline.
4. Font color belum berjalan, saya sudah coba ubah color tidak berubah.
5. Shape color sudah berjalan untuk mengubah, tapi pas saya pilih element shape, maunya color
   langsung menyesuaikan dengan warna eksisting, saat ini warna malah Kembali ke warna default
   (untuk color pickernya)

### CANVAS

1. Harusnya Ketika kita select sebuah element, bisa langsung klik keyboard delete untuk
   menghapus. Saat ini tidak ada fitur delete tersedia.
2. Klik kanan harusnya ada context menu custom untuk: (a) alignment: send/bring forward/back;
   (b) duplicated/clone; (c) delete. Saat ini tidak ada fitur alignement, duplicate/clone dan
   delete

---

## Catatan referensi gambar (deskripsi tekstual, karena file tidak disalin ke repo)

- **Image #1** (screenshot lebar, tab "Main spine" aktif): halaman "Welcome [general]" dengan
  panel kiri "NEW SLIDE" (dropdown `general` + tombol `+ Add` abu-abu/teks putih), "Deck Sequence"
  (41 slides, daftar card), dan area kanan toolbar `Add: T Text (Drag) | Rectangle (Drag) | Image
  | service_date dropdown | + Placeholder` + `Change Background` (ikon mirip color picker), lalu
  canvas preview slide "Welcome to BANDUNG INTERNATIONAL COMMUNITY {service_date}".
- **Image #2**: sama seperti Image #1 pada resolusi/skala browser berbeda — dipakai untuk
  menunjukkan tombol `+ Add` abu-abu dengan teks putih (kontras buruk).
- **Image #3**: dropdown "NEW SLIDE" terbuka, menampilkan list `General Slide (Canvas)` (dicentang),
  `Bible Talk Opening Song`, `Bible Talk Closing Song`, `Divine Service Opening Song`, `Divine
  Service Closing Song`, `Opening Announcement` — tapi ketika item seperti "Bible Talk Opening
  Song" dipilih, kotak dropdown menampilkan `song:opening_song_bt` (key), bukan label yang sama
  seperti pada list.
- **Image #4**: identik dengan Image #3 (dropdown terbuka, list item sama) — dipakai sebagai bukti
  kedua untuk poin key-vs-label yang sama.
- **Image #5**: slide "Break Time" pada canvas, dengan elemen image (QR code) terselect (handle
  seleksi terlihat), rasio gambar QR tampak gepeng/melebar secara horizontal dibanding rasio asli
  gambarnya; ada teks placeholder `Bank Mandiri`, nomor rekening, dan nama gereja contoh di bawah
  QR — konten ini contoh/dummy pada data uji, bukan diminta untuk disalin ke repo.

Urutan penomoran `[Image #N]` pada kutipan mengikuti urutan yang disebut pengguna di teks, bukan
urutan lampiran asli — dicocokkan sebaik mungkin berdasarkan konten yang dideskripsikan pada tiap
poin.
