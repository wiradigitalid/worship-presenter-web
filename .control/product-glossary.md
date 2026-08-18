# Product Glossary

**Dimuat saat:** menulis dokumen apa pun di korpus.

SSOT kosakata **produk** — apa yang produk ini bicarakan. Tiap istilah didefinisikan **sekali** di
sini, lalu dipakai apa adanya di seluruh korpus.

Kosakata **metode** tinggal di `.constitution/method-glossary.md` dan MUST NOT didefinisikan ulang di
sini. Tes pemisahnya: apakah istilah ini tetap berlaku kalau dipakai di produk lain? Ya →
`method-glossary.md`, tidak → sini.

## Aturan

- Istilah baru yang muncul di dokumen mana pun MUST ditambahkan ke sini **dalam lintasan yang sama**.
- Definisi MUST menyebut hubungan ke istilah lain dan kardinalitasnya bila relevan.
- Satu istilah MUST NOT punya dua entri.
- Berkas ini lahir **kosong** dan diisi dari produknya. Entri pertamanya lahir bersama brief di G1.

## Entri

**Admin** — pemegang akun yang mengelola akses dan pengaturan Hub. Bukan Operator saat menayangkan.

**Deck** — presentasi yang digenerate untuk satu Service, dijamin sebagai PPTX offline.

**Events** — kelompok terpisah dari Operator; menyerahkan Rundown (peserta, lagu, poster, pengumuman) lewat Telegram.

**Hub** — daftar Service berlogin untuk review, edit, generate ulang, dan unduh PPTX. Bukan situs publik.

**Jemaat** — penerima tayangan. Tidak pernah membuka produk.

**Operator** — anggota tim multimedia yang mereview Service di Hub dan menayangkannya pada Sabbath. Pengguna **primary**.

**picoclaw** — agen yang membaca Rundown di Telegram dan memanggil API. Bukan antarmuka Operator.

**PPTX** — berkas OpenXML yang diunduh sebelum ibadah; jaminan Sabbath independen dari internet venue.

**Run-Sheet** — tampilan web urutan ibadah lengkap satu Service (peran, nama, lagu, waktu) untuk Operator, bukan untuk layar Jemaat.

**Rundown** — teks semi-terstruktur yang Events kirim, menggambarkan urutan satu Service.

**Sabbath** — hari ibadah mingguan tempat Deck ditayangkan.

**Service** — satu ibadah bertanggal; unit yang dikelola sistem. Satu Service memiliki satu payload minggu, satu Deck, satu Run-Sheet, dan gambar unggahannya.

**Song Book** — sumber lirik (judul + bait/reff) yang di-ship sebagai seed, diindeks nomor dalam buku itu. Bukan hasil cari web.

**Telegram** — saluran masukan yang Events sudah pakai; bukan antarmuka Operator.
