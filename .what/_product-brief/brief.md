---
title: "Worship Presenter Web"
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# Product Brief: Worship Presenter Web

Klien: **Church Name**. Identitas terstruktur: `.control/registry/index.yaml`.

## Executive Summary

Setiap Sabbath, Operator menayangkan Deck ibadah ~68 slide. Hari ini satu orang merakitnya dengan tangan: salin berkas minggu lalu, ganti lagu, nama, poster, pengumuman. Kira-kira satu jam seminggu — ~52 jam setahun — dari relawan yang sebenarnya bisa dipakai untuk hal lain. Hanya orang itu yang bisa mengerjakannya. Perubahan mendadak hampir tidak masuk. Perangkat lunak worship siap-pakai yang pernah dicoba gagal karena harus diinstal di laptop Operator, lalu hanya satu orang yang paham.

Produk ini mengubah Deck mingguan menjadi **artefak yang digenerate**. Events mengirim Rundown ke saluran yang sudah mereka pakai (Telegram). picoclaw membaca itu dan memanggil API. Aplikasi merakit presentasi dari kerangka tetap plus isi minggu itu, menampilkan Service bertanggal di Hub berlogin untuk review Jumat, dan menghasilkan **PPTX offline** supaya Sabbath tidak bergantung internet venue.

Janji ini sempit dan jujur: jam merakit hilang, giliran Operator melebar ke siapa pun di tim multimedia, dan alatnya **dipakai tiap minggu** — bukan percobaan yang ditinggalkan.

## The Problem

Satu relawan merakit ulang Deck Sabbath setiap minggu. Kerja itu rapuh di empat titik:

- **Lirik adalah lubang waktu dan lubang salah.** Empat himne menjadi puluhan slide yang diketik tangan. Typo pernah tampil di depan Jemaat.
- **Perubahan mendadak hampir mustahil.** Tukar lagu Sabtu pagi, dalam alur salin-tempel, praktis tidak terjadi.
- **Sisa minggu lalu lolos.** Deck baru dimulai dari berkas lama; konten usang kadang ikut ke layar.
- **Kontinuitas di satu orang.** Hanya pembangun saat ini yang bisa menghasilkan Deck. Tiap ganti orang, setup hilang dan alat diganti.

Status quo jalan, tetapi memakan ~52 jam setahun, menahan orang terampil di data-entry, menolak perubahan terlambat, dan pecah ketika orangnya berganti.

## The Solution

Aplikasi web yang merakit Deck dari Rundown, bukan dari berkas PowerPoint minggu lalu.

1. **Kumpul.** Events mengirim peserta, nomor himne, poster, dan instruksi pengumuman lewat Telegram — tanpa perangkat lunak presentasi.
2. **Tafsir.** picoclaw memanggil API: isi payload minggu itu, resolve lirik dari Song Book menurut nomor (bukan cari bebas di web), unggah gambar.
3. **Rakit.** Aplikasi menggabungkan kerangka tetap (pembuka, pembagi, liturgi, persembahan, penutup) dengan isi variabel (lagu, ayat, khotbah, keluarga/pemuda, flyer). Tiap minggu adalah satu **Service** bertanggal.
4. **Review Jumat.** Operator membuka Hub, mencocokkan Run-Sheet dan data, mengedit jika salah, generate ulang, mengunduh PPTX ke laptop presentasi.
5. **Sabbath.** Operator menayangkan berkas yang sudah diunduh. Projector bersih; laptop Operator menampilkan presenter view (slide kini/berikut + Run-Sheet). Internet venue boleh mati.
6. **Bersih.** Service dan asetnya bisa dihapus per minggu agar penyimpanan tidak tumbuh tanpa batas.

Hub adalah daftar Service berlogin — bukan situs publik. Slideshow di browser adalah pelengkap; **jaminan Sabbath adalah PPTX offline**.

## What Makes This Different

Bukan karena bisa generate slide — FreeWorship, OpenLP, ProPresenter sudah bisa. Bedanya *cara orang sampai ke situ*:

- **Nol instal di laptop Operator.** Alasan percobaan desktop ditinggalkan.
- **Masukan di Telegram**, tempat Events sudah berkoordinasi.
- **Tidak ada penjaga gerbang tunggal.** Pengetahuan ada di alur, bukan di satu laptop.
- **Deck mengikuti pakem jemaat ini**, bukan memaksa ibadah ke struktur alat generik.
- **Revisi cepat.** Ubah isian, generate ulang.

Alasan lain yang jujur: **kepemilikan** — pengembang solo menguasai kerangka dan punya fondasi untuk otomasi mekanis berikutnya. Itu bukan moat teknis.

## Who This Serves

