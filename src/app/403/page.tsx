export default function Forbidden() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          403 – Akses Ditolak
        </h1>
        <p className="mt-2 text-slate-600">
          Anda tidak memiliki akses ke modul ini. Silakan hubungi admin bila ini
          sebuah kesalahan.
        </p>
      </div>
    </main>
  );
}
