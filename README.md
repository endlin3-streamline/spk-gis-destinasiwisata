# SIPETA BALI — SPK Pemilihan Potensi Destinasi Wisata Bali Berbasis GIS (AHP-TOPSIS)

Proyek UAS **Decision Support and Geography Information Systems** yang menggabungkan metode **AHP (Analytic Hierarchy Process)** untuk pembobotan kriteria dan **TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)** untuk perankingan 27 destinasi wisata di seluruh **9 Kabupaten/Kota Provinsi Bali**, lengkap dengan dataset siap pakai untuk **ArcGIS** dan aplikasi **Web GIS Next.js**.

## Struktur Proyek

```text
UAS - Destinasi Wisata Bali/
├── datasets/
│   ├── bali_wisata_arcgis.csv       # Dataset 27 destinasi (WGS84 XY) siap Add XY Data di ArcGIS
│   ├── bali_wisata_arcgis.geojson   # Dataset spasial GeoJSON (EPSG:4326) untuk ArcGIS Pro / QGIS
│   ├── bali_rekap_kabupaten.csv     # Rekap rata-rata skor 9 Kabupaten/Kota untuk Table Join Choropleth
│   ├── bali_ahp_weights.csv         # Ringkasan bobot prioritas kriteria & uji konsistensi AHP
│   └── PANDUAN_ARCGIS.md            # Langkah lengkap import & simbologi di ArcMap / ArcGIS Pro
├── scripts/
│   └── generate-datasets.ps1        # Script generator dataset sinkron dengan rumus AHP-TOPSIS Web GIS
└── web-gis/                         # Aplikasi Web GIS Next.js (App Router + Tailwind CSS + Leaflet)
    ├── src/app/
    ├── src/components/
    ├── src/data/baliDestinations.ts
    ├── src/lib/ahpTopsis.ts
    └── src/types/tourism.ts
```

## Kriteria Penilaian (AHP-TOPSIS)

| Kode | Kriteria | Tipe | Satuan |
| :--- | :--- | :---: | :--- |
| **C1** | Daya Tarik Wisata | Benefit | Skor (0–100) |
| **C2** | Aksesibilitas | Benefit | Skor (0–100) |
| **C3** | Fasilitas & Amenitas | Benefit | Skor (0–100) |
| **C4** | Popularitas / Rating | Benefit | Skala (1.0–5.0) |
| **C5** | Biaya / Harga Tiket | Cost | Rupiah (Rp) |
| **C6** | Jarak dari Bandara Ngurah Rai | Cost | Kilometer (km) |

## Fitur Web GIS (`web-gis/`)

1. **Peta GIS Interaktif (Leaflet)**:
   - 4 pilihan basemap: *OpenStreetMap*, *Esri World Imagery (Satellite)*, *Esri Topographic*, dan *Carto Light*.
   - Pin peringkat berwarna otomatis sesuai kelas potensi (*Sangat Potensial*, *Potensial*, *Cukup Potensial*, *Kurang Potensial*).
   - Titik referensi Bandara Internasional I Gusti Ngurah Rai beserta garis jarak ke destinasi terpilih.
   - Filter berdasarkan nama, Kabupaten/Kota (9 wilayah), kategori wisata, dan kelas potensi.
   - Rekap rata-rata skor potensi per Kabupaten/Kota.
2. **Kalkulator Pembobotan AHP**:
   - Matriks perbandingan berpasangan 6×6 interaktif skala Saaty (1–9) dengan pengisian otomatis resiprokal.
   - 3 skenario preset (*Seimbang*, *Wisatawan Hemat & Dekat*, *Eksplorasi Daya Tarik Maksimal*).
   - Uji konsistensi otomatis ($\lambda_{\max}$, $CI$, $RI = 1.24$, dan $CR \le 0.10$).
3. **Tabel Perhitungan Bertahap TOPSIS**:
   - Matriks Keputusan ($X$) & pembagi normalisasi, Matriks Ternormalisasi ($R$), Matriks Terbobot ($Y$) + Solusi Ideal ($A^+$, $A^-$), serta tabel akhir $D^+$, $D^-$, $V_i$, dan Peringkat.
4. **Manajemen Dataset & Ekspor Langsung ke ArcGIS**:
   - Tambah/hapus destinasi wisata baru secara langsung untuk uji sensitivitas.
   - Ekspor hasil perhitungan aktif ke format **CSV (ArcGIS XY)** dan **GeoJSON (EPSG:4326)**.

## Cara Menjalankan Aplikasi Web GIS

Pastikan **Node.js (LTS)** sudah terpasang, lalu jalankan:

```bash
cd web-gis
npm install
npm run dev
```

Kemudian buka `http://localhost:3000` di browser.
