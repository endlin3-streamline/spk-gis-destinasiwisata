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
  generateArcGISCsv,
  generateArcGISGeoJSON,
  getPotentialColor,
} from "@/lib/ahpTopsis";
import { PotentialClass, TourismDestination } from "@/types/tourism";
import AHPPanel from "@/components/AHPPanel";
import TOPSISPanel from "@/components/TOPSISPanel";
import DatasetPanel from "@/components/DatasetPanel";
import AddDestinationModal from "@/components/AddDestinationModal";
import {
  Award,
  BarChart3,
  Calculator,
  CheckCircle2,
  Compass,
  Database,
  Download,
  FileJson,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";

const BaliMap = dynamic(() => import("@/components/BaliMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] lg:h-[610px] rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
      Memuat peta interaktif Bali (Leaflet)...
    </div>
  ),
});

type ActiveTab = "map" | "ahp" | "topsis" | "data";

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
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                  SIPETA BALI
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Web GIS • AHP-TOPSIS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SPK Penilaian Potensi Destinasi Wisata Provinsi Bali (9 Kabupaten/Kota)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                ahpResult.isConsistent
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              {ahpResult.isConsistent ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              CR: {ahpResult.cr.toFixed(4)}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              CSV ArcGIS
            </button>
            <button
              type="button"
              onClick={handleExportGeoJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 border border-slate-700 transition"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              GeoJSON
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Destinasi
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Cakupan Data Spasial</span>
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {destinations.length}{" "}
              <span className="text-sm font-medium text-slate-500">
                Destinasi
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Tersebar di seluruh 9 Kabupaten/Kota Bali
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Peringkat #1 Potensi Tertinggi</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
              {topDestination?.destination.nama ?? "-"}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              V<sub>1</sub> ={" "}
              {topDestination ? topDestination.preferenceScore.toFixed(4) : "-"}{" "}
              • {topDestination?.destination.kabupaten}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Konsistensi Bobot AHP</span>
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
              {ahpResult.cr.toFixed(4)}
            </div>
            <div
              className={`text-[11px] font-semibold mt-1 ${
                ahpResult.isConsistent ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {ahpResult.isConsistent
                ? `Valid & Konsisten (λmax = ${ahpResult.lambdaMax.toFixed(3)})`
                : "CR > 0.10 — Sesuaikan matriks AHP"}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Distribusi Kelas Potensi</span>
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-emerald-700 font-medium">Sangat Pot.</span>
                <strong className="font-mono">
                  {classCounts["Sangat Potensial"]}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-700 font-medium">Potensial</span>
                <strong className="font-mono">{classCounts["Potensial"]}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 font-medium">Cukup Pot.</span>
                <strong className="font-mono">
                  {classCounts["Cukup Potensial"]}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700 font-medium">Kurang Pot.</span>
                <strong className="font-mono">
                  {classCounts["Kurang Potensial"]}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "map", label: "Peta GIS & Ranking", icon: MapIcon },
            { id: "ahp", label: "Pembobotan AHP", icon: SlidersHorizontal },
            { id: "topsis", label: "Tahapan TOPSIS", icon: Calculator },
            { id: "data", label: "Dataset & Ekspor ArcGIS", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: MAP & RANKING */}
        {activeTab === "map" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama wisata atau kabupaten..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={regencyFilter}
                onChange={(e) => setRegencyFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Kabupaten / Kota (9)</option>
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
                <option value="Sangat Potensial">Sangat Potensial</option>
                <option value="Potensial">Potensial</option>
                <option value="Cukup Potensial">Cukup Potensial</option>
                <option value="Kurang Potensial">Kurang Potensial</option>
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
              <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[540px] lg:h-[610px]">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Peringkat Potensi Wisata
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Menampilkan {filteredRanked.length} dari{" "}
                      {topsisResult.ranked.length} destinasi
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    AHP-TOPSIS
                  </span>
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
                        className={`w-full text-left px-4 py-3 transition flex items-start gap-3 ${
                          isSelected
                            ? "bg-teal-50/70 border-l-4 border-l-teal-600"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-xs"
                          style={{ backgroundColor: color }}
                        >
                          {item.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {d.nama}
                            </span>
                            <span
                              className="font-mono text-xs font-extrabold shrink-0"
                              style={{ color }}
                            >
                              {item.preferenceScore.toFixed(4)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span className="truncate">
                              {d.kabupaten} • {d.kategori}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {d.id}
                            </span>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {selectedResult && (
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: getPotentialColor(
                              selectedResult.potentialClass
                            ),
                          }}
                        >
                          Peringkat #{selectedResult.rank} •{" "}
                          {selectedResult.potentialClass}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {selectedResult.destination.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                        {selectedResult.destination.nama}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedResult.destination.kabupaten} •{" "}
                        {selectedResult.destination.kategori} • WGS84 (
                        {selectedResult.destination.latitude.toFixed(4)},{" "}
                        {selectedResult.destination.longitude.toFixed(4)})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">
                        Skor Preferensi TOPSIS (V<sub>i</sub>)
                      </div>
                      <div
                        className="text-2xl font-extrabold font-mono"
                        style={{
                          color: getPotentialColor(
                            selectedResult.potentialClass
                          ),
                        }}
                      >
                        {selectedResult.preferenceScore.toFixed(4)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        D<sup>+</sup>={selectedResult.dPlus.toFixed(4)} | D
                        <sup>&minus;</sup>={selectedResult.dMinus.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {selectedResult.destination.deskripsi}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
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
                        <div
                          key={c.code}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {c.code} {c.shortLabel}
                            </span>
                            <span className="font-mono text-[10px] text-teal-700">
                              w={(ahpResult.weights[idx] * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-1">
                            {display}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Average Potential per Regency */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Rata-Rata Potensi per Kabupaten/Kota
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Agregasi spasial nilai preferensi TOPSIS di 9 wilayah administratif Bali.
                </p>
                <div className="space-y-2.5">
                  {regencySummary.map((r, idx) => (
                    <div key={r.regency} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {idx + 1}. {r.regency}{" "}
                          <span className="text-[10px] text-slate-400">
                            ({r.count})
                          </span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {r.avgScore.toFixed(4)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                          style={{
                            width: `${Math.round(r.avgScore * 100)}%`,
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
            <strong>SIPETA BALI</strong> — UAS Decision Support &amp; Geography
            Information Systems (AHP-TOPSIS)
          </div>
          <div>
            Koordinat Referensi: WGS 1984 (EPSG:4326) • Siap Integrasi ArcGIS
          </div>
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
