# ARKAVIA - Dokumentasi API Endpoint

Semua endpoint memerlukan autentikasi kecuali disebutkan sebaliknya.
Base URL: `http://localhost:3001`

---

## Autentikasi

### POST /api/auth/login
Login dan membuat session.

**Request Body:**
```json
{
  "username": "rael.noctis",
  "password": "Student@2026!"
}
```

**Response 200:**
```json
{
  "user": {
    "id": 5,
    "username": "rael.noctis",
    "full_name": "Rael Noctis",
    "role": "student",
    "identifier": "NIM-2024010001",
    "avatar_initials": "RN"
  }
}
```

**Error 401**: Kredensial salah
**Error 400**: Username/password tidak disertakan
**Rate limit**: 10 percobaan per 15 menit

---

### POST /api/auth/logout
Menghancurkan session aktif.

**Response 200:**
```json
{ "success": true }
```

---

### GET /api/auth/me
Mendapatkan data user yang sedang login.

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "username": "admin.arkavia",
    "role": "admin",
    "full_name": "Axiom Reinholt",
    "identifier": "ADM-001"
  }
}
```

**Error 401**: Tidak terautentikasi

---

## Pengguna

### GET /api/users/me/activity
Mendapatkan riwayat aktivitas user yang sedang login.

**Response 200:**
```json
{
  "activity": [
    {
      "id": 1,
      "action": "LOGIN",
      "occurred_at": "2026-10-16T10:00:00.000Z",
      "ip_address": "::1"
    }
  ]
}
```

---

## Mata Kuliah

### GET /api/courses
Mendapatkan daftar mata kuliah.

- **Student**: mengembalikan mata kuliah yang diikuti beserta nilai
- **Lecturer**: mengembalikan mata kuliah yang diampu
- **Admin**: mengembalikan semua mata kuliah

**Response 200:**
```json
{
  "courses": [
    {
      "id": 1,
      "code": "DEF-501",
      "name": "Digital Evidence Fundamentals",
      "credits": 3,
      "semester": "Gasal",
      "academic_year": "2026/2027",
      "final_grade": 87.5,
      "letter_grade": "A"
    }
  ]
}
```

---

## Tugas

### GET /api/assignments
Mendapatkan daftar tugas.

- **Student**: tugas dari mata kuliah yang diikuti, beserta status submission
- **Lecturer**: tugas dari mata kuliah yang diampu, beserta jumlah submission
- **Admin**: semua tugas

**Response 200:**
```json
{
  "assignments": [
    {
      "id": 1,
      "title": "Chain of Custody Analysis",
      "course_code": "DEF-501",
      "deadline": "2026-11-15T23:59:00.000Z",
      "max_score": 100,
      "submission_status": "graded",
      "score": 88
    }
  ]
}
```

---

### GET /api/assignments/:id
Mendapatkan detail satu tugas.

**Response 200:**
```json
{
  "assignment": {
    "id": 1,
    "title": "Chain of Custody Analysis",
    "description": "...",
    "rubric": [
      { "criterion": "Analisis Bukti", "weight": 40 },
      { "criterion": "Dokumentasi", "weight": 30 }
    ],
    "max_score": 100,
    "deadline": "2026-11-15T23:59:00.000Z"
  }
}
```

---

### GET /api/assignments/:id/submissions
Mendapatkan semua submission untuk satu tugas. **Dosen/Admin only.**

**Error 403**: Bukan mata kuliah yang diampu dosen

**Response 200:**
```json
{
  "submissions": [
    {
      "id": 1,
      "full_name": "Rael Noctis",
      "identifier": "NIM-2024010001",
      "status": "graded",
      "score": 88,
      "submitted_at": "2026-10-10T14:30:00.000Z"
    }
  ]
}
```

---

## Pengumpulan Tugas (Submissions)

### GET /api/submissions/my
Mendapatkan semua submission milik mahasiswa yang login. **Student only.**

**Response 200:**
```json
{
  "submissions": [
    {
      "id": 1,
      "assignment_title": "Chain of Custody Analysis",
      "course_code": "DEF-501",
      "status": "graded",
      "score": 88,
      "submitted_at": "2026-10-10T14:30:00.000Z"
    }
  ]
}
```

---

### GET /api/submissions/:id
Mendapatkan detail submission beserta academic journey timeline.

**Ownership check**: Student hanya bisa akses submission sendiri. Lecturer hanya bisa akses submission dari mata kuliah yang diampu.

**Response 200:**
```json
{
  "submission": {
    "id": 1,
    "assignment_title": "Chain of Custody Analysis",
    "content": "...",
    "status": "graded",
    "score": 88,
    "feedback": "Analisis sangat mendalam...",
    "rubric": [...],
    "student_name": "Rael Noctis"
  },
  "journey": [
    {
      "id": 1,
      "event_type": "submitted",
      "actor_name": "Rael Noctis",
      "note": "Student submitted assignment",
      "occurred_at": "2026-10-10T14:30:00.000Z"
    }
  ]
}
```

**Error 403**: Bukan submission sendiri / bukan mata kuliah yang diampu

---

### POST /api/submissions
Membuat atau memperbarui submission. **Student only.**

Mendukung upload file (multipart/form-data) atau konten teks (application/json).

**Request Body (JSON):**
```json
{
  "assignment_id": 1,
  "content": "Isi jawaban tugas..."
}
```

**Request Body (multipart/form-data):**
```
assignment_id: 1
content: (optional)
file: (PDF/DOC/DOCX/TXT, max 5MB)
```

**Response 200:**
```json
{ "success": true, "submission_id": 1 }
```

**Error 400**: assignment_id tidak disertakan / file terlalu besar / tipe file tidak valid
**Error 403**: Tidak terdaftar di mata kuliah

---

### PATCH /api/submissions/:id/grade
Memberi nilai pada submission. **Lecturer only.**

**Request Body:**
```json
{
  "score": 88,
  "feedback": "Analisis sangat mendalam...",
  "status": "graded"
}
```

Status yang valid: `graded`, `needs_revision`

**Response 200:**
```json
{ "success": true }
```

**Error 403**: Bukan mata kuliah yang diampu
**Error 400**: Score di luar rentang / status tidak valid

---

## Forum

### GET /api/forum/topics
Mendapatkan daftar topik forum.

**Query params**: `?course_id=1&category=question`

**Response 200:**
```json
{
  "topics": [
    {
      "id": 1,
      "title": "Pertanyaan tentang Chain of Custody",
      "category": "question",
      "author_name": "Rael Noctis",
      "reply_count": 3,
      "is_pinned": 0,
      "is_closed": 0,
      "view_count": 12,
      "created_at": "2026-10-08T09:00:00.000Z"
    }
  ]
}
```

---

### POST /api/forum/topics
Membuat topik baru.

**Request Body:**
```json
{
  "title": "Pertanyaan tentang XSS",
  "body": "Bagaimana cara kerja Stored XSS?",
  "category": "question",
  "course_id": 1
}
```

**Response 200:**
```json
{ "success": true, "topic_id": 5 }
```

---

### GET /api/forum/topics/:id
Mendapatkan detail topik beserta semua balasan.

**Response 200:**
```json
{
  "topic": {
    "id": 1,
    "title": "...",
    "body": "...",
    "author_name": "Rael Noctis"
  },
  "posts": [
    {
      "id": 1,
      "body": "...",
      "author_name": "Dr. Veyra Solenne",
      "is_accepted_answer": 1,
      "parent_post_id": null
    }
  ]
}
```

---

### POST /api/forum/topics/:id/posts
Menambah balasan pada topik.

**Request Body:**
```json
{
  "body": "Teks balasan...",
  "parent_post_id": null
}
```

---

### PATCH /api/forum/topics/:id/pin
Pin topik. **Lecturer/Admin only.**

### PATCH /api/forum/posts/:id/accept
Tandai jawaban diterima. **Author topik saja.**

### DELETE /api/forum/posts/:id/moderate
Moderasi (hapus) postingan. **Lecturer/Admin only.**

---

## Notifikasi

### GET /api/notifications
Mendapatkan notifikasi untuk user yang login.

**Response 200:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "grade_change",
      "title": "Nilai Diterima",
      "body": "Nilai untuk pengiriman tugas telah diperbarui: 88/100",
      "is_read": 0,
      "created_at": "2026-10-16T10:00:00.000Z"
    }
  ],
  "unread_count": 1
}
```

