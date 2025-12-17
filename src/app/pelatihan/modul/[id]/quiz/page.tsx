"use client";
import { MODULES } from "../../../../../component/training/TrainingData";
import {
  getProgress,
  updateModuleProgress,
} from "../../../../../component/training/useProgress";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function QuizPage() {
  const params = useParams<{ id?: string | string[] }>();
  const moduleId = Array.isArray(params?.id) ? params!.id[0] : params?.id;
  const router = useRouter();

  const modMaybe = useMemo(
    () => MODULES.find((m) => m.id === moduleId),
    [moduleId]
  );

  // Guard dulu — hentikan render jika tidak ada modul
  if (!modMaybe) {
    return <div className="text-slate-600">Modul tidak ditemukan.</div>;
  }

  // Setelah guard, ikat ke konstanta 'mod' yang TYPEnya pasti Module
  const mod = modMaybe;

  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const prog = getProgress()[mod.id];

  const submit = () => {
    const correct = mod.quiz.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
      0
    );
    const score = Math.round((correct / mod.quiz.questions.length) * 100);
    const passed = score >= mod.quiz.passPct;
    updateModuleProgress(mod.id, { quizScore: score, passed });
    setDone(true);
  };

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Kuis: {mod.title}
      </h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {!done ? (
          <div className="space-y-6">
            {mod.quiz.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-800">
                  {qi + 1}. {q.q}
                </div>
                <div className="mt-2 grid gap-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        answers[qi] === oi
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        className="accent-blue-600"
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const n = [...answers];
                          n[qi] = oi;
                          setAnswers(n);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={submit}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Kumpulkan Jawaban
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-sm text-slate-600">Nilai Anda</div>
            <div className="mt-1 text-4xl font-bold tabular-nums text-slate-900">
              {prog?.quizScore ?? 0}%
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${
                prog?.passed ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {prog?.passed ? "LULUS" : "BELUM LULUS"}
            </div>
            <div className="mt-4 flex justify-center gap-3">
              {prog?.passed && (
                <button
                  onClick={() => router.push(`/pelatihan/sertifikat/${mod.id}`)}
                  className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Lihat Sertifikat
                </button>
              )}
              <button
                onClick={() => location.reload()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ulangi Kuis
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .input-black input,
        .input-black select {
          color: #000;
        }
        .input-black input::placeholder {
          color: #000;
          opacity: 0.6;
        }
      `}</style>
    </main>
  );
}
