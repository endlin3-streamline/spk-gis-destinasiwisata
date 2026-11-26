"use client";

import { TOPSISAlternativeResult } from "@/types/tourism";
import { getPotentialColor } from "@/lib/ahpTopsis";
import {
  Database,
  Download,
  FileJson,
  Plus,
  RotateCcw,
  Trash2,
  MapPin,
} from "lucide-react";

interface DatasetPanelProps {
  ranked: TOPSISAlternativeResult[];
  onExportCsv: () => void;
  onExportGeoJson: () => void;
  onOpenAddModal: () => void;
  onDeleteDestination: (id: string) => void;
  onResetDestinations: () => void;
  onInspectOnMap: (id: string) => void;
}

export default function DatasetPanel({
  ranked,
  onExportCsv,
  onExportGeoJson,
  onOpenAddModal,
  onDeleteDestination,
  onResetDestinations,
  onInspectOnMap,
}: DatasetPanelProps) {
  return (
    <div className="space-y-6">
      {/* ArcGIS Export & Guide Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Ekspor Dataset Siap Pakai untuk ArcGIS
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            File ekspor otomatis menyertakan koordinat geografis{" "}
            <strong>WGS 1984 (EPSG:4326)</strong>, seluruh atribut kriteria
            (C1–C6), serta hasil skor <strong>TOPSIS</strong> dan{" "}
            <strong>Kelas Potensi</strong> sesuai bobot AHP yang sedang aktif.
            Nama kolom sudah disesuaikan agar aman (&le;10 karakter) saat
            dikonversi ke Shapefile (<code>.shp</code>).
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh CSV ArcGIS (Add XY Data)
            </button>
            <button
              type="button"
              onClick={onExportGeoJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              <FileJson className="w-4 h-4" />
              Unduh GeoJSON (ArcGIS Pro / QGIS)
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-teal-300 mb-2">
            Langkah Cepat Import ke ArcGIS
          </h3>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              <strong>ArcMap:</strong> <em>File &rarr; Add Data &rarr; Add XY Data</em>, pilih CSV, X = <code>Longitude</code>, Y = <code>Latitude</code>, CRS = <code>GCS_WGS_1984</code>.
            </li>
            <li>
              <strong>ArcGIS Pro:</strong> <em>Map &rarr; Add Data &rarr; XY Point Data</em> (CSV) atau tool <em>JSON To Features</em> (GeoJSON).
            </li>
            <li>
              Klik kanan layer &rarr; <em>Export Data</em> ke <code>.shp</code> agar permanen.
            </li>
            <li>
              Atur <em>Symbology</em>: <strong>Categories / Unique Values</strong> pada kolom <code>KelasPot</code> atau <strong>Graduated Symbols</strong> pada <code>SkorTOPSIS</code>.
            </li>
          </ol>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Atribut Spasial Destinasi Wisata Bali ({ranked.length} Data)
            </h3>
            <p className="text-xs text-slate-500">
              Anda dapat menambah destinasi baru atau menghapus data untuk menguji sensitivitas ranking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDestinations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset 27 Data
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Destinasi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-2.5 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="py-2.5 px-2.5 text-left font-semibold text-slate-700">
                  Nama Destinasi
                </th>
                <th className="py-2.5 px-2.5 text-left font-semibold text-slate-700">
                  Kabupaten/Kota
                </th>
                <th className="py-2.5 px-2.5 text-left font-semibold text-slate-700">
                  Kategori
                </th>
                <th className="py-2.5 px-2.5 text-right font-semibold text-slate-700">
                  Lat / Lon (WGS84)
                </th>
                <th className="py-2.5 px-2.5 text-right font-semibold text-slate-700">
                  C1–C4
                </th>
                <th className="py-2.5 px-2.5 text-right font-semibold text-slate-700">
                  Tiket / Jarak
                </th>
                <th className="py-2.5 px-2.5 text-center font-semibold text-slate-700">
                  TOPSIS / Rank
                </th>
                <th className="py-2.5 px-2.5 text-center font-semibold text-slate-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((item) => {
                const d = item.destination;
                const color = getPotentialColor(item.potentialClass);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-2.5 font-mono font-semibold text-slate-600">
                      {d.id}
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                      {d.nama}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600">
                      {d.kabupaten}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600">
                      {d.kategori}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-[11px] text-slate-500">
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-[11px] text-slate-700">
                      {d.dayaTarik} / {d.aksesibilitas} / {d.fasilitas} /{" "}
                      {d.rating.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-[11px] text-slate-700">
                      Rp {d.hargaTiket.toLocaleString("id-ID")} • {d.jarakBandara} km
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        #{item.rank} • {item.preferenceScore.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          title="Lihat di Peta"
                          onClick={() => onInspectOnMap(d.id)}
                          className="p-1.5 rounded-md text-teal-700 hover:bg-teal-50 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Hapus Destinasi"
                          disabled={ranked.length <= 2}
                          onClick={() => onDeleteDestination(d.id)}
                          className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
