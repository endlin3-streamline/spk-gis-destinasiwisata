import { CRITERIA } from "@/data/baliDestinations";
import {
  AHPResult,
  PotentialClass,
  TOPSISAlternativeResult,
  TOPSISResult,
  TourismDestination,
} from "@/types/tourism";

// Saaty Random Consistency Index (RI) for n = 1..10
const SAATY_RI: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/**
 * Build a full n x n reciprocal pairwise comparison matrix from upper-triangle values.
 */
export function buildPairwiseMatrix(
  n: number,
  upperTriangle: Record<string, number>
): number[][] {
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(1)
  );
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const val = upperTriangle[`${i}-${j}`] ?? 1;
      matrix[i][j] = val;
      matrix[j][i] = 1 / val;
    }
  }
  return matrix;
}

/**
 * Compute Analytic Hierarchy Process (AHP) weights & consistency metrics.
 */
export function calculateAHP(pairwiseMatrix: number[][]): AHPResult {
  const n = pairwiseMatrix.length;

  // 1. Column sums
  const columnSums = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += pairwiseMatrix[i][j];
    }
    columnSums[j] = sum;
  }

  // 2. Normalized pairwise matrix
  const normalizedMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => pairwiseMatrix[i][j] / columnSums[j])
  );

  // 3. Priority weights (row averages)
  const weights = normalizedMatrix.map(
    (row) => row.reduce((acc, v) => acc + v, 0) / n
  );

  // 4. Weighted sum vector (A * w)
  const weightedSumVector = pairwiseMatrix.map((row) =>
    row.reduce((acc, val, j) => acc + val * weights[j], 0)
  );

  // 5. Consistency vector (lambda_i = (A*w)_i / w_i)
  const consistencyVector = weightedSumVector.map((ws, i) => ws / weights[i]);

  // 6. Lambda max, CI, RI, CR
  const lambdaMax =
    consistencyVector.reduce((acc, v) => acc + v, 0) / n;
  const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = SAATY_RI[n] ?? 1.24;
  const cr = ri > 0 ? ci / ri : 0;

  return {
    pairwiseMatrix,
    columnSums,
    normalizedMatrix,
    weights,
    weightedSumVector,
    consistencyVector,
    lambdaMax,
    ci,
    ri,
    cr,
    isConsistent: cr <= 0.1,
  };
}

/**
 * Classify TOPSIS preference score V_i into GIS potential classes.
 */
export function classifyPotential(score: number): PotentialClass {
  if (score >= 0.72) return "Sangat Potensial";
  if (score >= 0.58) return "Potensial";
  if (score >= 0.44) return "Cukup Potensial";
  return "Kurang Potensial";
}

export function getPotentialColor(cls: PotentialClass): string {
  switch (cls) {
    case "Sangat Potensial":
      return "#059669"; // emerald-600
    case "Potensial":
      return "#0284c7"; // sky-600
    case "Cukup Potensial":
      return "#d97706"; // amber-600
    case "Kurang Potensial":
      return "#dc2626"; // red-600
  }
}

/**
 * Compute TOPSIS ranking using AHP weights.
 */
export function calculateTOPSIS(
  destinations: TourismDestination[],
  weights: number[]
): TOPSISResult {
  const m = destinations.length;
  const n = CRITERIA.length;

  if (m === 0) {
    return {
      divisors: Array(n).fill(1),
      idealPositive: Array(n).fill(0),
      idealNegative: Array(n).fill(0),
      alternatives: [],
      ranked: [],
    };
  }

  // Raw decision matrix X (m x n)
  const rawMatrix: number[][] = destinations.map((d) =>
    CRITERIA.map((c) => Number(d[c.key]))
  );

  // 1. Vector normalization divisors sqrt(sum(x_ij^2))
  const divisors: number[] = Array.from({ length: n }, (_, j) => {
    const sumSq = rawMatrix.reduce((acc, row) => acc + row[j] * row[j], 0);
    return Math.sqrt(sumSq) || 1;
  });

  // 2. Normalized matrix R & Weighted normalized matrix Y
  const normalizedMatrix: number[][] = rawMatrix.map((row) =>
    row.map((val, j) => val / divisors[j])
  );
  const weightedMatrix: number[][] = normalizedMatrix.map((row) =>
    row.map((val, j) => val * weights[j])
  );

  // 3. Ideal positive (A+) and ideal negative (A-)
  const idealPositive: number[] = Array(n).fill(0);
  const idealNegative: number[] = Array(n).fill(0);

  for (let j = 0; j < n; j++) {
    const col = weightedMatrix.map((row) => row[j]);
    const maxVal = Math.max(...col);
    const minVal = Math.min(...col);
    if (CRITERIA[j].type === "benefit") {
      idealPositive[j] = maxVal;
      idealNegative[j] = minVal;
    } else {
      idealPositive[j] = minVal;
      idealNegative[j] = maxVal;
    }
  }

  // 4 & 5. Distances D+, D- and Preference Score V_i
  const alternatives: TOPSISAlternativeResult[] = destinations.map(
    (destination, i) => {
      let sumPlus = 0;
      let sumMinus = 0;
      for (let j = 0; j < n; j++) {
        const diffPlus = weightedMatrix[i][j] - idealPositive[j];
        const diffMinus = weightedMatrix[i][j] - idealNegative[j];
        sumPlus += diffPlus * diffPlus;
        sumMinus += diffMinus * diffMinus;
      }
      const dPlus = Math.sqrt(sumPlus);
      const dMinus = Math.sqrt(sumMinus);
      const denom = dPlus + dMinus;
      const preferenceScore = denom > 0 ? dMinus / denom : 0;

      return {
        destination,
        rawValues: rawMatrix[i],
        normalizedValues: normalizedMatrix[i],
        weightedValues: weightedMatrix[i],
        dPlus,
        dMinus,
        preferenceScore,
        rank: 0,
        potentialClass: classifyPotential(preferenceScore),
      };
    }
  );

  // Sort descending by preferenceScore and assign ranks
  const ranked = [...alternatives].sort(
    (a, b) => b.preferenceScore - a.preferenceScore
  );
  ranked.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    divisors,
    idealPositive,
    idealNegative,
    alternatives,
    ranked,
  };
}

