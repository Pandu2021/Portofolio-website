# Panduan Keamanan Repository GitHub (Tahap 1)

Repository: `Pandu2021/Portofolio-website` · Audit: 16 November 2026

Panduan ini **hanya** membahas pengaturan repository di GitHub (siapa boleh push, merge, menghapus
branch, menjalankan Actions, dan sebagainya). Perbaikan keamanan di dalam kode (logika, hardcode)
adalah **tahap 2** dan belum dibahas di sini.

---

## 1. Konsep dasar: siapa bisa clone, commit, dan push?

| Aksi                      | Siapa yang bisa?                                                                                                       | Cara mengendalikannya                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Clone / lihat kode**    | Repo **public**: semua orang. Repo **private**: hanya kamu dan collaborator.                                           | _Settings → General → Danger Zone → Change visibility_                   |
| **Commit**                | Siapa pun bisa commit di **komputernya sendiri** (itu tidak bisa dicegah). Yang penting: commit itu tidak masuk ke repo kamu. | —                                                                        |
| **Push ke repo kamu**     | Hanya akun dengan izin _Write_ ke atas (kamu + collaborator). Orang lain **tidak bisa push**.                          | _Settings → Collaborators_                                               |
| **Fork + Pull Request**   | Semua orang (repo public). PR hanyalah **usulan**; tidak masuk tanpa kamu klik merge.                                  | Rulesets + persetujuan workflow untuk kontributor luar                   |
| **Force-push / hapus `main`** | Kamu sendiri (bisa tidak sengaja) atau collaborator.                                                               | _Settings → Rules → Rulesets_                                            |

> **Kesimpulan:** orang asing **sudah tidak bisa** push atau mengubah kode kamu. Yang perlu dikunci
> adalah: (1) branch `main` agar tidak bisa dihapus / di-force-push, (2) GitHub Actions agar tidak
> bisa disalahgunakan lewat PR dari luar, (3) akun kamu sendiri (2FA, token, SSH key).

### Apakah repo perlu dijadikan private agar tidak bisa di-clone?

**Rekomendasi: tetap public.** Alasannya:

1. Website kamu dihosting di **GitHub Pages** dengan akun **Free**. Pages dari repo private butuh
   GitHub Pro — kalau repo dijadikan private, **website portofolio akan mati**.
2. Ini portofolio untuk melamar kerja; recruiter justru perlu bisa melihat kodenya.
3. Secret scanning, CodeQL, dan Dependabot gratis untuk repo public.

Yang penting bukan "tidak bisa dilihat", tetapi "tidak bisa diubah tanpa izin" dan "tidak ada data
rahasia di dalamnya" — keduanya sudah/akan diatur di bawah.

---

## 2. Hasil audit (read-only)

| #  | Pengaturan                                             | Status sekarang                        | Penilaian            |
| -- | ------------------------------------------------------ | -------------------------------------- | -------------------- |
| 1  | Visibility                                             | Public                                 | ✅ OK (lihat alasan) |
| 2  | Collaborator                                           | Hanya kamu (admin), tidak ada undangan | ✅ Aman              |
| 3  | 2FA akun                                               | Aktif                                  | ✅ Aman              |
| 4  | Deploy key / webhook                                   | Tidak ada                              | ✅ Aman              |
| 5  | Secret scanning + push protection                      | Aktif                                  | ✅ Aman              |
| 6  | Dependabot alerts + security updates                   | Aktif                                  | ✅ Aman              |
| 7  | CodeQL code scanning                                   | Aktif, 0 alert terbuka                 | ✅ Aman              |
| 8  | Private vulnerability reporting + `SECURITY.md`        | Aktif                                  | ✅ Aman              |
| 9  | Token default GitHub Actions                           | Read-only, tidak boleh approve PR      | ✅ Aman              |
| 10 | Environment `github-pages`                             | Hanya boleh deploy dari `main`         | ✅ Aman              |
| 11 | Actions dipin ke commit SHA                            | Semua sudah dipin                      | ✅ Aman              |
| 12 | **Perlindungan branch `main`**                         | **Tidak ada** (bisa dihapus/force-push) | ❌ **Prioritas 1**   |
| 13 | **Perlindungan tag**                                   | Tidak ada                              | ⚠️ Perlu             |
| 14 | **Actions yang diizinkan**                             | Semua action dari mana saja            | ⚠️ Perlu dibatasi    |
| 15 | **Wajib SHA pinning untuk Actions**                    | Tidak diwajibkan                       | ⚠️ Perlu             |
| 16 | **Approval workflow dari PR fork**                     | Hanya kontributor pertama kali         | ⚠️ Perlu diperketat  |
| 17 | Secret scanning pola non-provider & validity check     | Nonaktif                               | ⚠️ Aktifkan bila bisa |
| 18 | Wiki & Projects                                        | Aktif tapi tidak dipakai               | ⚠️ Matikan           |
| 19 | Hapus branch otomatis setelah merge                    | Nonaktif                               | ⚠️ Aktifkan          |
| 20 | Commit bertanda tangan (signed)                        | Kunci SSH sudah diunggah 15 Nov; commit terakhir masih unsigned | ⏳ Tunggu verifikasi |

