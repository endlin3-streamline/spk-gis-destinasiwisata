# Panduan Import Dataset Wisata Bali ke ArcGIS (ArcMap & ArcGIS Pro)

Folder `datasets/` berisi 4 file siap pakai hasil perhitungan metode **AHP-TOPSIS** untuk 27 destinasi wisata di seluruh 9 Kabupaten/Kota Provinsi Bali dengan sistem koordinat geografis **WGS 1984 (EPSG:4326)**:

1. `bali_wisata_arcgis.csv` — Dataset titik 27 destinasi wisata lengkap dengan koordinat (`Longitude`, `Latitude`), 6 kriteria penilaian (`C1`–`C6`), jarak ideal (`D_Plus`, `D_Minus`), skor akhir (`SkorTOPSIS`), peringkat (`Rank`), dan klasifikasi potensi (`KelasPot`).
2. `bali_wisata_arcgis.geojson` — Format spasial GeoJSON (`EPSG:4326`) siap buka di ArcGIS Pro atau QGIS.
3. `bali_rekap_kabupaten.csv` — Rekap rata-rata potensi wisata untuk 9 Kabupaten/Kota (siap dilakukan *Table Join* ke Shapefile batas administrasi Kabupaten/Kota Bali untuk peta *Choropleth*).
4. `bali_ahp_weights.csv` — Ringkasan bobot prioritas kriteria AHP serta nilai $\lambda_{\max}$, $CI$, $RI$, dan $CR$.

> **Catatan Nama Kolom:** Seluruh nama kolom pada CSV dibuat $\le 10$ karakter tanpa spasi agar tidak terpotong (*truncated*) saat diekspor ke format ESRI Shapefile (`.shp`/`.dbf`).

---

## A. Cara Import CSV ke ArcMap (ArcGIS Desktop 10.x)

1. Buka **ArcMap**, lalu tambahkan peta batas administrasi Provinsi Bali (jika ada, misalnya shapefile dari Ina-Geoportal/BIG/GADM).
2. Klik menu **File &rarr; Add Data &rarr; Add XY Data...**
3. Pilih file `datasets/bali_wisata_arcgis.csv`.
4. Atur parameter koordinat:
   - **X Field**: `Longitude`
   - **Y Field**: `Latitude`
   - **Z Field**: `<None>`
5. Pada bagian *Coordinate System of Input Coordinates*, klik **Edit...** &rarr; pilih:
   - `Geographic Coordinate Systems` &rarr; `World` &rarr; **`WGS 1984`** (`EPSG:4326`).
6. Klik **OK** untuk menampilkan layer sementara (*Events*).
7. **Simpan permanen menjadi Shapefile (`.shp`)**:
   - Klik kanan layer `bali_wisata_arcgis.csv Events` di *Table of Contents*.
   - Pilih **Data &rarr; Export Data...**
   - Simpan sebagai `bali_wisata_ahp_topsis.shp` lalu tambahkan ke peta.

---

## B. Cara Import ke ArcGIS Pro

### Opsi 1: Menggunakan File CSV
1. Buka tab **Map &rarr; Add Data &rarr; XY Point Data**.
2. Isi parameter pada geoprocessing tool **XY Table To Point**:
   - **Input Table**: `datasets/bali_wisata_arcgis.csv`
   - **Output Feature Class**: `bali_wisata_ahp_topsis`
   - **X Field**: `Longitude`
   - **Y Field**: `Latitude`
   - **Coordinate System**: `GCS_WGS_1984` (EPSG:4326)
3. Klik **Run**.

### Opsi 2: Menggunakan File GeoJSON
1. Buka tab **Analysis &rarr; Tools**, cari **JSON To Features**.
2. Pilih **Input JSON**: `datasets/bali_wisata_arcgis.geojson`, tentukan nama output feature class, lalu klik **Run**.

---

## C. Rekomendasi Simbologi Peta Tematik (untuk Laporan UAS)

### 1. Peta Sebaran Potensi Destinasi (Layer Titik)
Klik kanan layer titik &rarr; **Properties &rarr; Symbology**:
- **Pilihan A (Categories / Unique Values)** berdasarkan field **`KelasPot`**:
  - `Sangat Potensial` ($V_i \ge 0.72$) &rarr; Hijau Tua (`#059669`)
  - `Potensial` ($0.58 \le V_i < 0.72$) &rarr; Biru Cerah (`#0284C7`)
  - `Cukup Potensial` ($0.44 \le V_i < 0.58$) &rarr; Oranye/Kuning (`#D97706`)
  - `Kurang Potensial` ($V_i < 0.44$) &rarr; Merah (`#DC2626`)
- **Pilihan B (Quantities / Graduated Symbols)** berdasarkan field **`SkorTOPSIS`**:
  - Ukuran simbol semakin besar untuk skor TOPSIS yang lebih tinggi.
- Aktifkan **Labels** menggunakan field `Nama` atau ekspresi `"#" & [Rank] & " " & [Nama]`.

### 2. Peta Choropleth Potensi per Kabupaten/Kota (Opsional)
1. Tambahkan shapefile poligon batas Kabupaten/Kota Provinsi Bali.
2. Klik kanan layer poligon &rarr; **Joins and Relates &rarr; Join...**
3. Hubungkan kolom nama kabupaten pada shapefile dengan kolom `Kabupaten` di `datasets/bali_rekap_kabupaten.csv`.
4. Atur simbologi **Graduated Colors** berdasarkan kolom `RataTOPSIS` untuk menampilkan zonasi potensi pariwisata antar kabupaten di Bali.

---

## D. Proyeksi Peta untuk Analisis Jarak / Layout
Jika ingin melakukan *Buffer Analysis* atau pengukuran jarak dalam satuan meter/kilometer di ArcGIS, proyeksikan layer menggunakan tool **Project** ke:
- **`WGS 1984 UTM Zone 50S`** (`EPSG:32750`) — zona UTM standar untuk wilayah Provinsi Bali.