---

### PATCH /api/notifications/:id/read
Tandai notifikasi sudah dibaca.

### PATCH /api/notifications/read-all
Tandai semua notifikasi sudah dibaca.

---

## Admin

Semua endpoint di bawah memerlukan role **admin**.

### GET /api/admin/users
Mendapatkan semua akun pengguna.

### POST /api/admin/users
Membuat akun baru.

**Request Body:**
```json
{
  "username": "new.user",
  "email": "new@arkavia.edu.example",
  "full_name": "New User",
  "role": "student",
  "identifier": "NIM-2024010010",
  "password": "Password123!"
}
```

### PATCH /api/admin/users/:id/role
Mengubah role pengguna.

**Request Body:**
```json
{ "role": "lecturer" }
```

### PATCH /api/admin/users/:id/deactivate
Menonaktifkan akun pengguna.

### PATCH /api/admin/users/:id/activate
Mengaktifkan kembali akun pengguna.

### GET /api/admin/audit-log
Mendapatkan 200 entri audit log terbaru.

### GET /api/admin/courses
Mendapatkan semua mata kuliah.

### POST /api/admin/courses
Membuat mata kuliah baru.

### GET /api/admin/system-status
Mendapatkan statistik sistem.

**Response 200:**
```json
{
  "status": {
    "users": 13,
    "active_users": 13,
    "courses": 5,
    "submissions": 45,
    "forum_topics": 8,
    "audit_entries": 120,
    "lab_mode": true
  }
}
```