---

## 3. Rencana perbaikan (dijalankan AI Agent setelah kamu setuju)

1. **Ruleset `Protect main`** (target: branch default)
   - Tidak boleh dihapus, tidak boleh force-push.
   - Perubahan harus lewat Pull Request, dan 4 cek CI harus lulus
     (`Format, lint, typecheck, test, audit`, `Build site`, `Browser E2E (Chrome)`,
     `Secret & privacy scan (full history)`).
   - **Bypass: hanya peran Admin (kamu)** — jadi kamu tetap bisa push langsung ke `main` seperti
     biasa, tetapi orang lain (termasuk Dependabot) wajib lewat PR + CI lulus.
2. **Ruleset `Protect tags`**: semua tag tidak bisa dibuat/diubah/dihapus kecuali oleh Admin.
3. **Actions**: hanya action buatan GitHub + `pnpm/action-setup` yang boleh jalan; wajib dipin ke SHA.
4. **PR dari fork**: workflow harus kamu setujui untuk **semua** kontributor luar.
5. **Secret scanning**: aktifkan pola non-provider & validity checks (jika tersedia di akun Free).
6. **Fitur tidak terpakai**: matikan Wiki & Projects; aktifkan hapus-branch-otomatis setelah merge.
7. **Signed commits**: belum diwajibkan. Setelah commit berikutnya terlihat "Verified" di GitHub,
   aturan "Require signed commits" bisa ditambahkan ke ruleset `Protect main`.

Semua perubahan bisa dibatalkan (lihat bagian 6).

### Status penerapan — 16 November 2026

| Langkah | Hasil |
| ------- | ----- |
| 1. Ruleset `Protect main` | ✅ Aktif (bypass: Admin) |
| 2. Ruleset `Protect tags` | ✅ Aktif (bypass: Admin) |
| 3. Actions dibatasi + wajib SHA | ✅ Aktif — uji CI manual: 4/4 job lulus |
| 4. Approval PR fork untuk semua kontributor luar | ✅ Aktif |
| 5. Secret scanning non-provider & validity checks | ❌ Tidak tersedia di akun Free (butuh GitHub Secret Protection berbayar); fitur inti secret scanning + push protection tetap aktif |
| 6. Wiki & Projects off, hapus branch otomatis | ✅ Aktif |
| 7. Signed commits | ⏳ Menunggu commit pertama yang "Verified" |

---

## 4. Prompt untuk AI Agent (bisa dipakai ulang kapan saja)

Salin teks di bawah ke Claude Code (di folder repo ini) untuk audit ulang berkala, misalnya tiap bulan:

