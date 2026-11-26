"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  BALI_REGENCIES,
  CRITERIA,
  DEFAULT_UPPER_TRIANGLE,
  INITIAL_DESTINATIONS,
  TOURISM_CATEGORIES,
} from "@/data/baliDestinations";
import {
  buildPairwiseMatrix,
  calculateAHP,
  calculateTOPSIS,
  classifyPotential,
  generateArcGISCsv,
  generateArcGISGeoJSON,
  getPotentialColor,
} from "@/lib/ahpTopsis";
import { PotentialClass, TourismDestination } from "@/types/tourism";
import AHPPanel from "@/components/AHPPanel";
import TOPSISPanel from "@/components/TOPSISPanel";
import DatasetPanel from "@/components/DatasetPanel";
import AddDestinationModal from "@/components/AddDestinationModal";
import { Download, FileJson, Plus, Search } from "lucide-react";

const BaliMap = dynamic(() => import("@/components/BaliMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] lg:h-[610px] rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
      Memuat peta...
    </div>
  ),
});

type ActiveTab = "map" | "ahp" | "topsis" | "data";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "map", label: "Peta & Peringkat" },
  { id: "ahp", label: "Pembobotan AHP" },
  { id: "topsis", label: "Tahapan TOPSIS" },
  { id: "data", label: "Dataset & Ekspor" },
];

