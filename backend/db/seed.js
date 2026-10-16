'use strict';
/**
 * ARKAVIA — Synthetic Seed Data
 * All identities are fictional. Domain: arkavia.edu.example
 */
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('./database');

const HASH_ROUNDS = 10;

async function hash(pw) {
  return bcrypt.hash(pw, HASH_ROUNDS);
}

async function seed() {
  const db = initDb();

  // ----------------------------------------------------------------
  // USERS
  // ----------------------------------------------------------------
  const usersData = [
    // Admin
    {
      username: 'admin.arkavia',
      email: 'admin@arkavia.edu.example',
      password: 'Admin@2026!',
      full_name: 'Axiom Reinholt',
      role: 'admin',
      identifier: 'ADM-001',
      avatar_initials: 'AR',
      bio: 'System Administrator — ARKAVIA Registry Control',
    },
    // Lecturers
    {
      username: 'dr.veyra',
      email: 'veyra.solenne@arkavia.edu.example',
      password: 'Lect@2026!',
      full_name: 'Dr. Veyra Solenne',
      role: 'lecturer',
      identifier: 'NIDN-7710291',
      avatar_initials: 'VS',
      bio: 'Specialization: Cybersecurity, Cryptographic Protocols',
    },
    {
      username: 'prof.calder',
      email: 'calder.maxis@arkavia.edu.example',
      password: 'Lect@2026!',
      full_name: 'Prof. Calder Maxis',
      role: 'lecturer',
      identifier: 'NIDN-7720148',
      avatar_initials: 'CM',
      bio: 'Specialization: Secure Software Engineering, DevSecOps',
    },
    {
      username: 'dr.ioana',
      email: 'ioana.vesper@arkavia.edu.example',
      password: 'Lect@2026!',
      full_name: 'Dr. Ioana Vesper',
      role: 'lecturer',
      identifier: 'NIDN-7731057',
      avatar_initials: 'IV',
      bio: 'Specialization: Digital Ethics, Computational Law',
    },
    // Students (9)
    {
      username: 'rael.noctis',
      email: 'rael.noctis@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Rael Noctis',
      role: 'student',
      identifier: 'NIM-2024010001',
      avatar_initials: 'RN',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'lyra.voss',
      email: 'lyra.voss@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Lyra Voss',
      role: 'student',
      identifier: 'NIM-2024010002',
      avatar_initials: 'LV',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'kael.dren',
      email: 'kael.dren@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Kael Dren',
      role: 'student',
      identifier: 'NIM-2024010003',
      avatar_initials: 'KD',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'solen.hart',
      email: 'solen.hart@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Solen Hart',
      role: 'student',
      identifier: 'NIM-2024010004',
      avatar_initials: 'SH',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'mira.elun',
      email: 'mira.elun@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Mira Elun',
      role: 'student',
      identifier: 'NIM-2024010005',
      avatar_initials: 'ME',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'torin.ash',
      email: 'torin.ash@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Torin Ash',
      role: 'student',
      identifier: 'NIM-2024010006',
      avatar_initials: 'TA',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'cyra.lenn',
      email: 'cyra.lenn@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Cyra Lenn',
      role: 'student',
      identifier: 'NIM-2024010007',
      avatar_initials: 'CL',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'davan.oryx',
      email: 'davan.oryx@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Davan Oryx',
      role: 'student',
      identifier: 'NIM-2024010008',
      avatar_initials: 'DO',
      bio: 'Semester 5 — Informatics Security',
    },
    {
      username: 'zeth.callum',
      email: 'zeth.callum@student.arkavia.edu.example',
      password: 'Student@2026!',
      full_name: 'Zeth Callum',
      role: 'student',
      identifier: 'NIM-2024010009',
      avatar_initials: 'ZC',
      bio: 'Semester 5 — Informatics Security',
    },
  ];

  console.log('[SEED] Hashing passwords...');
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role, identifier, avatar_initials, bio)
    VALUES (@username, @email, @password_hash, @full_name, @role, @identifier, @avatar_initials, @bio)
  `);

  const userMap = {}; // username -> id
  for (const u of usersData) {
    const password_hash = await hash(u.password);
    insertUser.run({ ...u, password_hash });
    const row = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
    userMap[u.username] = row.id;
  }

  // ----------------------------------------------------------------
  // COURSES
  // ----------------------------------------------------------------
  const coursesData = [
    {
      code: 'DEF-501',
      name: 'Digital Evidence Fundamentals',
      description: 'Principles of digital forensics, evidence chain of custody, and legal frameworks governing digital investigations.',
      credits: 3,
      semester: 'Gasal',
      academic_year: '2026/2027',
    },
    {
      code: 'SAD-502',
      name: 'Secure Application Design',
      description: 'Threat modeling, OWASP Top 10, secure SDLC, and hands-on application hardening techniques.',
      credits: 3,
      semester: 'Gasal',
      academic_year: '2026/2027',
    },
    {
      code: 'CET-503',
      name: 'Computational Ethics',
      description: 'Ethical frameworks for technology, bias in algorithms, data sovereignty, and professional responsibility.',
      credits: 2,
      semester: 'Gasal',
      academic_year: '2026/2027',
    },
    {
      code: 'NTP-504',
      name: 'Network Threat Profiling',
      description: 'Intrusion detection, network traffic analysis, threat intelligence, and incident response playbooks.',
      credits: 3,
      semester: 'Gasal',
      academic_year: '2026/2027',
    },
    {
      code: 'CRM-505',
      name: 'Cryptography & Key Management',
      description: 'Symmetric/asymmetric cryptography, PKI, key lifecycle management, and post-quantum considerations.',
      credits: 3,
      semester: 'Gasal',
      academic_year: '2026/2027',
    },
  ];

  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses (code, name, description, credits, semester, academic_year)
    VALUES (@code, @name, @description, @credits, @semester, @academic_year)
  `);
  const courseMap = {}; // code -> id
  for (const c of coursesData) {
    insertCourse.run(c);
    const row = db.prepare('SELECT id FROM courses WHERE code = ?').get(c.code);
    courseMap[c.code] = row.id;
  }

  // ----------------------------------------------------------------
  // COURSE LECTURERS
  // ----------------------------------------------------------------
  const clData = [
    { lecturer: 'dr.veyra', course: 'DEF-501' },
    { lecturer: 'dr.veyra', course: 'CRM-505' },
    { lecturer: 'prof.calder', course: 'SAD-502' },
    { lecturer: 'prof.calder', course: 'NTP-504' },
    { lecturer: 'dr.ioana', course: 'CET-503' },
  ];
  const insertCL = db.prepare(`
    INSERT OR IGNORE INTO course_lecturers (lecturer_id, course_id) VALUES (?, ?)
  `);
  for (const cl of clData) {
    insertCL.run(userMap[cl.lecturer], courseMap[cl.course]);
  }

  // ----------------------------------------------------------------
  // ENROLLMENTS (all 9 students in all 5 courses)
  // ----------------------------------------------------------------
  const studentUsernames = [
    'rael.noctis','lyra.voss','kael.dren','solen.hart','mira.elun',
    'torin.ash','cyra.lenn','davan.oryx','zeth.callum'
  ];
  const gradeMatrix = {
    'rael.noctis':  [88, 92, 85, 79, 91],
    'lyra.voss':    [75, 80, 90, 83, 77],
    'kael.dren':    [62, 70, 73, 68, 65],
    'solen.hart':   [95, 93, 88, 91, 96],
    'mira.elun':    [80, 78, 82, 76, 84],
    'torin.ash':    [55, 60, 65, 58, 62],
    'cyra.lenn':    [90, 88, 91, 87, 93],
    'davan.oryx':   [72, 68, 75, 71, 70],
    'zeth.callum':  [85, 87, 80, 84, 89],
  };
  const courses = Object.keys(courseMap);
  const insertEnroll = db.prepare(`
    INSERT OR IGNORE INTO enrollments (student_id, course_id, final_grade, letter_grade)
    VALUES (?, ?, ?, ?)
  `);
  function letterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  }
  for (const username of studentUsernames) {
    const grades = gradeMatrix[username];
    courses.forEach((code, i) => {
      insertEnroll.run(userMap[username], courseMap[code], grades[i], letterGrade(grades[i]));
    });
  }

  // ----------------------------------------------------------------
  // ASSIGNMENTS
  // ----------------------------------------------------------------
  const assignmentsData = [
    {
      course: 'DEF-501',
      lecturer: 'dr.veyra',
      title: 'Chain of Custody Report',
      description: 'Prepare a complete chain of custody report for a simulated digital evidence collection scenario.',
      rubric: JSON.stringify([
        { criterion: 'Documentation Completeness', weight: 30 },
        { criterion: 'Legal Framework Compliance', weight: 25 },
        { criterion: 'Evidence Integrity Verification', weight: 25 },
        { criterion: 'Writing Clarity', weight: 20 },
      ]),
      max_score: 100,
      deadline: '2026-11-15T23:59:00',
    },
    {
      course: 'SAD-502',
      lecturer: 'prof.calder',
      title: 'OWASP Top 10 Threat Analysis',
      description: 'Analyze a provided vulnerable web application and document findings against OWASP Top 10.',
      rubric: JSON.stringify([
        { criterion: 'Vulnerability Identification', weight: 35 },
        { criterion: 'Risk Scoring (CVSS)', weight: 25 },
        { criterion: 'Remediation Recommendations', weight: 25 },
        { criterion: 'Presentation Quality', weight: 15 },
      ]),
      max_score: 100,
      deadline: '2026-11-20T23:59:00',
    },
    {
      course: 'CET-503',
      lecturer: 'dr.ioana',
      title: 'Ethical Dilemma Case Study',
      description: 'Select one real-world technology ethics case and analyze it through at least two ethical frameworks.',
      rubric: JSON.stringify([
        { criterion: 'Framework Application', weight: 40 },
        { criterion: 'Argument Coherence', weight: 30 },
        { criterion: 'Stakeholder Analysis', weight: 20 },
        { criterion: 'Format', weight: 10 },
      ]),
      max_score: 100,
      deadline: '2026-11-10T23:59:00',
    },
    {
      course: 'NTP-504',
      lecturer: 'prof.calder',
      title: 'Packet Capture Analysis',
      description: 'Analyze the provided PCAP file and write a full intrusion report including attack vectors identified.',
      rubric: JSON.stringify([
        { criterion: 'Attack Identification', weight: 40 },
        { criterion: 'IOC Documentation', weight: 30 },
        { criterion: 'Recommended Controls', weight: 20 },
        { criterion: 'Report Format', weight: 10 },
      ]),
      max_score: 100,
      deadline: '2026-11-25T23:59:00',
    },
    {
      course: 'CRM-505',
      lecturer: 'dr.veyra',
      title: 'PKI Architecture Design',
      description: 'Design a complete PKI architecture for a fictional enterprise including CA hierarchy and key management policy.',
      rubric: JSON.stringify([
        { criterion: 'CA Hierarchy Design', weight: 35 },
        { criterion: 'Key Management Policy', weight: 30 },
        { criterion: 'Revocation Strategy', weight: 20 },
        { criterion: 'Diagram Quality', weight: 15 },
      ]),
      max_score: 100,
      deadline: '2026-12-01T23:59:00',
    },
  ];

  const insertAssignment = db.prepare(`
    INSERT OR IGNORE INTO assignments (course_id, created_by, title, description, rubric, max_score, deadline)
    VALUES (@course_id, @created_by, @title, @description, @rubric, @max_score, @deadline)
  `);
  const assignmentMap = {}; // title -> id
  for (const a of assignmentsData) {
    insertAssignment.run({
      course_id: courseMap[a.course],
      created_by: userMap[a.lecturer],
      title: a.title,
      description: a.description,
      rubric: a.rubric,
      max_score: a.max_score,
      deadline: a.deadline,
    });
    const row = db.prepare('SELECT id FROM assignments WHERE title = ?').get(a.title);
    assignmentMap[a.title] = row.id;
  }

  // ----------------------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------------------
  const statusOptions = ['submitted', 'graded', 'needs_revision', 'submitted'];
  const contentTemplates = [
    'Laporan ini membahas prosedur pengamanan bukti digital berdasarkan standar ISO/IEC 27037. Setiap tahapan telah didokumentasikan sesuai protokol chain of custody.',
    'Analisis dilakukan terhadap aplikasi DVWA versi 1.10. Ditemukan 7 kerentanan kritis termasuk SQL Injection pada form login dan XSS reflected pada parameter search.',
    'Studi kasus yang dipilih adalah kasus Cambridge Analytica (2018). Dianalisis menggunakan pendekatan Kantian Deontology dan Consequentialism.',
    'File PCAP dianalisis menggunakan Wireshark. Ditemukan indikasi serangan ARP Spoofing dan upaya eksfiltrasi data via DNS tunneling.',
    'Desain PKI tiga-tier dirancang untuk perusahaan fiktif NovaCorp. Root CA offline, dua Intermediate CA, dan ratusan endpoint certificate.',
  ];

  const insertSubmission = db.prepare(`
    INSERT OR IGNORE INTO submissions
    (assignment_id, student_id, content, status, score, feedback, submitted_at, graded_at, graded_by)
    VALUES (@assignment_id, @student_id, @content, @status, @score, @feedback, @submitted_at, @graded_at, @graded_by)
  `);

  const assignmentTitles = Object.keys(assignmentMap);
  let submissionId = 1;

  for (const username of studentUsernames) {
    const grades = gradeMatrix[username];
    for (let i = 0; i < assignmentTitles.length; i++) {
      const title = assignmentTitles[i];
      const status = grades[i] >= 70 ? (grades[i] >= 80 ? 'graded' : 'submitted') : 'needs_revision';
      const lecturerKey = ['dr.veyra','prof.calder','dr.ioana','prof.calder','dr.veyra'][i];
      insertSubmission.run({
        assignment_id: assignmentMap[title],
        student_id: userMap[username],
        content: contentTemplates[i],
        status,
        score: status === 'graded' ? grades[i] : null,
        feedback: status === 'graded' ? `Work demonstrates solid understanding. Score reflects performance on rubric criteria.` : null,
        submitted_at: `2026-10-${String(10 + i).padStart(2,'0')}T14:30:00`,
        graded_at: status === 'graded' ? `2026-10-${String(12 + i).padStart(2,'0')}T09:15:00` : null,
        graded_by: status === 'graded' ? userMap[lecturerKey] : null,
      });
    }
  }

  // ----------------------------------------------------------------
  // FORUM TOPICS
  // ----------------------------------------------------------------
  const topicsData = [
    {
      course: 'SAD-502',
      author: 'rael.noctis',
      title: 'Best practices untuk validasi input pada Node.js?',
      body: 'Saya sedang mengerjakan tugas Secure Application Design dan ingin tahu library apa yang paling direkomendasikan untuk input validation di Node.js. Apakah express-validator sudah cukup atau ada alternatif yang lebih baik?',
      category: 'question',
      is_pinned: 0,
    },
    {
      course: 'DEF-501',
      author: 'lyra.voss',
      title: 'Diskusi: Chain of Custody dalam konteks cloud forensics',
      body: 'Dengan semakin banyaknya data yang tersimpan di cloud, bagaimana implementasi chain of custody yang valid secara hukum? Apakah prinsip-prinsip tradisional masih berlaku?',
      category: 'discussion',
      is_pinned: 1,
    },
    {
      course: 'CET-503',
      author: 'solen.hart',
      title: 'Rekomendasi sumber untuk framework etika teknologi?',
      body: 'Untuk tugas case study, saya kesulitan menemukan referensi yang membahas intersection antara AI ethics dan cybersecurity ethics. Ada yang bisa merekomendasikan?',
      category: 'question',
      is_pinned: 0,
    },
    {
      course: null,
      author: 'kael.dren',
      title: 'Pengalaman menggunakan Wireshark untuk analisis PCAP',
      body: 'Bagi yang sudah pernah menggunakan Wireshark untuk tugas NTP-504, ada tips untuk filter display yang efektif saat mencari anomali traffic? Saya sering kebingungan dengan volume data yang besar.',
      category: 'tips',
      is_pinned: 0,
    },
    {
      course: 'CRM-505',
      author: 'cyra.lenn',
      title: 'Post-Quantum Cryptography: Haruskah mulai migrasi sekarang?',
      body: 'NIST sudah merilis draft standar post-quantum. Apakah relevan untuk dibahas dalam konteks desain PKI yang sedang kita kerjakan? Saya rasa ini penting untuk dimasukkan dalam rekomendasi.',
      category: 'discussion',
      is_pinned: 0,
    },
  ];

  const insertTopic = db.prepare(`
    INSERT OR IGNORE INTO forum_topics (course_id, author_id, title, body, category, is_pinned, view_count)
    VALUES (@course_id, @author_id, @title, @body, @category, @is_pinned, @view_count)
  `);
  const topicIds = [];
  for (const t of topicsData) {
    insertTopic.run({
      course_id: t.course ? courseMap[t.course] : null,
      author_id: userMap[t.author],
      title: t.title,
      body: t.body,
      category: t.category,
      is_pinned: t.is_pinned,
      view_count: Math.floor(Math.random() * 40) + 5,
    });
    const row = db.prepare('SELECT id FROM forum_topics WHERE title = ?').get(t.title);
    topicIds.push(row.id);
  }

  // Forum replies
  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO forum_posts (topic_id, author_id, body, is_accepted_answer)
    VALUES (@topic_id, @author_id, @body, @is_accepted_answer)
  `);
  const replies = [
    { topic_idx: 0, author: 'prof.calder', body: 'express-validator sangat baik dan terintegrasi dengan baik dalam ekosistem Express. Saya juga merekomendasikan joi untuk schema validation yang lebih kompleks. Yang penting adalah validasi dilakukan di sisi server, tidak hanya frontend.', accepted: 1 },
    { topic_idx: 0, author: 'mira.elun', body: 'Saya juga menemukan zod sangat berguna terutama jika project menggunakan TypeScript. Ada type inference otomatis.', accepted: 0 },
    { topic_idx: 1, author: 'dr.veyra', body: 'Pertanyaan yang sangat relevan. Dalam cloud forensics, kita perlu melibatkan provider melalui legal hold process. Pastikan ada timestamped logs dari provider sebagai bagian dari chain of custody. ISO/IEC 27050 membahas ini secara spesifik.', accepted: 1 },
    { topic_idx: 2, author: 'dr.ioana', body: 'Untuk intersection AI dan cybersecurity ethics, saya sarankan baca "Weapons of Math Destruction" oleh Cathy O\'Neil dan laporan AI Now Institute 2023. Keduanya relevan untuk tugas case study.', accepted: 1 },
    { topic_idx: 3, author: 'torin.ash', body: 'Filter yang paling sering saya pakai: `tcp.flags.syn == 1 && tcp.flags.ack == 0` untuk detect port scanning, dan `dns.qry.name contains "."` untuk monitor unusual DNS queries.', accepted: 0 },
    { topic_idx: 4, author: 'dr.veyra', body: 'Sangat relevan! NIST SP 800-208 dan FIPS 203/204/205 yang baru dirilis adalah referensi utama. Untuk PKI design, pertimbangkan crypto-agility — kemampuan untuk mengganti algoritma tanpa redesign total.', accepted: 1 },
  ];
  for (const r of replies) {
    insertPost.run({
      topic_id: topicIds[r.topic_idx],
      author_id: userMap[r.author],
      body: r.body,
      is_accepted_answer: r.accepted,
    });
  }

  // ----------------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------------
  const insertNotif = db.prepare(`
    INSERT OR IGNORE INTO notifications (user_id, type, title, body, is_read)
    VALUES (@user_id, @type, @title, @body, @is_read)
  `);
  const notifData = [
    { user: 'rael.noctis', type: 'grade_change', title: 'Nilai Diterima', body: 'Tugas "Chain of Custody Report" telah dinilai: 88/100 (B)', is_read: 0 },
    { user: 'rael.noctis', type: 'comment', title: 'Balasan Baru', body: 'Dr. Veyra Solenne membalas topik di forum DEF-501', is_read: 0 },
    { user: 'lyra.voss', type: 'deadline', title: 'Tenggat Mendekat', body: 'Tugas "OWASP Top 10 Threat Analysis" jatuh tempo dalam 3 hari', is_read: 1 },
    { user: 'solen.hart', type: 'grade_change', title: 'Nilai Diterima', body: 'Tugas "Ethical Dilemma Case Study" telah dinilai: 88/100 (B)', is_read: 0 },
    { user: 'kael.dren', type: 'system', title: 'Revisi Diperlukan', body: 'Tugas "Chain of Custody Report" perlu revisi — lihat catatan dosen', is_read: 1 },
  ];
  for (const n of notifData) {
    insertNotif.run({ user_id: userMap[n.user], type: n.type, title: n.title, body: n.body, is_read: n.is_read });
  }

  // ----------------------------------------------------------------
  // AUDIT LOG (synthetic security events)
  // ----------------------------------------------------------------
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (actor_id, actor_username, action, target_type, target_id, target_description, ip_address, metadata, occurred_at)
    VALUES (@actor_id, @actor_username, @action, @target_type, @target_id, @target_description, @ip_address, @metadata, @occurred_at)
  `);
  const auditEvents = [
    { actor: 'admin.arkavia', action: 'USER_CREATED', target_type: 'user', target_id: userMap['rael.noctis'], desc: 'Created student account rael.noctis', ip: '192.168.1.10', meta: '{}', at: '2026-08-01T08:00:00' },
    { actor: 'admin.arkavia', action: 'ROLE_ASSIGNED', target_type: 'user', target_id: userMap['dr.veyra'], desc: 'Assigned role: lecturer to dr.veyra', ip: '192.168.1.10', meta: '{"old_role":null,"new_role":"lecturer"}', at: '2026-08-01T08:05:00' },
    { actor: 'rael.noctis', action: 'LOGIN', target_type: null, target_id: null, desc: 'Successful login', ip: '10.0.0.15', meta: '{}', at: '2026-10-10T09:00:00' },
    { actor: 'lyra.voss', action: 'LOGIN', target_type: null, target_id: null, desc: 'Successful login', ip: '10.0.0.22', meta: '{}', at: '2026-10-10T09:12:00' },
    { actor: 'dr.veyra', action: 'GRADE_UPDATED', target_type: 'submission', target_id: 1, desc: 'Updated grade for submission #1', ip: '10.0.0.5', meta: '{"old_score":null,"new_score":88}', at: '2026-10-12T09:15:00' },
    { actor: 'kael.dren', action: 'LOGIN_FAILED', target_type: null, target_id: null, desc: 'Failed login attempt', ip: '10.0.0.99', meta: '{"attempts":3}', at: '2026-10-13T22:31:00' },
    { actor: 'admin.arkavia', action: 'USER_DEACTIVATED', target_type: 'user', target_id: null, desc: 'No active deactivations', ip: '192.168.1.10', meta: '{}', at: '2026-10-14T10:00:00' },
  ];
  for (const e of auditEvents) {
    insertAudit.run({
      actor_id: userMap[e.actor],
      actor_username: e.actor,
      action: e.action,
      target_type: e.target_type,
      target_id: e.target_id,
      target_description: e.desc,
      ip_address: e.ip,
      metadata: e.meta,
      occurred_at: e.at,
    });
  }

  // ----------------------------------------------------------------
  // LAB: IDOR sandbox
  // ----------------------------------------------------------------
  db.prepare(`
    INSERT OR IGNORE INTO lab_submissions (id, student_id, student_name, assignment_title, content, score, secret_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(101, userMap['rael.noctis'], 'Rael Noctis', 'Chain of Custody Lab Task',
    'Analisis forensik pada bukti digital dari hard drive tersangka. Prosedur hash verification menggunakan SHA-256.', 88,
    '[CONFIDENTIAL] Internal disciplinary note: Student had a prior integrity warning in DEF-301. Monitor closely.');
  db.prepare(`
    INSERT OR IGNORE INTO lab_submissions (id, student_id, student_name, assignment_title, content, score, secret_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(102, userMap['lyra.voss'], 'Lyra Voss', 'Chain of Custody Lab Task',
    'Laporan pengumpulan bukti dari perangkat mobile. Dokumentasi sesuai ACPO Guidelines.', 75,
    '[CONFIDENTIAL] Scholarship recipient — performance tracked by board.');

  // ----------------------------------------------------------------
  // LAB: XSS sandbox
  // ----------------------------------------------------------------
  db.prepare(`INSERT OR IGNORE INTO lab_xss_posts (author_name, body, body_safe) VALUES (?,?,?)`).run(
    'Rael Noctis',
    'Ini adalah komentar normal dari mahasiswa. Tidak ada masalah di sini.',
    'Ini adalah komentar normal dari mahasiswa. Tidak ada masalah di sini.'
  );
  db.prepare(`INSERT OR IGNORE INTO lab_xss_posts (author_name, body, body_safe) VALUES (?,?,?)`).run(
    'XSS Tester',
    '<script>alert("⚠️ ARKAVIA XSS LAB: Stored XSS Berhasil Dieksekusi! Payload tersimpan dan dirender tanpa sanitasi.")</script>',
    '&lt;script&gt;alert("⚠️ ARKAVIA XSS LAB: Stored XSS Berhasil Dieksekusi! Payload tersimpan dan dirender tanpa sanitasi.")&lt;/script&gt;'
  );
  db.prepare(`INSERT OR IGNORE INTO lab_xss_posts (author_name, body, body_safe) VALUES (?,?,?)`).run(
    'Lyra Voss',
    'Pertanyaan menarik tentang topik ini. Saya setuju dengan analisis di atas.',
    'Pertanyaan menarik tentang topik ini. Saya setuju dengan analisis di atas.'
  );

  console.log('[SEED] ✅ Synthetic data loaded successfully.');
  console.log('[SEED] Demo accounts:');
  console.log('  Admin   : admin.arkavia / Admin@2026!');
  console.log('  Lecturer: dr.veyra / Lect@2026!');
  console.log('  Lecturer: prof.calder / Lect@2026!');
  console.log('  Lecturer: dr.ioana / Lect@2026!');
  console.log('  Student : rael.noctis / Student@2026!');
  console.log('  Student : lyra.voss / Student@2026!');
  console.log('  (and 7 more students with same password)');
}

seed().catch(e => { console.error('[SEED ERROR]', e); process.exit(1); });
