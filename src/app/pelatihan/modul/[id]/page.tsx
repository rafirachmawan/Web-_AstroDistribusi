"use client";
import { MODULES } from "../../../../component/training/TrainingData";
import VideoPlayer from "../../../../component/training/VideoPlayer";
import {
  getProgress,
  updateModuleProgress,
} from "../../../../component/training/useProgress";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ModulDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const moduleId = Array.isArray(params?.id) ? params!.id[0] : params?.id;

  const modMaybe = useMemo(
    () => MODULES.find((m) => m.id === moduleId),
    [moduleId]
  );

  if (!modMaybe) {
    return <div className="text-slate-600">Modul tidak ditemukan.</div>;
  }

  const mod = modMaybe; // aman

  const store = getProgress();
  const doneIds = store[mod.id]?.completedLessons ?? [];

  const firstIncomplete =
    mod.lessons.find((l) => !doneIds.includes(l.id))?.id ?? mod.lessons[0]?.id;

  const [current, setCurrent] = useState<string | undefined>(firstIncomplete);
  useEffect(() => setCurrent(firstIncomplete), [firstIncomplete]);

  const cur = mod.lessons.find((l) => l.id === current) ?? mod.lessons[0];
  const allDone = mod.lessons.every((l) => doneIds.includes(l.id));

  function markDone(id: string) {
    const next = Array.from(new Set([...doneIds, id]));
    updateModuleProgress(mod.id, { completedLessons: next });
  }

  return (
    <main className="bg-slate-50 pb-16">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-slate-800">
          {mod.title}
        </div>
        <div className="text-xs text-slate-500">
          Role: {mod.role} · Level: {mod.level}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <VideoPlayer src={cur?.videoUrl} />
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-800">
              {cur.title}
            </div>
            <div className="text-xs text-slate-500">Durasi {cur.duration}</div>
            <p className="mt-2 text-sm text-slate-700">
              {cur.description || "Ringkasan materi video."}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => markDone(cur.id)}
              className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Tandai Selesai
            </button>

            {!allDone && (
              <button
                onClick={() => {
                  const idx = mod.lessons.findIndex((l) => l.id === cur.id);
                  const next =
                    mod.lessons[Math.min(idx + 1, mod.lessons.length - 1)];
                  setCurrent(next.id);
                }}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Materi Berikutnya
              </button>
            )}

            {allDone && (
              <Link
                href={`/pelatihan/modul/${mod.id}/quiz`}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Mulai Kuis
              </Link>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-700">
            Daftar Materi
          </div>
          <ul className="space-y-2">
            {mod.lessons.map((l) => {
              const done = doneIds.includes(l.id);
              const active = current === l.id;
              return (
                <li
                  key={l.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                    active
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    onClick={() => setCurrent(l.id)}
                    className="text-left text-slate-800"
                  >
                    {l.title}
                  </button>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      done
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-100"
                    }`}
                  >
                    {done ? "Selesai" : "Belum"}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}
