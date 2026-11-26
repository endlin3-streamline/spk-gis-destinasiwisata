"use client";

import { useState } from "react";
import { BALI_REGENCIES, TOURISM_CATEGORIES } from "@/data/baliDestinations";
import {
  BaliRegency,
  TourismCategory,
  TourismDestination,
} from "@/types/tourism";
import { X } from "lucide-react";

interface AddDestinationModalProps {
  open: boolean;
  nextId: string;
  onClose: () => void;
  onAdd: (destination: TourismDestination) => void;
}

export default function AddDestinationModal({
  open,
  nextId,
  onClose,
  onAdd,
}: AddDestinationModalProps) {
  const [nama, setNama] = useState("");
  const [kabupaten, setKabupaten] = useState<BaliRegency>("Kabupaten Badung");
  const [kategori, setKategori] = useState<TourismCategory>("Pantai");
  const [latitude, setLatitude] = useState("-8.6500");
  const [longitude, setLongitude] = useState("115.2000");
  const [deskripsi, setDeskripsi] = useState("");
  const [dayaTarik, setDayaTarik] = useState("85");
  const [aksesibilitas, setAksesibilitas] = useState("80");
  const [fasilitas, setFasilitas] = useState("80");
  const [rating, setRating] = useState("4.5");
  const [hargaTiket, setHargaTiket] = useState("25000");
  const [jarakBandara, setJarakBandara] = useState("30");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    onAdd({
      id: nextId,
      nama: nama.trim(),
      kabupaten,
      kategori,
      latitude: Number(latitude) || -8.5,
      longitude: Number(longitude) || 115.2,
      deskripsi:
        deskripsi.trim() ||
        `Destinasi wisata ${kategori.toLowerCase()} yang berlokasi di ${kabupaten}.`,
      dayaTarik: Math.min(100, Math.max(1, Number(dayaTarik) || 80)),
      aksesibilitas: Math.min(100, Math.max(1, Number(aksesibilitas) || 80)),
      fasilitas: Math.min(100, Math.max(1, Number(fasilitas) || 80)),
      rating: Math.min(5, Math.max(1, Number(rating) || 4.5)),
      hargaTiket: Math.max(1000, Number(hargaTiket) || 10000),
      jarakBandara: Math.max(1, Number(jarakBandara) || 20),
    });

    setNama("");
    setDeskripsi("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tambah Destinasi Wisata Baru ({nextId})
            </h3>
            <p className="text-xs text-slate-500">
              Data baru akan langsung dihitung dalam ranking AHP-TOPSIS &amp; muncul di peta GIS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Destinasi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pantai Pandawa"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kabupaten / Kota
              </label>
              <select
                value={kabupaten}
                onChange={(e) => setKabupaten(e.target.value as BaliRegency)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {BALI_REGENCIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Wisata
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as TourismCategory)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {TOURISM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Latitude (WGS84, contoh: -8.8453)
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Longitude (WGS84, contoh: 115.1871)
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-800 mb-2">
              Nilai Kriteria Penilaian (C1–C6)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C1 Daya Tarik (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={dayaTarik}
                  onChange={(e) => setDayaTarik(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C2 Aksesibilitas (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={aksesibilitas}
                  onChange={(e) => setAksesibilitas(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C3 Fasilitas (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={fasilitas}
                  onChange={(e) => setFasilitas(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C4 Rating (1.0-5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C5 Harga Tiket (Rp)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={hargaTiket}
                  onChange={(e) => setHargaTiket(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  C6 Jarak Bandara (km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  value={jarakBandara}
                  onChange={(e) => setJarakBandara(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Ringkasan daya tarik destinasi wisata..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 shadow-sm"
            >
              Simpan &amp; Hitung TOPSIS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
