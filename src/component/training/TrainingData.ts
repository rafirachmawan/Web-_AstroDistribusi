// ================= src/components/training/TrainingData.ts =================
export type Lesson = {
  id: string;
  title: string;
  videoUrl?: string;
  duration: string;
  description?: string;
};
export type Question = { q: string; options: string[]; answerIndex: number };
export type Module = {
  id: string;
  title: string;
  role: "Sales" | "Leader" | "HR" | "All";
  level: "Dasar" | "Menengah" | "Lanjutan";
  description?: string;
  lessons: Lesson[];
  quiz: { questions: Question[]; passPct: number };
};

export const MODULES: Module[] = [
  {
    id: "onboarding-sales",
    title: "Onboarding Sales Lapangan",
    role: "Sales",
    level: "Dasar",
    description: "Pengantar SOP kunjungan, pencatatan, dan etika layanan.",
    lessons: [
      {
        id: "ls1",
        title: "SOP Kunjungan & Safety",
        duration: "08:20",
        videoUrl: "",
        description: "Alur kunjungan dan standar keselamatan kerja.",
      },
      {
        id: "ls2",
        title: "Pencatatan & Bukti Foto",
        duration: "06:05",
        videoUrl: "",
        description: "Cara input kunjungan, foto bukti, dan GPS.",
      },
      {
        id: "ls3",
        title: "Penawaran & Negosiasi",
        duration: "07:10",
        videoUrl: "",
        description: "Tips menyusun penawaran & follow up.",
      },
    ],
    quiz: {
      passPct: 70,
      questions: [
        {
          q: "Urutan yang benar sebelum mulai kunjungan?",
          options: [
            "Ambil foto dulu",
            "Aktifkan GPS, cek plan, siapkan materi",
            "Langsung ke toko",
          ],
          answerIndex: 1,
        },
        {
          q: "Apa fungsi foto bukti?",
          options: [
            "Hiasan laporan",
            "Verifikasi kunjungan & kondisi display",
            "Tidak penting",
          ],
          answerIndex: 1,
        },
        {
          q: "Kapan follow-up penawaran dilakukan?",
          options: [
            "Saat stok kosong saja",
            "Sesuai komitmen waktu dengan customer",
            "Tidak perlu",
          ],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "lead-sitrep",
    title: "Leadership: Daily SITREP",
    role: "Leader",
    level: "Menengah",
    description:
      "Cara membuat laporan harian, evaluasi tim, dan tindak lanjut isu.",
    lessons: [
      { id: "ls1", title: "Format SITREP & Skor", duration: "05:40" },
      { id: "ls2", title: "Evaluasi Target & Coverage", duration: "06:30" },
    ],
    quiz: {
      passPct: 70,
      questions: [
        {
          q: "Skor 1–5 pada checklist merepresentasikan?",
          options: [
            "Kepatuhan & kualitas",
            "Jumlah kunjungan",
            "Biaya operasional",
          ],
          answerIndex: 0,
        },
        {
          q: "Kapan isu dinaikkan ke manajemen?",
          options: [
            "Setiap hari",
            "Jika berdampak luas/berisiko tinggi",
            "Tidak perlu",
          ],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "hr-compliance",
    title: "HR: Kebijakan & Kepatuhan",
    role: "HR",
    level: "Dasar",
    description: "Ringkasan kebijakan perusahaan & prosedur cuti/izin.",
    lessons: [
      { id: "ls1", title: "Peraturan Perusahaan", duration: "04:50" },
      { id: "ls2", title: "Cuti, Izin, & Absensi", duration: "05:20" },
    ],
    quiz: {
      passPct: 70,
      questions: [
        {
          q: "Pengajuan cuti dilakukan melalui?",
          options: [
            "Chat pribadi",
            "Form resmi & approval atasan",
            "Telepon ke HR",
          ],
          answerIndex: 1,
        },
      ],
    },
  },
];