---

## Security Observatory

Endpoint ini dapat diakses oleh **Lecturer dan Admin**.

### GET /api/observatory/summary
Mendapatkan ringkasan keamanan sistem.

**Response 200:**
```json
{
  "login_events": [...],
  "role_changes": [...],
  "grade_changes": [...],
  "object_access": [...],
  "stats": {
    "total_audit_entries": 120,
    "failed_logins": 3,
    "lab_mode": true
  },
  "lab_scenarios": {...}
}
```

---

## Security Lab

### GET /api/lab/status
Status lab dan skenario yang aktif. Dapat diakses semua user terautentikasi.

### GET /api/lab/idor/info
Informasi skenario IDOR beserta langkah pengujian.

### GET /api/lab/idor/submission/:id ⚠️ VULNERABLE
Endpoint rentan IDOR. **Hanya aktif jika LAB_MODE=true.**

Hanya memeriksa autentikasi, TIDAK memeriksa ownership.

**Response 200 (LAB_MODE=true):**
```json
{
  "mode": "VULNERABLE",
  "warning": "IDOR: No ownership check was performed...",
  "submission": {
    "id": 101,
    "student_name": "Rael Noctis",
    "content": "...",
    "score": 88,
    "secret_note": "CONFIDENTIAL: ..."
  }
}
```

**Response 403 (LAB_MODE=false):** Lab mode disabled

---

### GET /api/lab/idor-safe/submission/:id SAFE
Endpoint aman dengan ownership check. Selalu aktif.

**Response 200**: Data submission (hanya jika milik sendiri)
**Response 403**: Access denied dengan penjelasan mitigasi

---

### GET /api/lab/xss/info
Informasi skenario XSS beserta payload dan langkah pengujian.

### GET /api/lab/xss/posts ⚠️ VULNERABLE
Mendapatkan postingan XSS lab dengan body raw (tidak di-escape). **Hanya aktif jika LAB_MODE=true.**

### POST /api/lab/xss/posts ⚠️ VULNERABLE
Menyimpan postingan tanpa sanitasi. **Hanya aktif jika LAB_MODE=true.**

**Request Body:**
```json
{
  "author_name": "Test User",
  "body": "<script>alert('XSS')</script>"
}
```

### GET /api/lab/xss-safe/posts SAFE
Mendapatkan postingan dengan body yang sudah di-encode. Selalu aktif.

### POST /api/lab/xss-safe/posts SAFE
Menyimpan postingan dengan sanitasi DOMPurify. Selalu aktif.

---

## Health Check

### GET /api/health
Status server (tidak memerlukan autentikasi).

**Response 200:**
```json
{
  "status": "ok",
  "lab_mode": true,
  "timestamp": "2026-10-16T10:00:00.000Z"
}
```