| Role | Need | Tier |
|---|---|---|
| Operator (tim multimedia) | Menjalankan Sabbath tanpa harus bisa merakit 68 slide; review Jumat ≤ 10 menit; PPTX offline di laptop venue | **primary** |
| Events | Menyerahkan Rundown seperti mengirim chat; tidak membuka perangkat lunak presentasi | secondary |
| Admin | Mengelola akun dan pengaturan tanpa mengasuh sistem tiap minggu | secondary |
| Pengembang solo | Merawat ketiga lapisan (skill picoclaw, API, Hub) sendirian | secondary |
| Klien (Church Name) | Ibadah tertayang benar tiap Sabbath, tanpa ketergantungan pada satu relawan | secondary |
| Jemaat | Tidak pernah membuka alat; merasakan layar yang lebih bersih dan perubahan terlambat yang masih sempat masuk | secondary |

## Goals

- **BG-1** — Deck Sabbath digenerate dari Rundown, bukan dirakit tangan, setiap minggu.
- **BG-2** — Siapa pun di rotasi multimedia bisa mereview dan menayangkan Service, tanpa keahlian merakit Deck.
- **BG-3** — Sabbath tidak bergantung internet venue: PPTX sudah di laptop sebelum ibadah.

## Success Criteria

Ukuran utama: gereja memakainya **setiap Sabbath selama satu kuartal (~13 minggu beruntun)**.

Pendukung: merakit tangan ~1 jam menjadi review Jumat ≤ 10 menit; giliran Operator tidak lagi = orang yang bisa PowerPoint; tukar lagu terlambat regenerate ≤ 5 menit; tidak ada sisa konten minggu lalu di layar; lirik datang dari Song Book, bukan ketikan.

## Scope

### Scope In

- Intake Telegram → picoclaw → API.
- Lirik dari Song Book menurut nomor; bukan pencarian lirik bebas.
- Generate Deck: judul lagu + lirik, ayat, khotbah + grafis, keluarga/pemuda, gambar pengumuman yang sudah jadi. Hanya nama yang memang tercetak di Deck.
- Hub berlogin: daftar Service, preview, edit-dan-generate-ulang, unduh PPTX, hapus per minggu.
- Run-Sheet urutan ibadah lengkap (peran, nama, lagu, waktu) untuk Operator.
- Presenter view: projector bersih + layar Operator (kini/berikut + Run-Sheet).
- Satu transisi fade.

### Scope Out

- Multi-gereja / alur per-gereja yang bisa dikonfigurasi.
- Lagu kontemporer di luar Song Book.
- Generate flyer dari data (flyer diunggah sudah jadi).
- Mencetak peran peserta yang Deck tidak tampilkan (itu di Run-Sheet).
- Banyak jenis transisi.
- Kendali live ala ProPresenter (urut ulang di atas panggung); produk menghasilkan Deck linear.

## Constraints

- Hub **bukan publik**; akses berakun.
- Tayangan Sabbath **tidak boleh** bergantung internet venue — PPTX offline adalah jaminan, bukan cadangan opsional.
- Repo ini **publik**: data Jemaat, foto, doa, pembayaran, dan Deck sumber **tidak** masuk git.
- Lirik **hanya** dari Song Book yang di-ship; bukan unggahan bebas atau web search.
- Masukan Events tetap di saluran yang sudah mereka pakai; produk tidak memaksa mereka membuka tool baru untuk *menyerahkan* Rundown.

## Assumptions

- [ASSUMPTION] Events akan terus mengirim Rundown dalam bentuk yang parseable seperti sekarang. Salah: intake pecah, Operator terpaksa ketik form tiap minggu. (OQ-1)
- [ASSUMPTION] Satu gereja, satu alur ibadah, untuk cakupan produk ini. Salah: Scope In tidak cukup; itu kerja produk kedua atau PRD baru. (OQ-2)
- [ASSUMPTION] Venue punya laptop yang bisa memutar PPTX (PowerPoint atau padanan). Salah: jaminan offline tidak tertunaikan. (OQ-3)

## Prerequisites

- Korpus Song Book (dan terjemahan kitab yang di-ship) ada di repo — sudah terpenuhi.
- Rahasia `AUTH_SECRET` / `WEBHOOK_SECRET` dan path tahan lama untuk basis data di host — belum terpenuhi; menunggu host produksi (OQ-4 di `.control/questions/external.md`). Syarat go-live, bukan G1.

## Vision

Kalau ini menempel, pola yang sama — masukan di tempat orang sudah bicara, tafsir, rakit, Hub, cadangan offline — dipakai untuk kerja mekanis gereja berikutnya. Gereja lain punya alur lain; konfigurasi per-jemaat adalah visi, bukan Scope In.
