// ============ src/app/stok/master-barang/page.tsx ============
import FilterBar from "../../../component/FilterBar";
import { DataTable } from "../../../component/DataTable";

const rows = [
  {
    code: "BRG-001",
    name: "Minyak Goreng 1L",
    principle: "PT A",
    convL: 1,
    convM: 10,
    convS: 100,
  },
  {
    code: "BRG-002",
    name: "Gula 1kg",
    principle: "PT B",
    convL: 1,
    convM: 5,
    convS: 50,
  },
  {
    code: "BRG-003",
    name: "MSG 250g",
    principle: "PT C",
    convL: 1,
    convM: 8,
    convS: 80,
  },
];

export default function MasterBarangPage() {
  const columns = [
    { key: "code", header: "Kode" },
    { key: "name", header: "Nama Barang", className: "w-[40%]" },
    { key: "principle", header: "Principle" },
    { key: "convL", header: "Konv L" },
    { key: "convM", header: "Konv M" },
    { key: "convS", header: "Konv S" },
    {
      key: "actions",
      header: "",
      render: () => (
        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">
            Edit
          </button>
          <button className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50">
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="bg-slate-50">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Master Barang
      </h1>
      <FilterBar />
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">{rows.length} data</div>
        <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          + Tambah Barang
        </button>
      </div>
      <DataTable columns={columns} data={rows} />
    </main>
  );
}
