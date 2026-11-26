"use client";

import { AHP_PRESETS, CRITERIA } from "@/data/baliDestinations";
import { formatSaatyValue } from "@/lib/ahpTopsis";
import { AHPResult } from "@/types/tourism";
import { RotateCcw } from "lucide-react";

const SAATY_OPTIONS: { value: number; label: string }[] = [
  { value: 9, label: "9 — Mutlak lebih penting" },
  { value: 8, label: "8" },
  { value: 7, label: "7 — Sangat lebih penting" },
  { value: 6, label: "6" },
  { value: 5, label: "5 — Lebih penting" },
  { value: 4, label: "4" },
  { value: 3, label: "3 — Sedikit lebih penting" },
  { value: 2, label: "2" },
  { value: 1, label: "1 — Sama penting" },
  { value: 1 / 2, label: "1/2" },
  { value: 1 / 3, label: "1/3" },
  { value: 1 / 4, label: "1/4" },
  { value: 1 / 5, label: "1/5" },
  { value: 1 / 6, label: "1/6" },
  { value: 1 / 7, label: "1/7" },
  { value: 1 / 8, label: "1/8" },
  { value: 1 / 9, label: "1/9" },
];

interface AHPPanelProps {
  upperTriangle: Record<string, number>;
  ahpResult: AHPResult;
  onChangePair: (i: number, j: number, value: number) => void;
  onApplyPreset: (upper: Record<string, number>) => void;
  onResetDefault: () => void;
}

const TH = "py-2.5 px-2 text-xs font-medium text-slate-500";
const CODE = "px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]";

export default function AHPPanel({
  upperTriangle,
  ahpResult,
  onChangePair,
  onApplyPreset,
  onResetDefault,
}: AHPPanelProps) {
  const maxWeight = Math.max(...ahpResult.weights);

  return (
    <div className="space-y-6">
      {/* Presets & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Skenario Pembobotan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih preset atau ubah nilai perbandingan (skala Saaty 1–9) di
              matriks bawah.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Standar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AHP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.upperTriangle)}
              className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition"
            >
              <div className="text-sm font-semibold text-slate-800">
                {preset.name}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Consistency Check + Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Consistency Metrics */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Uji Konsistensi
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                ahpResult.isConsistent ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ahpResult.isConsistent ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
              {ahpResult.isConsistent
                ? "Konsisten (CR \u2264 0.10)"
                : "Tidak konsisten (CR > 0.10)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">
                Eigenvalue Maks (&lambda;<sub>max</sub>)
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {ahpResult.lambdaMax.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                Consistency Index (CI)
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {ahpResult.ci.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                Random Index (RI, n=6)
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {ahpResult.ri.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                Consistency Ratio (CR)
              </div>
              <div
                className={`text-lg font-extrabold tabular-nums mt-0.5 ${
                  ahpResult.isConsistent ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {ahpResult.cr.toFixed(4)}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div>
              <code className={CODE}>CI = (&lambda;max - n) / (n - 1)</code>{" "}
              <code className={CODE}>CR = CI / RI</code>
            </div>
            <div>
              Bobot valid apabila <strong>CR &le; 0.10</strong>.
            </div>
          </div>
        </div>

        {/* Priority Weight Distribution */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Bobot Prioritas Kriteria (W<sub>j</sub>)
          </h3>
          <div className="space-y-3">
            {CRITERIA.map((c, idx) => {
              const weight = ahpResult.weights[idx];
              const pct = weight * 100;
              return (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.code}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {c.label}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          c.type === "benefit"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 tabular-nums">
                      {weight.toFixed(4)}{" "}
                      <span className="text-slate-400 font-normal">
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        c.type === "benefit" ? "bg-teal-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, pct * 1.8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pairwise Comparison Matrix (Interactive) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            1. Matriks Perbandingan Berpasangan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ubah sel dropdown (segitiga atas): seberapa penting kriteria baris
            dibanding kolom. Segitiga bawah terisi otomatis dengan kebalikannya
            (1/a<sub>ij</sub>).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-slate-200">
                <th className={`${TH} px-3 text-left`}>Kriteria</th>
                {CRITERIA.map((c) => (
                  <th key={c.code} className={`${TH} text-center min-w-[95px]`}>
                    <div className="text-slate-700">{c.code}</div>
                    <div className="text-[10px] font-normal text-slate-500">
                      {c.shortLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CRITERIA.map((rowCrit, i) => (
                <tr key={rowCrit.code} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    <span className="text-slate-400 mr-1.5">
                      {rowCrit.code}
                    </span>
                    {rowCrit.shortLabel}
                  </td>
                  {CRITERIA.map((colCrit, j) => {
                    const val = ahpResult.pairwiseMatrix[i][j];
                    if (i === j) {
                      return (
                        <td
                          key={colCrit.code}
                          className="py-2 px-2 text-center font-bold bg-slate-50 text-slate-400"
                        >
                          1
                        </td>
                      );
                    }
                    if (i < j) {
                      const currentVal = upperTriangle[`${i}-${j}`] ?? 1;
                      return (
                        <td
                          key={colCrit.code}
                          className="py-1.5 px-1.5 text-center"
                        >
                          <select
                            aria-label={`${rowCrit.code} dibanding ${colCrit.code}`}
                            value={String(currentVal)}
                            onChange={(e) =>
                              onChangePair(i, j, Number(e.target.value))
                            }
                            className="w-full text-center text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {SAATY_OPTIONS.map((opt) => (
                              <option
                                key={opt.label}
                                value={String(opt.value)}
                              >
                                {formatSaatyValue(opt.value)}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={colCrit.code}
                        className="py-2 px-2 text-center text-slate-500"
                      >
                        {formatSaatyValue(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="font-semibold border-t border-slate-300">
                <td className="py-2.5 px-3 text-slate-700">Jumlah Kolom</td>
                {ahpResult.columnSums.map((sum, j) => (
                  <td
                    key={CRITERIA[j].code}
                    className="py-2.5 px-2 text-center text-slate-800"
                  >
                    {sum.toFixed(4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Normalized Matrix & Consistency Vector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          2. Normalisasi, Bobot &amp; Vektor Konsistensi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-slate-200">
                <th className={`${TH} px-3 text-left`}>Kriteria</th>
                {CRITERIA.map((c) => (
                  <th key={c.code} className={`${TH} text-right`}>
                    {c.code}
                  </th>
                ))}
                <th className={`${TH} px-3 text-right bg-slate-50 text-slate-800`}>
                  Bobot (W)
                </th>
                <th className={`${TH} px-3 text-right`}>A &times; W</th>
                <th className={`${TH} px-3 text-right`}>
                  &lambda;<sub>i</sub>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CRITERIA.map((rowCrit, i) => (
                <tr key={rowCrit.code} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    <span className="text-slate-400 mr-1.5">
                      {rowCrit.code}
                    </span>
                    {rowCrit.shortLabel}
                  </td>
                  {ahpResult.normalizedMatrix[i].map((val, j) => (
                    <td
                      key={CRITERIA[j].code}
                      className="py-2 px-2 text-right text-slate-600"
                    >
                      {val.toFixed(4)}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-50">
                    {ahpResult.weights[i].toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {ahpResult.weightedSumVector[i].toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {ahpResult.consistencyVector[i].toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}