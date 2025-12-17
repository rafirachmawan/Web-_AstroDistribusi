// ================= src/app/pelatihan/sertifikat/[id]/page.tsx =================
"use client";
import { MODULES } from "../../../../component/training/TrainingData";
import { getProgress } from "../../../../component/training/useProgress";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const mod = useMemo(
    () => MODULES.find((m) => m.id === params.id),
    [params.id]
  );
  const p = getProgress()[mod?.id || ""];
  const [nama, setNama] = useState("Nama Karyawan");

  if (!mod) return <div className="text-slate-600">Modul tidak ditemukan.</div>;
  if (!p?.passed)
    return <div className="text-slate-600">Belum lulus kuis modul ini.</div>;

  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">Sertifikat</h1>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Nama di Sertifikat
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => window.print()}
            className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Sertifikat tampilan cetak */}
      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-blue-200 bg-white p-8 text-center shadow-sm print:border-0 print:p-0">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          ASTRO GROUP
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-900">
          SERTIFIKAT KELULUSAN
        </div>
        <div className="mt-6 text-sm text-slate-600">Diberikan kepada</div>
        <div className="mt-2 text-2xl font-semibold text-slate-900">{nama}</div>
        <div className="mt-4 text-sm text-slate-600">
          Telah menyelesaikan pelatihan
        </div>
        <div className="mt-1 text-xl font-semibold text-slate-900">
          {mod.title}
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Nilai Kuis: <span className="font-semibold">{p.quizScore}%</span> ·
          Tanggal: {tanggal}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <div className="h-10 border-t border-slate-300" />
            <div className="text-xs text-slate-500">Leader/HR</div>
          </div>
          <div>
            <div className="h-10 border-t border-slate-300" />
            <div className="text-xs text-slate-500">Karyawan</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
        }
        .input-black input {
          color: #000;
        }
      `}</style>
    </main>
  );
}
