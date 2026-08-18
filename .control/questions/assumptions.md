# Asumsi

**Dimuat saat:** disapu sekali per gate; boleh dilewati.

Kelas **default** sebuah pertanyaan. Agent mengambil jawabannya sendiri lalu mencatatnya di sini, satu
baris: asumsinya, plus akibat kalau ia salah. Berkas ini **tidak menahan apa pun**.

Sebuah baris di sini MUST naik ke `blocking.md` begitu ia lulus salah satu dari tiga tes yang berkas
itu nyatakan.

## Terbuka

| id | Asumsi | Akibat kalau salah | Diambil | Oleh |
|---|---|---|---|---|
| OQ-1 | Events akan terus mengirim Rundown dalam bentuk yang parseable seperti sekarang. | Intake pecah; Operator terpaksa ketik form tiap minggu. | 2026-08-18 | agent |
| OQ-2 | Satu gereja, satu alur ibadah, untuk cakupan produk ini. | Scope In tidak cukup; itu kerja produk kedua atau PRD baru. | 2026-08-18 | agent |
| OQ-3 | Venue punya laptop yang bisa memutar PPTX (PowerPoint atau padanan). | Jaminan offline (BG-3) tidak tertunaikan. | 2026-08-18 | agent |