const CLASS_ORDER: PotentialClass[] = [
  "Sangat Potensial",
  "Potensial",
  "Cukup Potensial",
  "Kurang Potensial",
];

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function WebGISDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("map");
  const [destinations, setDestinations] = useState<TourismDestination[]>(
    INITIAL_DESTINATIONS
  );
  const [upperTriangle, setUpperTriangle] = useState<Record<string, number>>(
    DEFAULT_UPPER_TRIANGLE
  );
  const [selectedId, setSelectedId] = useState<string | null>("W05");
  const [searchQuery, setSearchQuery] = useState("");
  const [regencyFilter, setRegencyFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Compute AHP
  const ahpResult = useMemo(() => {
    const matrix = buildPairwiseMatrix(CRITERIA.length, upperTriangle);
    return calculateAHP(matrix);
  }, [upperTriangle]);

  // Compute TOPSIS
  const topsisResult = useMemo(() => {
    return calculateTOPSIS(destinations, ahpResult.weights);
  }, [destinations, ahpResult.weights]);

  // Filtered list for map & sidebar
  const filteredRanked = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topsisResult.ranked.filter((item) => {
      const d = item.destination;
      if (q && !d.nama.toLowerCase().includes(q) && !d.kabupaten.toLowerCase().includes(q)) {
        return false;
      }
      if (regencyFilter !== "ALL" && d.kabupaten !== regencyFilter) return false;
      if (categoryFilter !== "ALL" && d.kategori !== categoryFilter) return false;
      if (classFilter !== "ALL" && item.potentialClass !== classFilter) return false;
      return true;
    });
  }, [topsisResult.ranked, searchQuery, regencyFilter, categoryFilter, classFilter]);

  // Regency average summary
  const regencySummary = useMemo(() => {
    return BALI_REGENCIES.map((reg) => {
      const subset = topsisResult.ranked.filter(
        (r) => r.destination.kabupaten === reg
      );
      const avg =
        subset.length > 0
          ? subset.reduce((s, x) => s + x.preferenceScore, 0) / subset.length
          : 0;
      const top = subset[0];
      return {
        regency: reg,
        count: subset.length,
        avgScore: avg,
        topName: top?.destination.nama ?? "-",
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [topsisResult.ranked]);

  // Potential class counts
  const classCounts = useMemo(() => {
    const counts: Record<PotentialClass, number> = {
      "Sangat Potensial": 0,
      Potensial: 0,
      "Cukup Potensial": 0,
      "Kurang Potensial": 0,
    };
    topsisResult.ranked.forEach((r) => {
      counts[r.potentialClass] += 1;
    });
    return counts;
  }, [topsisResult.ranked]);

  const selectedResult = useMemo(() => {
    return (
      topsisResult.ranked.find((r) => r.destination.id === selectedId) ??
      topsisResult.ranked[0] ??
      null
    );
  }, [topsisResult.ranked, selectedId]);

  const topDestination = topsisResult.ranked[0] ?? null;

  const nextId = useMemo(() => {
    const nums = destinations
      .map((d) => Number(d.id.replace(/\D/g, "")))
      .filter((n) => !Number.isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `W${String(maxNum + 1).padStart(2, "0")}`;
  }, [destinations]);

  const handleChangePair = (i: number, j: number, value: number) => {
    setUpperTriangle((prev) => ({
      ...prev,
      [`${i}-${j}`]: value,
    }));
  };

  const handleExportCsv = () => {
    const csv = generateArcGISCsv(topsisResult.ranked);
    downloadTextFile(
      "bali_wisata_arcgis_ahp_topsis.csv",
      "\uFEFF" + csv,
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportGeoJson = () => {
    const geojson = generateArcGISGeoJSON(topsisResult.ranked, ahpResult);
    downloadTextFile(
      "bali_wisata_arcgis_ahp_topsis.geojson",
      geojson,
      "application/geo+json;charset=utf-8;"
    );
  };

  const handleAddDestination = (dest: TourismDestination) => {
    setDestinations((prev) => [...prev, dest]);
    setSelectedId(dest.id);
    setActiveTab("map");
  };

  const handleDeleteDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleInspectOnMap = (id: string) => {
    setSelectedId(id);
    setActiveTab("map");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SIPETA"
              className="w-9 h-9 object-contain"
            />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">
                SIPETA
              </h1>
              <p className="text-xs text-slate-400">Destinasi Wisata Bali</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5" />
              CSV ArcGIS
            </button>
            <button
              type="button"
              onClick={handleExportGeoJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-800 transition"
            >
              <FileJson className="w-3.5 h-3.5" />
              GeoJSON
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Destinasi
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary: one panel, cells separated by hairlines */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-white p-4">
            <div className="text-xs text-slate-500">Total Destinasi</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {destinations.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              di 9 kabupaten/kota
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="text-xs text-slate-500">Potensi Tertinggi</div>
            <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
              {topDestination?.destination.nama ?? "-"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              Skor{" "}
              {topDestination ? topDestination.preferenceScore.toFixed(4) : "-"}
              {topDestination ? ` • ${topDestination.destination.kabupaten}` : ""}
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="text-xs text-slate-500">Konsistensi AHP (CR)</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {ahpResult.cr.toFixed(4)}
            </div>
            <div
              className={`text-[11px] font-medium mt-1 ${
                ahpResult.isConsistent ? "text-slate-500" : "text-rose-600"
              }`}
            >
              {ahpResult.isConsistent
                ? `Konsisten (λmax = ${ahpResult.lambdaMax.toFixed(3)})`
                : "CR > 0.10 — sesuaikan matriks AHP"}
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="text-xs text-slate-500">Kelas Potensi</div>
            <div className="mt-2 space-y-1 text-[11px]">
              {CLASS_ORDER.map((cls) => (
                <div key={cls} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-600 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getPotentialColor(cls) }}
                    />
                    {cls}
                  </span>
                  <strong className="tabular-nums text-slate-900">
                    {classCounts[cls]}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation Tabs (underline style, no icons) */}
        <nav className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-200">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px pt-1 pb-3 text-sm font-semibold border-b-2 transition ${
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: MAP & RANKING */}
        {activeTab === "map" && (
          <div className="space-y-6">
            {/* Filter Bar: plain controls, no wrapper card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama wisata atau kabupaten..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={regencyFilter}
                onChange={(e) => setRegencyFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Kabupaten/Kota</option>
                {BALI_REGENCIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Kategori Wisata</option>
                {TOURISM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Kelas Potensi</option>
                {CLASS_ORDER.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Map + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 xl:col-span-8">
                <BaliMap
                  items={filteredRanked}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>

              {/* Ranked Sidebar */}
              <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 flex flex-col h-[540px] lg:h-[610px]">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-900">
                    Peringkat Potensi Wisata
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan {filteredRanked.length} dari{" "}
                    {topsisResult.ranked.length} destinasi
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredRanked.map((item) => {
                    const d = item.destination;
                    const color = getPotentialColor(item.potentialClass);
                    const isSelected = selectedResult?.destination.id === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedId(d.id)}
                        className={`w-full text-left px-4 py-3 transition flex items-start gap-3 border-l-4 ${
                          isSelected
                            ? "bg-slate-50 border-l-slate-900"
                            : "border-l-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                          style={{ backgroundColor: color }}
                        >
                          {item.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {d.nama}
                            </span>
                            <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">
                              {item.preferenceScore.toFixed(4)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {d.kabupaten} • {d.kategori}
                          </div>
                          <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(
                                  item.preferenceScore * 100
                                )}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredRanked.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Tidak ada destinasi yang sesuai filter.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Destination Detail + Regency Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {selectedResult && (
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: getPotentialColor(
                            selectedResult.potentialClass
                          ),
                        }}
                      >
                        Peringkat #{selectedResult.rank} •{" "}
                        {selectedResult.potentialClass}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                        {selectedResult.destination.nama}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedResult.destination.kabupaten} •{" "}
                        {selectedResult.destination.kategori}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">
                        Skor Preferensi
                      </div>
                      <div
                        className="text-3xl font-extrabold tabular-nums"
                        style={{
                          color: getPotentialColor(
                            selectedResult.potentialClass
                          ),
                        }}
                      >
                        {selectedResult.preferenceScore.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                    {selectedResult.destination.deskripsi}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 mt-4 pt-4 border-t border-slate-100">
                    {CRITERIA.map((c, idx) => {
                      const raw = selectedResult.rawValues[idx];
                      const display =
                        c.key === "hargaTiket"
                          ? `Rp ${raw.toLocaleString("id-ID")}`
                          : c.key === "jarakBandara"
                          ? `${raw.toFixed(1)} km`
                          : c.key === "rating"
                          ? `${raw.toFixed(1)} / 5.0`
                          : `${raw} / 100`;
                      return (
                        <div key={c.code}>
                          <div className="text-[11px] text-slate-500">
                            {c.code} {c.shortLabel}
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                            {display}
                          </div>
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            bobot {(ahpResult.weights[idx] * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Average Potential per Regency */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Rata-Rata Potensi per Kabupaten/Kota
                </h3>
                <div className="space-y-3">
                  {regencySummary.map((r, idx) => (
                    <div key={r.regency} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {idx + 1}. {r.regency}{" "}
                          <span className="text-[10px] text-slate-400">
                            ({r.count})
                          </span>
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {r.avgScore.toFixed(4)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(r.avgScore * 100)}%`,
                            backgroundColor: getPotentialColor(
                              classifyPotential(r.avgScore)
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AHP */}
        {activeTab === "ahp" && (
          <AHPPanel
            upperTriangle={upperTriangle}
            ahpResult={ahpResult}
            onChangePair={handleChangePair}
            onApplyPreset={(upper) => setUpperTriangle({ ...upper })}
            onResetDefault={() =>
              setUpperTriangle({ ...DEFAULT_UPPER_TRIANGLE })
            }
          />
        )}

        {/* TAB 3: TOPSIS */}
        {activeTab === "topsis" && (
          <TOPSISPanel
            ahpResult={ahpResult}
            topsisResult={topsisResult}
            onSelectDestination={handleInspectOnMap}
          />
        )}

        {/* TAB 4: DATASET & ARCGIS */}
        {activeTab === "data" && (
          <DatasetPanel
            ranked={topsisResult.ranked}
            onExportCsv={handleExportCsv}
            onExportGeoJson={handleExportGeoJson}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDeleteDestination={handleDeleteDestination}
            onResetDestinations={() => setDestinations(INITIAL_DESTINATIONS)}
            onInspectOnMap={handleInspectOnMap}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong>SIPETA</strong> · Destinasi Wisata Bali — UAS Decision
            Support &amp; Geography Information Systems
          </div>
          <div>WGS 1984 (EPSG:4326)</div>
        </div>
      </footer>

      <AddDestinationModal
        open={isAddModalOpen}
        nextId={nextId}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDestination}
      />
    </div>
  );
}