```text
Peran: kamu adalah GitHub Repository Security Auditor & Hardening Agent.
Repository: Pandu2021/Portofolio-website (pakai `gh` CLI yang sudah login).

RUANG LINGKUP (WAJIB DIPATUHI)
- Hanya pengaturan repository & akun GitHub. JANGAN mengubah file kode, workflow,
  atau melakukan commit/push. Keamanan kode (logika/hardcode) adalah tahap berikutnya.
- JANGAN mengubah visibility repo, menghapus apa pun, menghapus collaborator,
  atau mencabut key/token tanpa izin eksplisit saya per item.
- JANGAN menampilkan nilai secret/token; cukup nama dan tanggalnya.
- Website dihosting di GitHub Pages (akun Free) — jangan jadikan repo private.

LANGKAH 1 — AUDIT (read-only, tanpa izin)
Periksa dengan `gh api` dan laporkan dalam tabel (pengaturan | status | aman/perlu diperbaiki):
1. Visibility, fitur repo (wiki, projects, discussions), opsi merge, delete_branch_on_merge.
2. Collaborator, undangan tertunda, deploy key, webhook, GitHub App yang terpasang.
3. Branch protection & rulesets untuk `main` dan tag.
4. security_and_analysis: secret scanning, push protection, non-provider patterns,
   validity checks, Dependabot alerts & security updates, private vulnerability reporting.
5. Alert terbuka: Dependabot, code scanning, secret scanning (jumlah + tingkat keparahan).
6. Actions: allowed_actions, sha_pinning_required, default_workflow_permissions,
   can_approve_pull_request_reviews, fork PR approval policy, daftar secret (nama saja).
7. Environment & deployment branch policy (github-pages), pengaturan Pages (HTTPS).
8. Akun: 2FA, SSH key & signing key (judul + tanggal), status verifikasi 5 commit terakhir.
9. Bandingkan dengan target di bawah dan tulis daftar perubahan yang diusulkan.

LANGKAH 2 — MINTA IZIN
Tampilkan daftar perubahan + dampaknya + cara rollback. Tunggu jawaban "ya" dari saya.

LANGKAH 3 — TERAPKAN (setelah izin) — TARGET KONFIGURASI
a. Ruleset "Protect main" (target ~DEFAULT_BRANCH, enforcement active):
   deletion, non_fast_forward, pull_request (0 approval, resolve thread wajib),
   required_status_checks berisi nama job CI saat PR:
   "Format, lint, typecheck, test, audit", "Build site", "Browser E2E (Chrome)",
   "Secret & privacy scan (full history)".
   bypass_actors: RepositoryRole admin (actor_id 5), bypass_mode "always".
   Tambahkan required_signatures HANYA jika commit terakhir saya sudah "verified".
b. Ruleset "Protect tags" (target tag ~ALL): creation, update, deletion; bypass admin.
c. Actions: allowed_actions "selected" (github_owned_allowed=true,
   patterns_allowed=["pnpm/action-setup@*"]), sha_pinning_required=true.
   Sebelum menerapkan, cek semua `uses:` di .github/workflows sudah ada di whitelist.
d. Fork PR approval policy: "all_external_contributors".
e. Secret scanning non-provider patterns + validity checks: enabled (lapor jika tidak tersedia).
f. has_wiki=false, has_projects=false, delete_branch_on_merge=true.
Simpan snapshot pengaturan SEBELUM perubahan ke folder scratchpad untuk rollback.

LANGKAH 4 — VERIFIKASI
Baca ulang semua pengaturan, pastikan sesuai target, pastikan workflow Deploy terakhir
masih sukses dan website https://pandu2021.github.io/Portofolio-website/ masih bisa dibuka.
Laporkan: yang berhasil, yang gagal (beserta pesan error), dan yang harus saya lakukan manual.

Gunakan Bahasa Indonesia yang sederhana dalam laporan.
```

---

## 5. Yang tetap harus kamu cek sendiri (tidak bisa/tidak boleh dilakukan AI)

Ini menyangkut keamanan akun, jadi lakukan sendiri ±5 menit, sebulan sekali:

1. **Recovery codes 2FA** tersimpan aman (GitHub → _Settings → Password and authentication_).
   Tambahkan **passkey** bila belum.
2. **Token pribadi (PAT)**: hapus yang tidak dipakai — _Settings → Developer settings → Personal access tokens_.
3. **Aplikasi yang diberi akses**: cabut yang tidak dikenal — _Settings → Applications_
   (tab _Authorized OAuth Apps_ dan _Authorized GitHub Apps_).
4. **SSH & signing keys**: hapus yang tidak dikenal — _Settings → SSH and GPG keys_.
5. **Sesi login**: keluarkan perangkat yang tidak dikenal — _Settings → Sessions_.
6. **Email privacy**: aktifkan _Keep my email addresses private_ dan
   _Block command line pushes that expose my email_ — _Settings → Emails_.
7. **Vigilant mode** (tandai commit tak bertanda tangan sebagai "Unverified") —
   _Settings → SSH and GPG keys_, setelah commit bertanda tangan sudah berjalan.

---

## 6. Cara membatalkan (rollback)

| Perubahan              | Cara membatalkan                                                                 |
| ---------------------- | -------------------------------------------------------------------------------- |
| Ruleset                | _Settings → Rules → Rulesets_ → pilih → ubah ke **Disabled** atau hapus          |
| Actions yang diizinkan | _Settings → Actions → General_ → **Allow all actions**                           |
| Approval PR fork       | _Settings → Actions → General_ → _Approval for running fork pull request workflows_ |
| Wiki / Projects        | _Settings → General → Features_ → centang kembali                                 |
