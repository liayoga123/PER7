# ARKAVIA
**Academic Records, Knowledge, Assessment & Virtual Intelligence Archive**

> Platform akademik terpadu dengan Security Lab terintegrasi untuk praktikum Keamanan Sistem Informasi (KSI).

---

## Daftar Isi

1. [Tentang Project](#tentang-project)
2. [Stack Teknologi](#stack-teknologi)
3. [Struktur Direktori](#struktur-direktori)
4. [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
5. [Akun Demo](#akun-demo)
6. [Fitur Utama](#fitur-utama)
7. [Security Lab - Dua Kerentanan](#security-lab)
8. [Pengujian Otomatis](#pengujian-otomatis)
9. [Konfigurasi LAB_MODE](#konfigurasi-lab_mode)
10. [Untuk Dosen: Panduan Demonstrasi](#untuk-dosen-panduan-demonstrasi)

---

## Tentang Project

ARKAVIA adalah aplikasi web full-stack untuk manajemen akademik yang dirancang khusus untuk demonstrasi keamanan. Project ini memiliki:

- **Student Archive** - mahasiswa dapat melihat tugas, mengumpulkan jawaban, dan melacak nilai
- **Lecturer Studio** - dosen dapat memberi nilai dan memberikan umpan balik
- **Registry Control** - admin dapat mengelola akun dan memantau sistem
- **Knowledge Chamber** - forum diskusi akademik
- **Security Observatory** - pusat pemantauan keamanan real-time
- **Security Sandbox** - dua kerentanan yang sengaja dibuat untuk keperluan praktikum

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + React Router DOM |
| Backend | Node.js + Express 5 |
| Database | SQLite (via better-sqlite3) |
| Session | express-session + connect-sqlite3 |
| Auth | bcryptjs (password hashing) |
| Security | helmet, express-rate-limit, CORS |
| File Upload | multer (max 5MB, PDF/DOC/TXT only) |
| XSS Sanitization | DOMPurify (server-side via jsdom) |

---

## Struktur Direktori

```
PER7/
|-- backend/
|   |-- db/
|   |   |-- schema.sql          # Skema database SQLite
|   |   |-- seed.js             # Data sintetis
|   |   |-- database.js         # Koneksi database
|   |   `-- arkavia.db          # Database SQLite (auto-generated)
|   |-- middleware/
|   |   |-- auth.js             # requireAuth & requireRole
|   |   `-- audit.js            # writeAuditLog
|   |-- routes/
|   |   |-- auth.js             # Login, logout, /me
|   |   |-- users.js            # Profil & aktivitas user
|   |   |-- courses.js          # Daftar mata kuliah
|   |   |-- assignments.js      # Tugas & rubrik
|   |   |-- submissions.js      # Pengumpulan tugas + file upload
|   |   |-- forum.js            # Forum diskusi
|   |   |-- notifications.js    # Notifikasi pengguna
|   |   |-- admin.js            # Manajemen akun & audit log
|   |   |-- observatory.js      # Security monitoring
|   |   `-- lab.js              # Security Lab (IDOR + XSS)
|   |-- tests/
|   |   `-- run-tests.js        # 25 automated test cases
|   |-- uploads/                # File submission mahasiswa
|   |-- server.js               # Entry point backend
|   |-- .env                    # Konfigurasi environment
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- LoginPage.jsx
|   |   |   |-- DashboardPage.jsx
|   |   |   |-- CoursesPage.jsx
|   |   |   |-- AssignmentsPage.jsx
|   |   |   |-- SubmissionPage.jsx
|   |   |   |-- ForumPage.jsx
|   |   |   |-- TopicPage.jsx
|   |   |   |-- ObservatoryPage.jsx
|   |   |   |-- LabPage.jsx
|   |   |   |-- AdminPage.jsx
|   |   |   `-- LecturerPage.jsx
|   |   |-- components/
|   |   |   |-- Sidebar.jsx
|   |   |   `-- Topbar.jsx
|   |   |-- contexts/
|   |   |   `-- AuthContext.jsx
|   |   |-- App.jsx
|   |   `-- index.css           # Design system lengkap
|   `-- package.json
|-- docs/
|   |-- API.md                  # Dokumentasi endpoint
|   `-- VULNERABILITIES.md      # Dokumentasi kerentanan & mitigasi
`-- README.md
```

---

## Cara Menjalankan Aplikasi

### Prasyarat

- **Node.js** v18 atau lebih baru
- **npm** v9 atau lebih baru

### Langkah 1 - Install Dependensi

```bash
# Terminal 1: Backend
cd backend
npm install

# Terminal 2: Frontend
cd frontend
npm install
```

### Langkah 2 - Setup Database & Seed Data

```bash
# Di direktori backend
npm run seed
```

> Perintah ini akan membuat database `arkavia.db` dan mengisi data sintetis
> (13 akun, 5 mata kuliah, tugas, forum, lab data).

### Langkah 3 - Konfigurasi Environment

File `.env` di direktori `backend/` sudah tersedia dengan konfigurasi default:

```env
PORT=3001
HOST=localhost
NODE_ENV=development
SESSION_SECRET=arkavia-super-secret-session-key-change-this-in-production-2026
FRONTEND_URL=http://localhost:5173
LAB_MODE=true
```

> LAB_MODE=true mengaktifkan endpoint rentan untuk keperluan praktikum.
> Hanya berlaku di localhost.

### Langkah 4 - Jalankan Backend

```bash
cd backend
npm run dev
```

Backend akan berjalan di: **http://localhost:3001**

### Langkah 5 - Jalankan Frontend

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

### Langkah 6 - Buka di Browser

Buka **http://localhost:5173** dan login dengan salah satu akun demo di bawah.

---

## Akun Demo

### Admin

| Field | Value |
|-------|-------|
| Username | `admin.arkavia` |
| Password | `Admin@2026!` |
| Role | Admin |
| Identifier | ADM-001 |

### Dosen (Lecturer)

| Username | Password | Nama | Mengajar |
|----------|----------|------|----------|
| `dr.veyra` | `Lect@2026!` | Dr. Veyra Solenne | DEF-501, SAD-502, NSP-504 |
| `prof.calder` | `Lect@2026!` | Prof. Calder Maxis | SAD-502, SAP-505 |
| `dr.ioana` | `Lect@2026!` | Dr. Ioana Vesper | CET-503 |

### Mahasiswa (Student)

| Username | Password | Nama | NIM |
|----------|----------|------|-----|
| `rael.noctis` | `Student@2026!` | Rael Noctis | NIM-2024010001 |
| `lyra.voss` | `Student@2026!` | Lyra Voss | NIM-2024010002 |
| `kael.dren` | `Student@2026!` | Kael Dren | NIM-2024010003 |
| `solen.hart` | `Student@2026!` | Solen Hart | NIM-2024010004 |
| `mira.callyx` | `Student@2026!` | Mira Callyx | NIM-2024010005 |
| `thorn.estival` | `Student@2026!` | Thorn Estival | NIM-2024010006 |
| `vael.cross` | `Student@2026!` | Vael Cross | NIM-2024010007 |
| `nara.solis` | `Student@2026!` | Nara Solis | NIM-2024010008 |
| `oren.dusk` | `Student@2026!` | Oren Dusk | NIM-2024010009 |

---

## Fitur Utama

### Dashboard
- **Mahasiswa**: Statistik nilai, progress akademik, recent submissions, activity log
- **Dosen/Admin**: Ringkasan kelas yang diampu, statistik semester

### Student Archive (Mahasiswa)
- Lihat semua tugas dari mata kuliah yang diambil
- Upload jawaban (PDF/DOC/TXT, max 5MB) atau ketik langsung
- Lacak status: Draft > Submitted > Under Review > Graded
- Academic Journey Timeline per submission

### Lecturer Studio (Dosen)
- Antrean tugas yang perlu diperiksa
- Review konten submission mahasiswa
- Form penilaian dengan rubrik (score + feedback + status)
- Progress bar grading per tugas
- Notifikasi otomatis ke mahasiswa setelah nilai diberikan

### Registry Control (Admin)
- Buat, aktifkan, dan nonaktifkan akun pengguna
- Ubah role pengguna (dicatat di audit log)
- Pantau statistik sistem
- Audit log immutable (200 entri terakhir)

### Knowledge Chamber (Forum)
- Buat topik baru dengan kategori
- Nested replies (balasan bertingkat)
- Accepted answer per topik
- Moderasi konten oleh dosen/admin
- Pin topik penting

### Security Observatory
- Real-time audit log monitoring
- Login timeline dengan IP address
- Object access log (termasuk lab IDOR attempts)
- Role change events
- Grade change history
- Status live dua skenario lab
- Tombol test inline untuk IDOR dan XSS

### Security Sandbox (Lab)
- Dokumentasi skenario IDOR dan Stored XSS
- Tombol test vulnerable vs safe endpoint
- Visualisasi hasil dengan penjelasan teknis

---

## Security Lab

### Skenario A: IDOR - Insecure Direct Object Reference

**Endpoint Vulnerable**: `GET /api/lab/idor/submission/:id`
**Endpoint Safe**: `GET /api/lab/idor-safe/submission/:id`

**Setup Lab**:
- Rael Noctis (NIM-2024010001) memiliki submission #101
- Lyra Voss (NIM-2024010002) mencoba mengakses submission #101 milik Rael

**Cara mereproduksi (LAB_MODE=true)**:
1. Login sebagai `lyra.voss`
2. Akses `GET /api/lab/idor/submission/101`
3. Data milik Rael Noctis (termasuk `secret_note`) berhasil dibaca - IDOR berhasil
4. Akses `GET /api/lab/idor-safe/submission/101`
5. Mendapat 403 Forbidden - mitigasi berhasil

**Mitigasi**: Backend memverifikasi `submission.student_id === session.user.id` sebelum mengembalikan data.

**Klasifikasi**: OWASP Top 10 A01:2021 - Broken Access Control

---

### Skenario B: Stored XSS - Cross-Site Scripting

**Endpoint Vulnerable**: `POST /api/lab/xss/posts` + `GET /api/lab/xss/posts`
**Endpoint Safe**: `POST /api/lab/xss-safe/posts` + `GET /api/lab/xss-safe/posts`

**Payload demo** (tidak berbahaya - hanya alert):
```
<script>alert("ARKAVIA XSS LAB: Stored XSS Berhasil Dieksekusi!")</script>
```

**Cara mereproduksi (LAB_MODE=true)**:
1. Payload tersimpan di database tanpa sanitasi via endpoint vulnerable
2. GET /api/lab/xss/posts mengembalikan raw HTML termasuk tag script
3. Di LabPage, konten di-render via innerHTML - script dieksekusi
4. GET /api/lab/xss-safe/posts mengembalikan body_safe yang sudah di-encode
5. React merender sebagai teks biasa - script tidak dieksekusi

**Mitigasi**: Output encoding HTML entities, DOMPurify server-side, React JSX auto-escaping.

**Klasifikasi**: OWASP Top 10 A03:2021 - Injection

---

## Pengujian Otomatis

### Menjalankan Test

```bash
# 1. Pastikan backend berjalan (npm run dev)
# 2. Di direktori backend:
npm test
```

### Daftar Test (25 Test Cases)

| No | Test | Kategori |
|----|------|----------|
| 1 | Admin dapat login | Auth |
| 2 | Lecturer (dr.veyra) dapat login | Auth |
| 3 | Student (rael.noctis) dapat login | Auth |
| 4 | Student (lyra.voss) dapat login | Auth |
| 5 | Login gagal dengan password salah | Auth |
| 6 | Request tanpa auth mengembalikan 401 | Auth |
| 7 | Mahasiswa tidak dapat akses admin panel | RBAC |
| 8 | Dosen tidak dapat akses admin panel | RBAC |
| 9 | Admin dapat akses daftar user | RBAC |
| 10 | Mahasiswa tidak dapat mengubah role sendiri | RBAC |
| 11 | Mahasiswa tidak dapat memberi nilai | RBAC |
| 12 | Dosen tidak dapat nilai kelas yang bukan miliknya | RBAC |
| 13 | Admin dapat kelola akun via backend | RBAC |
| 14 | Mahasiswa dapat lihat mata kuliah | Feature |
| 15 | Mahasiswa dapat lihat submissions sendiri | Feature |
| 16 | Mahasiswa dapat akses submission sendiri | Feature |
| 17 | Dosen dapat lihat submissions mahasiswa | Feature |
| 18 | [IDOR] Endpoint vulnerable: Lyra baca submission Rael | Lab IDOR |
| 19 | [IDOR] Endpoint safe: akses lintas user diblokir | Lab IDOR |
| 20 | [IDOR] Rael dapat akses submission miliknya sendiri | Lab IDOR |
| 21 | [XSS] Endpoint vulnerable mengembalikan raw payload | Lab XSS |
| 22 | [XSS] Endpoint safe mengembalikan HTML-encoded | Lab XSS |
| 23 | Logout menghancurkan session | Session |
| 24 | /api/auth/me mengembalikan data user | Session |
| 25 | File upload endpoint validasi assignment_id | Upload |

---

## Konfigurasi LAB_MODE

### LAB_MODE=true (Mode Praktikum)
- Endpoint rentan IDOR aktif: `GET /api/lab/idor/submission/:id`
- Endpoint rentan XSS aktif: `GET /api/lab/xss/posts` dan `POST /api/lab/xss/posts`
- Hanya berlaku di localhost (server akan abort jika HOST bukan localhost)
- Warning banner ditampilkan di UI

### LAB_MODE=false (Mode Aman)
- Semua endpoint lab rentan mengembalikan 403
- Hanya endpoint safe yang aktif
- Status ditampilkan di Security Observatory dan Security Sandbox

### Cara mengubah mode

Edit `backend/.env`:
```env
LAB_MODE=true   # untuk praktikum
LAB_MODE=false  # untuk deployment normal
```

Restart backend setelah perubahan.

---

## Untuk Dosen: Panduan Demonstrasi

### Persiapan (5 menit)

1. Pastikan Node.js v18+ terpasang
2. Buka 2 terminal di folder project
3. Terminal 1: `cd backend && npm install && npm run seed && npm run dev`
4. Terminal 2: `cd frontend && npm install && npm run dev`
5. Buka browser: http://localhost:5173

### Demo Skenario A - IDOR (10 menit)

1. Buka tab inkognito - login sebagai `lyra.voss` / `Student@2026!`
2. Navigasi ke **Security Sandbox** (menu sidebar)
3. Klik **"Test IDOR Vulnerability"** - lihat data Rael Noctis terbaca
4. Klik **"Test Safe Endpoint"** - lihat HTTP 403 Forbidden
5. Jelaskan: endpoint vulnerable tidak memeriksa ownership

Atau via curl:
```bash
# Login dulu
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"lyra.voss","password":"Student@2026!"}'

# IDOR: Lyra akses submission Rael (data bocor)
curl -b cookies.txt http://localhost:3001/api/lab/idor/submission/101

# Safe: Lyra diblokir (403)
curl -b cookies.txt http://localhost:3001/api/lab/idor-safe/submission/101
```

### Demo Skenario B - Stored XSS (10 menit)

1. Di Security Sandbox, bagian XSS
2. Klik **"Test XSS Vulnerability"** - lihat browser alert muncul
3. Klik **"Test Safe Rendering"** - teks script tampil sebagai teks, tidak dieksekusi
4. Jelaskan: innerHTML berbahaya vs React JSX auto-escaping

### Demo Security Observatory (5 menit)

1. Login sebagai `dr.veyra` atau `admin.arkavia`
2. Navigasi ke **Security Observatory**
3. Tunjukkan:
   - Login timeline (semua login tercatat)
   - Object Access Log (IDOR attempt tercatat dengan IP)
   - Grade Change Log
   - Role Change Events

### Menjalankan Test Otomatis (3 menit)

```bash
cd backend
npm test
```

Tunjukkan 25 test cases dengan hasil PASS semua.

---

## Keamanan Implementasi (Mode Aman)

| Fitur | Implementasi |
|-------|-------------|
| Password hashing | bcrypt (10 rounds) |
| Session | httpOnly cookie, SameSite=lax, 8 jam |
| Rate limiting | 10 attempts per 15 menit (login) |
| CORS | Hanya origin frontend yang diizinkan |
| Security headers | Helmet.js (CSP, HSTS, dll) |
| Role-based access | Backend middleware per endpoint |
| Object ownership | Verifikasi student_id === session.user.id |
| File upload | Max 5MB, hanya PDF/DOC/DOCX/TXT |
| XSS prevention | React JSX auto-escaping + DOMPurify |
| Audit log | Immutable, semua aksi penting tercatat |
| Session invalidation | Session dihancurkan saat logout |

---

## Referensi Dokumentasi Lengkap

- [docs/API.md](docs/API.md) - Dokumentasi semua endpoint REST API
- [docs/VULNERABILITIES.md](docs/VULNERABILITIES.md) - Dokumentasi teknis kerentanan IDOR dan Stored XSS

---

## Lisensi & Atribusi

Project ini dibuat untuk keperluan akademik - Praktikum Keamanan Sistem Informasi (KSI).
Semua data pengguna bersifat fiktif. Domain `arkavia.edu.example` tidak valid di internet.
Jangan deploy dengan LAB_MODE=true di lingkungan produksi.
