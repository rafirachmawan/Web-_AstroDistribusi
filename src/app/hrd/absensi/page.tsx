// ================= src/app/hrd/absensi/page.tsx =================
"use client";
import { useMemo, useState } from "react";
import InputBlack from "../../../component/hrd/InputBlack";

type Log = {
  id: string;
  time: string;
  type: "IN" | "OUT";
  lat?: number;
  lng?: number;
  accuracy?: number;
  photoUrl?: string;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AbsensiPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pending, setPending] = useState<Partial<Log>>({ type: "IN" });
  const [loadingLoc, setLoadingLoc] = useState(false);

  const todayLogs = useMemo(
    () =>
      logs.filter(
        (l) => new Date(l.time).toDateString() === new Date().toDateString()
      ),
    [logs]
  );

  async function getLocation() {
    if (!navigator.geolocation) return alert("Geolocation tidak didukung");
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPending((s) => ({ ...s, lat: latitude, lng: longitude, accuracy }));
        setLoadingLoc(false);
      },
      (err) => {
        alert("Gagal ambil lokasi: " + err.message);
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPending((s) => ({ ...s, photoUrl: url }));
  }

  function submit() {
    if (!pending.lat || !pending.lng) return alert("Ambil lokasi dulu");
    if (!pending.photoUrl) return alert("Ambil foto dulu");
    const entry: Log = {
      id: uid(),
      time: new Date().toISOString(),
      type: (pending.type as any) || "IN",
      lat: pending.lat,
      lng: pending.lng,
      accuracy: pending.accuracy,
      photoUrl: pending.photoUrl,
    };
    setLogs((s) => [entry, ...s]);
    setPending({ type: entry.type });
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Absensi (Check-in Foto + GPS)
      </h1>

      <InputBlack>
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tipe
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={pending.type as any}
              onChange={(e) =>
                setPending((s) => ({ ...s, type: e.target.value as any }))
              }
            >
              <option>IN</option>
              <option>OUT</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Foto
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onChange={onPhoto}
            />
            {pending.photoUrl && (
              <img
                src={pending.photoUrl}
                alt="preview"
                className="mt-2 h-28 w-28 rounded-lg object-cover"
              />
            )}
          </div>
          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs font-medium text-slate-600">
                  Lokasi GPS
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  {pending.lat
                    ? `${pending.lat?.toFixed(6)}, ${pending.lng?.toFixed(
                        6
                      )} • ±${Math.round(pending.accuracy || 0)} m`
                    : "(belum diambil)"}
                </div>
              </div>
              <button
                onClick={getLocation}
                disabled={loadingLoc}
                className={`rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm ${
                  loadingLoc ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loadingLoc ? "Mengambil…" : "Ambil Lokasi"}
              </button>
              {pending.lat && pending.lng && (
                <a
                  href={`https://maps.google.com/?q=${pending.lat},${pending.lng}`}
                  target="_blank"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Buka di Maps
                </a>
              )}
              <div className="grow" />
              <button
                onClick={submit}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Simpan Absensi
              </button>
            </div>
          </div>
        </div>
      </InputBlack>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Log Hari Ini
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {["Waktu", "Tipe", "Lokasi", "Akurasi", "Foto"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {todayLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {new Date(l.time).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">{l.type}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {l.lat?.toFixed(6)}, {l.lng?.toFixed(6)}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    ±{Math.round(l.accuracy || 0)} m
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={l.photoUrl}
                      className="h-16 w-16 rounded object-cover"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
