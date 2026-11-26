"use client";

import { TOPSISAlternativeResult } from "@/types/tourism";
import { getPotentialColor } from "@/lib/ahpTopsis";
import {
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

const TH = "py-2.5 px-2.5 text-xs font-medium text-slate-500";
const CODE = "px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]";

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
      {/* Export + ArcGIS steps: one panel, two columns */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Ekspor untuk ArcGIS
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Berisi koordinat <strong>WGS 1984 (EPSG:4326)</strong>, kriteria
            C1–C6, skor <strong>TOPSIS</strong>, dan kelas potensi sesuai bobot
            AHP yang sedang aktif. Nama kolom maksimal 10 karakter agar aman
            dikonversi ke Shapefile (<code className={CODE}>.shp</code>).
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 transition"
            >
              <Download className="w-4 h-4" />
              Unduh CSV
            </button>
            <button
              type="button"
              onClick={onExportGeoJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <FileJson className="w-4 h-4" />
              Unduh GeoJSON
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-6">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Import ke ArcGIS
          </h3>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              <strong>ArcMap:</strong> File &rarr; Add Data &rarr; Add XY Data,
              pilih CSV, X = <code className={CODE}>Longitude</code>, Y ={" "}
              <code className={CODE}>Latitude</code>, CRS ={" "}
              <code className={CODE}>GCS_WGS_1984</code>.
            </li>
            <li>
              <strong>ArcGIS Pro:</strong> Map &rarr; Add Data &rarr; XY Point
              Data (CSV), atau tool JSON To Features (GeoJSON).
            </li>
            <li>
              Klik kanan layer &rarr; Export Data ke{" "}
              <code className={CODE}>.shp</code> agar permanen.
            </li>
            <li>
              Symbology: <strong>Unique Values</strong> pada{" "}
              <code className={CODE}>KelasPot</code>, atau{" "}
              <strong>Graduated Symbols</strong> pada{" "}
              <code className={CODE}>SkorTOPSIS</code>.
            </li>
          </ol>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Tabel Atribut Destinasi ({ranked.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDestinations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Destinasi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className={`${TH} text-left`}>ID</th>
                <th className={`${TH} text-left`}>Nama Destinasi</th>
                <th className={`${TH} text-left`}>Kabupaten/Kota</th>
                <th className={`${TH} text-left`}>Kategori</th>
                <th className={`${TH} text-right`}>Lat, Lon</th>
                <th className={`${TH} text-right`}>C1 / C2 / C3 / C4</th>
                <th className={`${TH} text-right`}>C5 Tiket • C6 Jarak</th>
                <th className={`${TH} text-center`}>Rank • Skor</th>
                <th className={`${TH} text-center`}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((item) => {
                const d = item.destination;
                const color = getPotentialColor(item.potentialClass);
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2.5 text-slate-400 tabular-nums">
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
                    <td className="py-2.5 px-2.5 text-right text-slate-500 tabular-nums">
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-700 tabular-nums">
                      {d.dayaTarik} / {d.aksesibilitas} / {d.fasilitas} /{" "}
                      {d.rating.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-700 tabular-nums">
                      Rp {d.hargaTiket.toLocaleString("id-ID")} •{" "}
                      {d.jarakBandara} km
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-900 tabular-nums"
                        title={item.potentialClass}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        #{item.rank} • {item.preferenceScore.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          title="Lihat di Peta"
                          onClick={() => onInspectOnMap(d.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
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
