"use client";

import { AHP_PRESETS, CRITERIA } from "@/data/baliDestinations";
import { formatSaatyValue } from "@/lib/ahpTopsis";
import { AHPResult } from "@/types/tourism";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

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

export default function AHPPanel({
  upperTriangle,
  ahpResult,
  onChangePair,
  onApplyPreset,
  onResetDefault,
}: AHPPanelProps) {
  return (
    <div className="space-y-6">
      {/* Presets & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              Skenario Pembobotan Kriteria AHP
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih preset pakar atau ubah langsung nilai perbandingan berpasangan skala Saaty (1–9) di matriks bawah.
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
              className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition group"
            >
              <div className="text-sm font-semibold text-slate-800 group-hover:text-teal-700">
                {preset.name}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Consistency Check Banner + Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consistency Metrics */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Uji Konsistensi AHP (Saaty)
              </h3>
              {ahpResult.isConsistent ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  KONSISTEN (CR &le; 0.10)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  TIDAK KONSISTEN (CR &gt; 0.10)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Eigenvalue Maks (&lambda;<sub>max</sub>)
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {ahpResult.lambdaMax.toFixed(4)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Consistency Index (CI)
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {ahpResult.ci.toFixed(4)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Random Index (RI, n=6)
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {ahpResult.ri.toFixed(2)}
                </div>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  ahpResult.isConsistent
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-rose-50/70 border-rose-200"
                }`}
              >
                <div className="text-[11px] text-slate-600">
                  Consistency Ratio (CR)
                </div>
                <div
                  className={`text-lg font-extrabold font-mono mt-0.5 ${
                    ahpResult.isConsistent ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {ahpResult.cr.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div>
              Rumus: <code>CI = (&lambda;max - n) / (n - 1)</code> &nbsp;|&nbsp;{" "}
              <code>CR = CI / RI</code>
            </div>
            <div>
              Bobot AHP dinyatakan valid apabila <strong>CR &le; 0.10 (10%)</strong>.
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
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.code}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {c.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          c.type === "benefit"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            1. Matriks Perbandingan Berpasangan (Pairwise Comparison Matrix)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ubah sel segitiga atas (berwarna biru muda) untuk membandingkan tingkat kepentingan kriteria baris terhadap kriteria kolom. Segitiga bawah otomatis terisi kebalikannya (1/a<sub>ij</sub>).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Kriteria
                </th>
                {CRITERIA.map((c) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-2 text-center font-semibold text-slate-700 min-w-[95px]"
                  >
                    <div>{c.code}</div>
                    <div className="text-[10px] font-normal text-slate-500">
                      {c.shortLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CRITERIA.map((rowCrit, i) => (
                <tr key={rowCrit.code} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    <span className="font-mono text-teal-700 mr-1.5">
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
                          className="py-2 px-2 text-center font-mono font-bold bg-slate-100/80 text-slate-500"
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
                          className="py-1.5 px-1.5 text-center bg-sky-50/50"
                        >
                          <select
                            aria-label={`${rowCrit.code} dibanding ${colCrit.code}`}
                            value={String(currentVal)}
                            onChange={(e) =>
                              onChangePair(i, j, Number(e.target.value))
                            }
                            className="w-full text-center font-mono text-xs font-semibold text-slate-800 bg-white border border-sky-200 rounded-md py-1 px-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                        className="py-2 px-2 text-center font-mono text-slate-500"
                      >
                        {formatSaatyValue(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                <td className="py-2.5 px-3 text-slate-700">Jumlah Kolom</td>
                {ahpResult.columnSums.map((sum, j) => (
                  <td
                    key={CRITERIA[j].code}
                    className="py-2.5 px-2 text-center font-mono text-slate-800"
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          2. Matriks Normalisasi AHP, Bobot Prioritas &amp; Vektor Konsistensi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Kriteria
                </th>
                {CRITERIA.map((c) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-2 text-right font-semibold text-slate-700"
                  >
                    {c.code}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right font-semibold text-teal-700 bg-teal-50/50">
                  Bobot (W)
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  A &times; W
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  &lambda;<sub>i</sub>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {CRITERIA.map((rowCrit, i) => (
                <tr key={rowCrit.code} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800 whitespace-nowrap">
                    {rowCrit.code} — {rowCrit.shortLabel}
                  </td>
                  {ahpResult.normalizedMatrix[i].map((val, j) => (
                    <td
                      key={CRITERIA[j].code}
                      className="py-2 px-2 text-right text-slate-600"
                    >
                      {val.toFixed(4)}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-bold text-teal-800 bg-teal-50/40">
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
