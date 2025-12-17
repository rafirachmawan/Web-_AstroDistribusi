// ================= src/app/salesman/kunjungan/page.tsx =================
"use client";
import { useEffect, useMemo, useState } from "react";
import CustomerPicker from "../../../component/CustomerPicker";

const TEMPS = ["Dingin", "Hangat", "Panas", "Menyala"] as const;

type Visit = {
  customerId?: string;
  temp?: (typeof TEMPS)[number];
  notes?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  photos?: string[]; // URL sementara
};

export default function VisitPage() {
  const [data, setData] = useState<Visit>({});
  const [getting, setGetting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("cid") || undefined;
    if (cid) setData((s) => ({ ...s, customerId: cid }));
  }, []);

  async function getLocation() {
    if (!navigator.geolocation) return alert("Geolocation tidak didukung");
    setGetting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setData((s) => ({ ...s, lat: latitude, lng: longitude, accuracy }));
        setGetting(false);
      },
      (err) => {
        alert("Gagal ambil lokasi: " + err.message);
        setGetting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onSubmit() {
    if (!data.customerId) return alert("Pilih customer dulu");
    const payload = { ...data, time: new Date().toISOString() };
    console.log("SUBMIT VISIT:", payload);
    alert("(Demo) Kunjungan tersimpan ke console. Integrasi backend menyusul.");
  }

  const mapUrl = useMemo(() => {
    if (!data.lat || !data.lng) return "";
    return `https://maps.google.com/?q=${data.lat},${data.lng}`;
  }, [data.lat, data.lng]);

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Input Kunjungan
      </h1>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Customer
          </label>
          <CustomerPicker
            value={data.customerId}
            onChange={(id) => setData((s) => ({ ...s, customerId: id }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Temperature
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={data.temp}
            onChange={(e) =>
              setData((s) => ({ ...s, temp: e.target.value as any }))
            }
          >
            <option value="">Pilih…</option>
            {TEMPS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1 md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Catatan
          </label>
          <textarea
            className="h-[74px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Hasil kunjungan, kebutuhan, feedback pelanggan…"
            value={data.notes || ""}
            onChange={(e) => setData((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-xs font-medium text-slate-600">
                Lokasi GPS
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {data.lat
                  ? `${data.lat.toFixed(6)}, ${data.lng?.toFixed(
                      6
                    )} • ±${Math.round(data.accuracy || 0)} m`
                  : "(belum diambil)"}
              </div>
            </div>
            <button
              onClick={getLocation}
              disabled={getting}
              className={`rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm ${
                getting ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {getting ? "Mengambil…" : "Ambil Lokasi"}
            </button>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Buka di Maps
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Simpan Draft
        </button>
        <button
          onClick={onSubmit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Simpan Kunjungan
        </button>
      </div>

      <style jsx global>{`
        .input-black input,
        .input-black select,
        .input-black textarea {
          color: #000;
        }
        .input-black input::placeholder,
        .input-black textarea::placeholder {
          color: #000;
          opacity: 0.6;
        }
      `}</style>
    </main>
  );
}
