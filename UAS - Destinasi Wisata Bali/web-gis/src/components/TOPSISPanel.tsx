"use client";

import { useState } from "react";
import { CRITERIA } from "@/data/baliDestinations";
import { getPotentialColor } from "@/lib/ahpTopsis";
import { AHPResult, TOPSISResult } from "@/types/tourism";
import { Calculator } from "lucide-react";

type TOPSISStep = "raw" | "normalized" | "weighted" | "ranking";

interface TOPSISPanelProps {
  ahpResult: AHPResult;
  topsisResult: TOPSISResult;
  onSelectDestination: (id: string) => void;
}

export default function TOPSISPanel({
  ahpResult,
  topsisResult,
  onSelectDestination,
}: TOPSISPanelProps) {
  const [step, setStep] = useState<TOPSISStep>("ranking");

  const steps: { id: TOPSISStep; label: string; subtitle: string }[] = [
    { id: "raw", label: "1. Matriks Keputusan (X)", subtitle: "Data mentah kriteria" },
    {
      id: "normalized",
      label: "2. Normalisasi (R)",
      subtitle: "r_ij = x_ij / √Σx²",
    },
    {
      id: "weighted",
      label: "3. Terbobot (Y) & Ideal (A+/A-)",
      subtitle: "y_ij = w_j × r_ij",
    },
    {
      id: "ranking",
      label: "4. Jarak Ideal & Ranking (V)",
      subtitle: "V_i = D- / (D+ + D-)",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Step selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            Tahapan Perhitungan Metode TOPSIS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`text-left p-3 rounded-lg border transition ${
                step === s.id
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="text-xs font-bold">{s.label}</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  step === s.id ? "text-teal-100" : "text-slate-500"
                }`}
              >
                {s.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Raw Decision Matrix */}
      {step === "raw" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Matriks Keputusan Awal (X) — {topsisResult.alternatives.length} Alternatif Destinasi
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Destinasi Wisata
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Kabupaten/Kota
                </th>
                {CRITERIA.map((c) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-2.5 text-right font-semibold text-slate-700"
                  >
                    <div>
                      {c.code} ({c.type === "benefit" ? "+" : "-"})
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">
                      {c.shortLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topsisResult.alternatives.map((alt) => (
                <tr key={alt.destination.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-600">
                    {alt.destination.id}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">
                    {alt.destination.nama}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {alt.destination.kabupaten}
                  </td>
                  {alt.rawValues.map((val, j) => (
                    <td
                      key={CRITERIA[j].code}
                      className="py-2 px-2.5 text-right font-mono text-slate-700"
                    >
                      {CRITERIA[j].key === "hargaTiket"
                        ? val.toLocaleString("id-ID")
                        : CRITERIA[j].key === "rating" ||
                          CRITERIA[j].key === "jarakBandara"
                        ? val.toFixed(1)
                        : val}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-teal-50/70 font-semibold border-t border-teal-200">
                <td colSpan={3} className="py-2.5 px-3 text-teal-900">
                  Pembagi Normalisasi (&radic;&Sigma;x<sub>ij</sub>&sup2;)
                </td>
                {topsisResult.divisors.map((div, j) => (
                  <td
                    key={CRITERIA[j].code}
                    className="py-2.5 px-2.5 text-right font-mono text-teal-900"
                  >
                    {div.toFixed(2)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Step 2: Normalized Matrix R */}
      {step === "normalized" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Matriks Keputusan Ternormalisasi (R)
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Destinasi Wisata
                </th>
                {CRITERIA.map((c) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-2.5 text-right font-semibold text-slate-700"
                  >
                    {c.code} ({c.shortLabel})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {topsisResult.alternatives.map((alt) => (
                <tr key={alt.destination.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-semibold text-slate-600">
                    {alt.destination.id}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {alt.destination.nama}
                  </td>
                  {alt.normalizedValues.map((val, j) => (
                    <td
                      key={CRITERIA[j].code}
                      className="py-2 px-2.5 text-right text-slate-700"
                    >
                      {val.toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Step 3: Weighted Normalized Matrix Y & A+ / A- */}
      {step === "weighted" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Matriks Ternormalisasi Terbobot (Y) &amp; Solusi Ideal (A<sup>+</sup> / A<sup>&minus;</sup>)
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Destinasi Wisata
                </th>
                {CRITERIA.map((c, j) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-2.5 text-right font-semibold text-slate-700"
                  >
                    <div>{c.code}</div>
                    <div className="text-[10px] font-mono text-teal-700">
                      w={ahpResult.weights[j].toFixed(3)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {topsisResult.alternatives.map((alt) => (
                <tr key={alt.destination.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-semibold text-slate-600">
                    {alt.destination.id}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {alt.destination.nama}
                  </td>
                  {alt.weightedValues.map((val, j) => (
                    <td
                      key={CRITERIA[j].code}
                      className="py-2 px-2.5 text-right text-slate-700"
                    >
                      {val.toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                <td colSpan={2} className="py-2.5 px-3 font-sans text-emerald-900">
                  Solusi Ideal Positif (A<sup>+</sup>)
                </td>
                {topsisResult.idealPositive.map((val, j) => (
                  <td
                    key={CRITERIA[j].code}
                    className="py-2.5 px-2.5 text-right text-emerald-800"
                  >
                    {val.toFixed(4)}
                  </td>
                ))}
              </tr>
              <tr className="bg-rose-50 font-bold border-t border-rose-200">
                <td colSpan={2} className="py-2.5 px-3 font-sans text-rose-900">
                  Solusi Ideal Negatif (A<sup>&minus;</sup>)
                </td>
                {topsisResult.idealNegative.map((val, j) => (
                  <td
                    key={CRITERIA[j].code}
                    className="py-2.5 px-2.5 text-right text-rose-800"
                  >
                    {val.toFixed(4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Step 4: D+, D-, V_i & Final Ranking */}
      {step === "ranking" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Hasil Akhir Jarak Ideal (D<sup>+</sup>, D<sup>&minus;</sup>), Nilai Preferensi (V<sub>i</sub>), &amp; Peringkat
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-2.5 px-3 text-center font-semibold text-slate-700">
                  Rank
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Destinasi Wisata
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700">
                  Kabupaten/Kota
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  D<sub>i</sub>
                  <sup>+</sup>
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  D<sub>i</sub>
                  <sup>&minus;</sup>
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-teal-800 bg-teal-50/50">
                  Preferensi (V<sub>i</sub>)
                </th>
                <th className="py-2.5 px-3 text-center font-semibold text-slate-700">
                  Kelas Potensi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topsisResult.ranked.map((item) => {
                const color = getPotentialColor(item.potentialClass);
                return (
                  <tr
                    key={item.destination.id}
                    onClick={() => onSelectDestination(item.destination.id)}
                    className="hover:bg-teal-50/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-[11px]"
                        style={{ backgroundColor: color }}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-500">
                      {item.destination.id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.destination.nama}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {item.destination.kabupaten}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.dPlus.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.dMinus.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-teal-900 bg-teal-50/30">
                      {item.preferenceScore.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {item.potentialClass}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