/**
 * Format Saaty ratio nicely for UI display (e.g. 0.5 -> "1/2", 3 -> "3").
 */
export function formatSaatyValue(value: number): string {
  if (Math.abs(value - 1) < 1e-6) return "1";
  if (value > 1) return Number.isInteger(value) ? String(value) : value.toFixed(2);
  const inv = Math.round(1 / value);
  if (Math.abs(1 / inv - value) < 1e-4) return `1/${inv}`;
  return value.toFixed(3);
}

/**
 * Generate ArcGIS-ready CSV (UTF-8, WGS84 Latitude/Longitude, clean Shapefile-safe headers <= 10 chars).
 */
export function generateArcGISCsv(ranked: TOPSISAlternativeResult[]): string {
  const headers = [
    "ID",
    "Nama",
    "Kabupaten",
    "Kategori",
    "Latitude",
    "Longitude",
    "DayaTarik",
    "Akses",
    "Fasilitas",
    "Rating",
    "HargaTiket",
    "JarakBdr",
    "D_Plus",
    "D_Minus",
    "SkorTOPSIS",
    "Rank",
    "KelasPot",
  ];

  const escapeCsv = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = ranked.map((r) => {
    const d = r.destination;
    return [
      d.id,
      d.nama,
      d.kabupaten,
      d.kategori,
      d.latitude.toFixed(6),
      d.longitude.toFixed(6),
      d.dayaTarik,
      d.aksesibilitas,
      d.fasilitas,
      d.rating.toFixed(1),
      d.hargaTiket,
      d.jarakBandara.toFixed(1),
      r.dPlus.toFixed(6),
      r.dMinus.toFixed(6),
      r.preferenceScore.toFixed(6),
      r.rank,
      r.potentialClass,
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generate RFC 7946 GeoJSON FeatureCollection (EPSG:4326 / WGS84) ready for ArcGIS Pro & QGIS.
 */
export function generateArcGISGeoJSON(
  ranked: TOPSISAlternativeResult[],
  ahp: AHPResult
): string {
  const featureCollection = {
    type: "FeatureCollection",
    name: "bali_wisata_ahp_topsis",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    metadata: {
      method: "AHP-TOPSIS",
      consistencyRatio: Number(ahp.cr.toFixed(6)),
      isConsistent: ahp.isConsistent,
      weights: Object.fromEntries(
        CRITERIA.map((c, idx) => [c.code, Number(ahp.weights[idx].toFixed(6))])
      ),
    },
    features: ranked.map((r) => {
      const d = r.destination;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number(d.longitude.toFixed(6)),
            Number(d.latitude.toFixed(6)),
          ],
        },
        properties: {
          ID: d.id,
          Nama: d.nama,
          Kabupaten: d.kabupaten,
          Kategori: d.kategori,
          Latitude: Number(d.latitude.toFixed(6)),
          Longitude: Number(d.longitude.toFixed(6)),
          DayaTarik: d.dayaTarik,
          Akses: d.aksesibilitas,
          Fasilitas: d.fasilitas,
          Rating: d.rating,
          HargaTiket: d.hargaTiket,
          JarakBdr: d.jarakBandara,
          D_Plus: Number(r.dPlus.toFixed(6)),
          D_Minus: Number(r.dMinus.toFixed(6)),
          SkorTOPSIS: Number(r.preferenceScore.toFixed(6)),
          Rank: r.rank,
          KelasPot: r.potentialClass,
          Deskripsi: d.deskripsi,
        },
      };
    }),
  };

  return JSON.stringify(featureCollection, null, 2);
}
