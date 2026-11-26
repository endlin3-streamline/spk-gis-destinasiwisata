export type CriterionKey =
  | "dayaTarik"
  | "aksesibilitas"
  | "fasilitas"
  | "rating"
  | "hargaTiket"
  | "jarakBandara";

export type CriterionType = "benefit" | "cost";

export interface CriterionDefinition {
  code: string;
  key: CriterionKey;
  label: string;
  shortLabel: string;
  type: CriterionType;
  unit: string;
  description: string;
}

export type BaliRegency =
  | "Kota Denpasar"
  | "Kabupaten Badung"
  | "Kabupaten Gianyar"
  | "Kabupaten Tabanan"
  | "Kabupaten Klungkung"
  | "Kabupaten Karangasem"
  | "Kabupaten Bangli"
  | "Kabupaten Buleleng"
  | "Kabupaten Jembrana";

export type TourismCategory =
  | "Pantai"
  | "Budaya & Sejarah"
  | "Alam & Pegunungan"
  | "Ekowisata"
  | "Bahari & Snorkeling";

export interface TourismDestination {
  id: string;
  nama: string;

  kabupaten: BaliRegency;
  kategori: TourismCategory;

  latitude: number;
  longitude: number;
  deskripsi: string;

  dayaTarik: number; // C1: 0-100 (Benefit)
  aksesibilitas: number; // C2: 0-100 (Benefit)
  fasilitas: number; // C3: 0-100 (Benefit)
  rating: number; // C4: 1.0-5.0 (Benefit)
  hargaTiket: number; // C5: IDR (Cost)
  jarakBandara: number; // C6: km from Ngurah Rai Airport (Cost)
}

export type PotentialClass =
  | "Sangat Potensial"
  | "Potensial"
  | "Cukup Potensial"
  | "Kurang Potensial";

export interface AHPResult {
  pairwiseMatrix: number[][];
  columnSums: number[];
  normalizedMatrix: number[][];
  weights: number[];
  weightedSumVector: number[];
  consistencyVector: number[];
  lambdaMax: number;
  ci: number;
  ri: number;
  cr: number;
  isConsistent: boolean;
}

export interface TOPSISAlternativeResult {
  destination: TourismDestination;
  rawValues: number[];
  normalizedValues: number[];
  weightedValues: number[];
  dPlus: number;
  dMinus: number;
  preferenceScore: number; // V_i (0..1)
  rank: number;
  potentialClass: PotentialClass;
}

export interface TOPSISResult {
  divisors: number[];
  idealPositive: number[]; // A+
  idealNegative: number[]; // A-
  alternatives: TOPSISAlternativeResult[]; // original order
  ranked: TOPSISAlternativeResult[]; // sorted by preferenceScore desc
}

export interface AHPPreset {
  id: string;
  name: string;
  description: string;
  upperTriangle: Record<string, number>; // key: "i-j" where i < j
}
