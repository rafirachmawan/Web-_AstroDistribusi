"use client";

import { useEffect, useRef, useState } from "react";

type HistoryItem = { date: string; url: string };

const HISTORY_API = "/api/monitoring/daily/history";
const FINALIZE_API = "/api/monitoring/daily/finalize";
const WHOAMI_API = "/api/whoami";

/** ===== Signature Pad sederhana (canvas) ===== */
function SignaturePad({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    if ("touches" in e && e.touches[0]) {
      return {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top,
      };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return { x: me.clientX - r.left, y: me.clientY - r.top };
  };

  const start = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current;
    if (!c) return;
    onChange(c.toDataURL("image/png"));
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-slate-200 bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          className="w-full h-44 touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Tanda tangani pada kotak di atas.</span>
        <button
          type="button"
          onClick={clear}
          className="ml-auto rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
        >
          Bersihkan
        </button>
      </div>
    </div>
  );
}

/** ===== Halaman Rekap & TTD ===== */
export default function RekapClient() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [leader, setLeader] = useState("");
  const [depo, setDepo] = useState("");

  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // === AUTO-ISI leader & depo dari whoami ===
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(WHOAMI_API, { cache: "no-store" });
        const j = await r.json().catch(() => null);
        // Leader: pakai profile.full_name → fallback username dari email
        const name =
          j?.profile?.full_name ||
          (j?.user?.email ? String(j.user.email).split("@")[0] : "");
        if (name && !leader) setLeader(name);
      } catch {
        // abaikan
      } finally {
        // Depo pasti "Tulungagung" sesuai permintaan
        if (!depo) setDepo("Tulungagung");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHistory() {
    try {
      const qs = new URLSearchParams({
        leader: leader ?? "",
        depo: depo ?? "",
      });
      const r = await fetch(`${HISTORY_API}?${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (Array.isArray(j?.items)) setHistory(j.items);
      else setHistory([]);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leader, depo]);

  async function finalize() {
    if (!signature) {
      alert("Tanda tangan belum diisi.");
      return;
    }
    if (!leader || !depo || !date) {
      alert("Lengkapi Tanggal / Leader / Depo.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(FINALIZE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_date: date,
          leader,
          depo,
          signature_base64: signature,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Gagal finalize");
        return;
      }
      // sukses -> refresh riwayat, kosongkan TTD
      setSignature(null);
      await fetchHistory();
      alert("Berhasil final & dibuat PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-slate-50 pb-24">
      {/* Header form singkat */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Leader</label>
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="Nama leader"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Depo</label>
          <input
            value={depo}
            onChange={(e) => setDepo(e.target.value)}
            placeholder="Nama depo"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchHistory}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TTD + Finalize */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-slate-800">
          Rekap & Tanda Tangan
        </h2>

        <div className="mb-4 text-sm text-slate-600">
          Pastikan semua tab (
          <span className="font-medium">
            Checklist Area, Evaluasi Tim, Target &amp; Achievement, Project
            Tracking, Agenda &amp; Jadwal, Achievement
          </span>
          ) sudah diisi. Lalu tanda tangani di bawah dan klik{" "}
          <span className="font-medium">Simpan &amp; Buat PDF (Final)</span>.
        </div>

        <SignaturePad value={signature} onChange={setSignature} />

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={finalize}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Memproses…" : "Simpan & Buat PDF (Final)"}
          </button>
        </div>
      </section>

      {/* Riwayat */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-800">
          Riwayat PDF
        </h3>
        {history.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="text-slate-700">{h.date}</span>
                <a
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  Lihat PDF
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-500">Belum ada riwayat.</div>
        )}
      </section>
    </main>
  );
}
