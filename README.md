# Proposal Pengembangan CorExa

Website proposal evaluasi, perbaikan, dan pengembangan CorExa untuk Program Studi S1 Akuntansi FEB Universitas Pancasila, disiapkan oleh CV Jaya Digital Konsultan.

Nilai paket jasa **Rp15.000.000**, dengan estimasi pelaksanaan delapan minggu dan pemeliharaan korektif 60 hari kalender sejak BAST.

## Hosting GitHub Pages

Repositori: [jayadigitalkonsultan-id/proposal-pengembangan-corexa](https://github.com/jayadigitalkonsultan-id/proposal-pengembangan-corexa).

Alamat website setelah deployment berhasil: <https://jayadigitalkonsultan-id.github.io/proposal-pengembangan-corexa/>.

1. Unggah perubahan ke branch `main`.
2. Di repositori, buka **Settings → Pages → Build and deployment**, lalu pilih **GitHub Actions** sebagai sumber.
3. Workflow **Publish proposal to GitHub Pages** berjalan setiap push ke `main`. Jika push dilakukan sebelum Pages diaktifkan, jalankan workflow kembali melalui **Actions → Publish proposal to GitHub Pages → Run workflow**.

Workflow menyalin file publik ke `dist/` dan menerbitkannya. Tidak perlu menjalankan npm, memasang browser, atau membuat ulang PDF pada runner GitHub. PDF terbaru yang sudah diverifikasi ikut diunggah dari repositori.

## File yang ditampilkan

| File | Kegunaan |
| --- | --- |
| `index.html` | Proposal web dan tombol unduh PDF formal |
| `company-profile.html` | Profil perusahaan |
| `formal-proposal.html` | Pratinjau dokumen formal |
| `Proposal-CorExa-JDK.pdf` | Proposal formal 28 halaman |
| `Lembar-Persetujuan-CorExa.pdf` | Persetujuan klien, dua halaman dengan kolom isian |
| `Form-Perubahan-Lingkup-CorExa.pdf` | Formulir perubahan lingkup/biaya tambahan |
| `Company-Profile-JDK.pdf` | Profil perusahaan versi PDF |
| `Proposal-CorExa-JDK.zip` | Paket dokumen untuk klien |

Website memakai tautan relatif sehingga unduhan dan perpindahan halaman berfungsi pada subdirektori GitHub Pages. Kolom PDF dapat diisi dan disimpan melalui pembaca PDF yang mendukung formulir; persetujuan tidak dikirim otomatis oleh website.

## Memperbarui isi

- `tools/build-document.mjs`: isi proposal web dan alokasi biaya.
- `tools/build-formal-proposal.mjs`: susunan PDF formal dan formulir PDF.
- `content/commercial-terms.json`: parameter ketentuan komersial.
- `content/technical-details.json`: rincian teknis dan data perusahaan.
- `content/editorial.css`, `content/proposal.css`: desain website.
- `content/formal-proposal.css`: tata letak formal A4.

Pembuatan ulang PDF dan pemeriksaan visual menggunakan Node.js, dependensi pada `package-lock.json`, serta Google Chrome pada lingkungan Windows yang digunakan proyek ini.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run verify
node tools/prepare-pages.mjs
```

Setelah isi diperbarui, buat ulang paket ZIP dokumen sebelum push agar HTML, PDF, dan paket unduhan memakai revisi yang sama.

## Sumber dan lisensi

Isi mengacu pada surat 061/UM/Ka.Prodi/FEB/X/2026 tanggal 20 Oktober 2026, company profile perusahaan yang diberikan, dan logo asli JDK. Dokumen sumber asli serta hasil ekstraksi lokal tidak termasuk artefak hosting. Font Manrope menggunakan SIL Open Font License yang disertakan pada HTML dan paket publik.
