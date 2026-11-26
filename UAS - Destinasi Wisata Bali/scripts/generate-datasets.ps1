# Generate ArcGIS-ready datasets (CSV + GeoJSON) using exact AHP-TOPSIS formulas
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $rootDir "datasets"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Criteria definitions (C1..C6)
$criteria = @(
  @{ code="C1"; key="dayaTarik";     label="Daya Tarik Wisata";    type="benefit"; unit="Skor (0-100)" },
  @{ code="C2"; key="aksesibilitas"; label="Aksesibilitas";        type="benefit"; unit="Skor (0-100)" },
  @{ code="C3"; key="fasilitas";     label="Fasilitas & Amenitas"; type="benefit"; unit="Skor (0-100)" },
  @{ code="C4"; key="rating";        label="Popularitas / Rating"; type="benefit"; unit="Skala (1.0-5.0)" },
  @{ code="C5"; key="hargaTiket";    label="Biaya / Harga Tiket";  type="cost";    unit="Rupiah (Rp)" },
  @{ code="C6"; key="jarakBandara";  label="Jarak dari Bandara";   type="cost";    unit="Kilometer (km)" }
)

# Default Pairwise Matrix (exact match with web-gis/src/data/baliDestinations.ts)
$n = 6
$upper = @{
  "0-1"=2.0; "0-2"=3.0; "0-3"=3.0; "0-4"=5.0; "0-5"=5.0;
  "1-2"=2.0; "1-3"=2.0; "1-4"=3.0; "1-5"=4.0;
  "2-3"=1.0; "2-4"=2.0; "2-5"=3.0;
  "3-4"=2.0; "3-5"=3.0;
  "4-5"=2.0
}

$A = @()
for ($i = 0; $i -lt $n; $i++) {
  $row = @()
  for ($j = 0; $j -lt $n; $j++) {
    if ($i -eq $j) { $row += 1.0 }
    elseif ($i -lt $j) { $row += [double]$upper["$i-$j"] }
    else { $row += 1.0 / [double]$upper["$j-$i"] }
  }
  $A += ,$row
}

# Column sums
$colSums = @()
for ($j = 0; $j -lt $n; $j++) {
  $s = 0.0
  for ($i = 0; $i -lt $n; $i++) { $s += $A[$i][$j] }
  $colSums += $s
}

# Weights
$weights = @()
for ($i = 0; $i -lt $n; $i++) {
  $rowSum = 0.0
  for ($j = 0; $j -lt $n; $j++) { $rowSum += ($A[$i][$j] / $colSums[$j]) }
  $weights += ($rowSum / $n)
}

# Consistency check
$lambdaSum = 0.0
for ($i = 0; $i -lt $n; $i++) {
  $aw = 0.0
  for ($j = 0; $j -lt $n; $j++) { $aw += $A[$i][$j] * $weights[$j] }
  $lambdaSum += ($aw / $weights[$i])
}
$lambdaMax = $lambdaSum / $n
$ci = ($lambdaMax - $n) / ($n - 1)
$ri = 1.24
$cr = $ci / $ri

# 27 Destinations (exact match with baliDestinations.ts)
$destinations = @(
  @{ id="W01"; nama="Pantai Sanur"; kabupaten="Kota Denpasar"; kategori="Pantai"; lat=-8.6935; lon=115.2633; dayaTarik=87; aksesibilitas=95; fasilitas=93; rating=4.5; hargaTiket=15000; jarakBandara=15.2; deskripsi="Pantai pesisir timur Denpasar yang terkenal dengan matahari terbit, jalur pejalan kaki tepi pantai, dan perairan tenang." },
  @{ id="W02"; nama="Monumen Bajra Sandhi"; kabupaten="Kota Denpasar"; kategori="Budaya & Sejarah"; lat=-8.6717; lon=115.2339; dayaTarik=76; aksesibilitas=95; fasilitas=86; rating=4.5; hargaTiket=25000; jarakBandara=14.5; deskripsi="Monumen perjuangan rakyat Bali di kawasan Lapangan Puputan Margarana Renon dengan diorama sejarah lengkap." },
  @{ id="W03"; nama="Taman Werdhi Budaya (Art Centre)"; kabupaten="Kota Denpasar"; kategori="Budaya & Sejarah"; lat=-8.6548; lon=115.2323; dayaTarik=72; aksesibilitas=92; fasilitas=82; rating=4.4; hargaTiket=15000; jarakBandara=16.0; deskripsi="Kompleks pusat pelestarian seni dan budaya Bali serta lokasi penyelenggaraan Pesta Kesenian Bali tahunan." },

  @{ id="W04"; nama="Pura Luhur Uluwatu"; kabupaten="Kabupaten Badung"; kategori="Budaya & Sejarah"; lat=-8.8291; lon=115.0849; dayaTarik=96; aksesibilitas=91; fasilitas=92; rating=4.7; hargaTiket=35000; jarakBandara=21.5; deskripsi="Pura sakral di atas tebing karang curam setinggi 70 meter menghadap Samudra Hindia dengan pertunjukan Tari Kecak saat senja." },
  @{ id="W05"; nama="Pantai Kuta"; kabupaten="Kabupaten Badung"; kategori="Pantai"; lat=-8.7185; lon=115.1686; dayaTarik=88; aksesibilitas=98; fasilitas=96; rating=4.5; hargaTiket=15000; jarakBandara=4.8; deskripsi="Destinasi pantai ikonik Bali dengan pasir putih luas, ombak ideal untuk peselancar pemula, dan fasilitas pariwisata lengkap." },
  @{ id="W06"; nama="Garuda Wisnu Kencana (GWK)"; kabupaten="Kabupaten Badung"; kategori="Budaya & Sejarah"; lat=-8.8104; lon=115.1676; dayaTarik=93; aksesibilitas=94; fasilitas=96; rating=4.6; hargaTiket=85000; jarakBandara=11.2; deskripsi="Taman budaya berskala internasional dengan patung raksasa Garuda Wisnu Kencana setinggi 121 meter dan panggung seni." },

  @{ id="W07"; nama="Terasering Tegalalang"; kabupaten="Kabupaten Gianyar"; kategori="Alam & Pegunungan"; lat=-8.4312; lon=115.2793; dayaTarik=94; aksesibilitas=85; fasilitas=87; rating=4.5; hargaTiket=25000; jarakBandara=46.5; deskripsi="Lanskap sawah berundak sistem subak tradisional khas Ubud dengan panorama lembah hijau dan spot foto ikonik." },
  @{ id="W08"; nama="Sacred Monkey Forest Ubud"; kabupaten="Kabupaten Gianyar"; kategori="Ekowisata"; lat=-8.5194; lon=115.2606; dayaTarik=91; aksesibilitas=89; fasilitas=91; rating=4.5; hargaTiket=60000; jarakBandara=36.2; deskripsi="Cagar alam hutan suci Mandala Suci Wenara Wana di jantung Ubud yang dihuni ratusan kera ekor panjang dan pura kuno." },
  @{ id="W09"; nama="Pura Tirta Empul"; kabupaten="Kabupaten Gianyar"; kategori="Budaya & Sejarah"; lat=-8.4157; lon=115.3154; dayaTarik=92; aksesibilitas=84; fasilitas=86; rating=4.6; hargaTiket=40000; jarakBandara=50.8; deskripsi="Pura sumber mata air suci di Tampaksiring yang dikenal dengan tradisi melukat dan arsitektur Bali klasik." },

  @{ id="W10"; nama="Pura Tanah Lot"; kabupaten="Kabupaten Tabanan"; kategori="Budaya & Sejarah"; lat=-8.6212; lon=115.0868; dayaTarik=97; aksesibilitas=92; fasilitas=93; rating=4.6; hargaTiket=30000; jarakBandara=28.5; deskripsi="Pura laut ikonik di atas batu karang lepas pantai yang menawarkan pemandangan matahari terbenam spektakuler." },
  @{ id="W11"; nama="Pura Ulun Danu Beratan"; kabupaten="Kabupaten Tabanan"; kategori="Alam & Pegunungan"; lat=-8.2752; lon=115.1668; dayaTarik=95; aksesibilitas=83; fasilitas=90; rating=4.6; hargaTiket=35000; jarakBandara=62.4; deskripsi="Pura terapung di tepi Danau Beratan dataran tinggi Bedugul dengan udara sejuk dan latar pegunungan berkabut." },
  @{ id="W12"; nama="Sawah Terasering Jatiluwih"; kabupaten="Kabupaten Tabanan"; kategori="Ekowisata"; lat=-8.3688; lon=115.1322; dayaTarik=92; aksesibilitas=72; fasilitas=76; rating=4.7; hargaTiket=35000; jarakBandara=54.0; deskripsi="Warisan Budaya Dunia UNESCO dengan hamparan sawah subak terluas di Bali di kaki Gunung Batukaru." },

  @{ id="W13"; nama="Pantai Kelingking (Nusa Penida)"; kabupaten="Kabupaten Klungkung"; kategori="Pantai"; lat=-8.7513; lon=115.4743; dayaTarik=98; aksesibilitas=60; fasilitas=70; rating=4.7; hargaTiket=35000; jarakBandara=52.0; deskripsi="Tebing pesisir berbentuk T-Rex yang mendunia dengan air laut biru jernih di Pulau Nusa Penida." },
  @{ id="W14"; nama="Kertha Gosa (Taman Gili)"; kabupaten="Kabupaten Klungkung"; kategori="Budaya & Sejarah"; lat=-8.5356; lon=115.4033; dayaTarik=75; aksesibilitas=86; fasilitas=78; rating=4.4; hargaTiket=25000; jarakBandara=42.5; deskripsi="Situs peninggalan Kerajaan Klungkung dengan lukisan wayang Kamasan di langit-langit bale dan kolam bersejarah." },
  @{ id="W15"; nama="Pantai Diamond (Nusa Penida)"; kabupaten="Kabupaten Klungkung"; kategori="Pantai"; lat=-8.7764; lon=115.6203; dayaTarik=95; aksesibilitas=56; fasilitas=66; rating=4.7; hargaTiket=40000; jarakBandara=64.0; deskripsi="Pantai pasir putih eksotis di balik tebing batu kapur timur Nusa Penida dengan tangga pahatan tebing yang dramatis." },

  @{ id="W16"; nama="Pura Agung Besakih"; kabupaten="Kabupaten Karangasem"; kategori="Budaya & Sejarah"; lat=-8.3743; lon=115.4509; dayaTarik=95; aksesibilitas=77; fasilitas=85; rating=4.6; hargaTiket=50000; jarakBandara=66.5; deskripsi="Kompleks pura terbesar dan tersuci di Bali di lereng barat daya Gunung Agung dengan puluhan pura berundak." },
  @{ id="W17"; nama="Taman Tirta Gangga"; kabupaten="Kabupaten Karangasem"; kategori="Budaya & Sejarah"; lat=-8.4123; lon=115.5873; dayaTarik=88; aksesibilitas=74; fasilitas=82; rating=4.6; hargaTiket=45000; jarakBandara=78.2; deskripsi="Istana air peninggalan Kerajaan Karangasem dengan kolam ikan koi, batu pijakan ikonik, dan taman bertingkat." },
  @{ id="W18"; nama="Pantai Amed"; kabupaten="Kabupaten Karangasem"; kategori="Bahari & Snorkeling"; lat=-8.3347; lon=115.6476; dayaTarik=86; aksesibilitas=68; fasilitas=76; rating=4.5; hargaTiket=20000; jarakBandara=95.0; deskripsi="Kawasan wisata bahari tenang di timur Bali yang tersohor akan terumbu karang, snorkeling, dan panorama Gunung Agung." },

  @{ id="W19"; nama="Desa Adat Penglipuran"; kabupaten="Kabupaten Bangli"; kategori="Budaya & Sejarah"; lat=-8.4220; lon=115.3596; dayaTarik=94; aksesibilitas=84; fasilitas=89; rating=4.8; hargaTiket=25000; jarakBandara=52.5; deskripsi="Salah satu desa terbersih di dunia dengan tata ruang tradisional Tri Mandala, arsitektur seragam, dan hutan bambu." },
  @{ id="W20"; nama="Gunung & Danau Batur (Kintamani)"; kabupaten="Kabupaten Bangli"; kategori="Alam & Pegunungan"; lat=-8.2825; lon=115.3676; dayaTarik=95; aksesibilitas=80; fasilitas=85; rating=4.7; hargaTiket=35000; jarakBandara=68.0; deskripsi="Kawasan geopark UNESCO dengan kaldera gunung berapi aktif, danau kawah luas, serta spot trekking matahari terbit." },
  @{ id="W21"; nama="Air Terjun Tukad Cepung"; kabupaten="Kabupaten Bangli"; kategori="Alam & Pegunungan"; lat=-8.4410; lon=115.3869; dayaTarik=84; aksesibilitas=66; fasilitas=68; rating=4.5; hargaTiket=25000; jarakBandara=53.8; deskripsi="Air terjun unik tersembunyi di dalam celah tebing gua yang memantulkan berkas cahaya matahari dramatis." },

  @{ id="W22"; nama="Pantai Lovina"; kabupaten="Kabupaten Buleleng"; kategori="Bahari & Snorkeling"; lat=-8.1578; lon=115.0253; dayaTarik=84; aksesibilitas=72; fasilitas=80; rating=4.4; hargaTiket=20000; jarakBandara=89.5; deskripsi="Pantai berpasir hitam vulkanik di Bali utara yang terkenal dengan atraksi lumba-lumba liar di perairan tenang pagi hari." },
  @{ id="W23"; nama="Air Terjun Sekumpul"; kabupaten="Kabupaten Buleleng"; kategori="Alam & Pegunungan"; lat=-8.1725; lon=115.1869; dayaTarik=92; aksesibilitas=60; fasilitas=67; rating=4.7; hargaTiket=30000; jarakBandara=81.0; deskripsi="Gugusan tujuh air terjun megah di tengah lembah hijau Buleleng yang kerap disebut air terjun terindah di Bali." },
  @{ id="W24"; nama="Pulau Menjangan (TNBB)"; kabupaten="Kabupaten Buleleng"; kategori="Bahari & Snorkeling"; lat=-8.0978; lon=114.5142; dayaTarik=93; aksesibilitas=52; fasilitas=66; rating=4.8; hargaTiket=60000; jarakBandara=142.0; deskripsi="Pulau konservasi dalam Taman Nasional Bali Barat dengan dinding terumbu karang kelas dunia dan satwa rusa liar." },

  @{ id="W25"; nama="Pantai Medewi"; kabupaten="Kabupaten Jembrana"; kategori="Pantai"; lat=-8.4197; lon=114.8058; dayaTarik=76; aksesibilitas=70; fasilitas=70; rating=4.4; hargaTiket=15000; jarakBandara=74.5; deskripsi="Pantai berbatu di pesisir barat Bali yang memiliki salah satu ombak kiri terpanjang untuk surfing dengan suasana asri." },
  @{ id="W26"; nama="Pantai Baluk Rening"; kabupaten="Kabupaten Jembrana"; kategori="Pantai"; lat=-8.3746; lon=114.5761; dayaTarik=62; aksesibilitas=64; fasilitas=58; rating=4.2; hargaTiket=15000; jarakBandara=105.0; deskripsi="Pantai landai tenang di Jembrana yang populer sebagai wisata keluarga, terapi pasir laut, dan panorama Selat Bali." },
  @{ id="W27"; nama="Bunut Bolong"; kabupaten="Kabupaten Jembrana"; kategori="Alam & Pegunungan"; lat=-8.3596; lon=114.8286; dayaTarik=66; aksesibilitas=58; fasilitas=55; rating=4.3; hargaTiket=15000; jarakBandara=84.0; deskripsi="Pohon beringin raksasa berusia ratusan tahun yang akarnya membentuk terowongan jalan raya di perbukitan Pekutatan." }
)

# TOPSIS calculation
$divisors = @()
for ($j = 0; $j -lt $n; $j++) {
  $key = $criteria[$j].key
  $sumSq = 0.0
  foreach ($d in $destinations) {
    $v = [double]$d[$key]
    $sumSq += ($v * $v)
  }
  $divisors += [Math]::Sqrt($sumSq)
}

$Y = @()
foreach ($d in $destinations) {
  $row = @()
  for ($j = 0; $j -lt $n; $j++) {
    $v = [double]$d[$criteria[$j].key]
    $row += ($v / $divisors[$j]) * $weights[$j]
  }
  $Y += ,$row
}

$idealPos = @()
$idealNeg = @()
for ($j = 0; $j -lt $n; $j++) {
  $col = @()
  for ($i = 0; $i -lt $destinations.Count; $i++) { $col += $Y[$i][$j] }
  $maxV = ($col | Measure-Object -Maximum).Maximum
  $minV = ($col | Measure-Object -Minimum).Minimum
  if ($criteria[$j].type -eq "benefit") {
    $idealPos += $maxV
    $idealNeg += $minV
  } else {
    $idealPos += $minV
    $idealNeg += $maxV
  }
}

function Get-PotentialClass([double]$score) {
  if ($score -ge 0.72) { return "Sangat Potensial" }
  elseif ($score -ge 0.58) { return "Potensial" }
  elseif ($score -ge 0.44) { return "Cukup Potensial" }
  else { return "Kurang Potensial" }
}

$results = @()
for ($i = 0; $i -lt $destinations.Count; $i++) {
  $sumP = 0.0; $sumM = 0.0
  for ($j = 0; $j -lt $n; $j++) {
    $dp = $Y[$i][$j] - $idealPos[$j]
    $dm = $Y[$i][$j] - $idealNeg[$j]
    $sumP += ($dp * $dp)
    $sumM += ($dm * $dm)
  }
  $dPlus = [Math]::Sqrt($sumP)
  $dMinus = [Math]::Sqrt($sumM)
  $score = $dMinus / ($dPlus + $dMinus)
  $d = $destinations[$i]
  $results += [PSCustomObject]@{
    ID         = $d.id
    Nama       = $d.nama
    Kabupaten  = $d.kabupaten
    Kategori   = $d.kategori
    Latitude   = [Math]::Round([double]$d.lat, 6)
    Longitude  = [Math]::Round([double]$d.lon, 6)
    DayaTarik  = [int]$d.dayaTarik
    Akses      = [int]$d.aksesibilitas
    Fasilitas  = [int]$d.fasilitas
    Rating     = [Math]::Round([double]$d.rating, 1)
    HargaTiket = [int]$d.hargaTiket
    JarakBdr   = [Math]::Round([double]$d.jarakBandara, 1)
    D_Plus     = [Math]::Round($dPlus, 6)
    D_Minus    = [Math]::Round($dMinus, 6)
    SkorTOPSIS = [Math]::Round($score, 6)
    Rank       = 0
    KelasPot   = (Get-PotentialClass $score)
    Deskripsi  = $d.deskripsi
  }
}

$ranked = $results | Sort-Object -Property SkorTOPSIS -Descending
for ($k = 0; $k -lt $ranked.Count; $k++) {
  $ranked[$k].Rank = $k + 1
}

# 1. Write bali_wisata_arcgis.csv (UTF-8 without quotes clutter, ArcGIS safe headers)
$csvLines = @("ID,Nama,Kabupaten,Kategori,Latitude,Longitude,DayaTarik,Akses,Fasilitas,Rating,HargaTiket,JarakBdr,D_Plus,D_Minus,SkorTOPSIS,Rank,KelasPot")
foreach ($r in $ranked) {
  $ic = [System.Globalization.CultureInfo]::InvariantCulture
  $line = @(
    $r.ID,
    $r.Nama,
    $r.Kabupaten,
    $r.Kategori,
    $r.Latitude.ToString("F6", $ic),
    $r.Longitude.ToString("F6", $ic),
    $r.DayaTarik,
    $r.Akses,
    $r.Fasilitas,
    $r.Rating.ToString("F1", $ic),
    $r.HargaTiket,
    $r.JarakBdr.ToString("F1", $ic),
    $r.D_Plus.ToString("F6", $ic),
    $r.D_Minus.ToString("F6", $ic),
    $r.SkorTOPSIS.ToString("F6", $ic),
    $r.Rank,
    $r.KelasPot
  ) -join ","
  $csvLines += $line
}
[System.IO.File]::WriteAllLines((Join-Path $outDir "bali_wisata_arcgis.csv"), $csvLines, (New-Object System.Text.UTF8Encoding $false))

# 2. Write bali_wisata_arcgis.geojson (RFC 7946 WGS84)
$features = @()
foreach ($r in $ranked) {
  $features += [ordered]@{
    type = "Feature"
    geometry = [ordered]@{
      type = "Point"
      coordinates = @($r.Longitude, $r.Latitude)
    }
    properties = [ordered]@{
      ID         = $r.ID
      Nama       = $r.Nama
      Kabupaten  = $r.Kabupaten
      Kategori   = $r.Kategori
      Latitude   = $r.Latitude
      Longitude  = $r.Longitude
      DayaTarik  = $r.DayaTarik
      Akses      = $r.Akses
      Fasilitas  = $r.Fasilitas
      Rating     = $r.Rating
      HargaTiket = $r.HargaTiket
      JarakBdr   = $r.JarakBdr
      D_Plus     = $r.D_Plus
      D_Minus    = $r.D_Minus
      SkorTOPSIS = $r.SkorTOPSIS
      Rank       = $r.Rank
      KelasPot   = $r.KelasPot
      Deskripsi  = $r.Deskripsi
    }
  }
}

$weightDict = [ordered]@{}
for ($j = 0; $j -lt $n; $j++) {
  $weightDict[$criteria[$j].code] = [Math]::Round($weights[$j], 6)
}

$geojsonObj = [ordered]@{
  type = "FeatureCollection"
  name = "bali_wisata_ahp_topsis"
  crs = [ordered]@{
    type = "name"
    properties = [ordered]@{
      name = "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  }
  metadata = [ordered]@{
    method = "AHP-TOPSIS"
    lambdaMax = [Math]::Round($lambdaMax, 6)
    consistencyIndex = [Math]::Round($ci, 6)
    randomIndex = $ri
    consistencyRatio = [Math]::Round($cr, 6)
    isConsistent = ($cr -le 0.1)
    weights = $weightDict
  }
  features = $features
}
$geojsonStr = $geojsonObj | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText((Join-Path $outDir "bali_wisata_arcgis.geojson"), $geojsonStr, (New-Object System.Text.UTF8Encoding $false))

# 3. Write bali_ahp_weights.csv
$ic = [System.Globalization.CultureInfo]::InvariantCulture
$ahpLines = @("Kode,Kriteria,Tipe,Satuan,Bobot_AHP,Persentase,LambdaMax,CI,RI,CR,Status")
for ($j = 0; $j -lt $n; $j++) {
  $c = $criteria[$j]
  $ahpLines += @(
    $c.code,
    $c.label,
    $c.type,
    $c.unit,
    $weights[$j].ToString("F6", $ic),
    ($weights[$j] * 100).ToString("F2", $ic),
    $lambdaMax.ToString("F6", $ic),
    $ci.ToString("F6", $ic),
    $ri.ToString("F2", $ic),
    $cr.ToString("F6", $ic),
    $(if ($cr -le 0.1) { "KONSISTEN" } else { "TIDAK KONSISTEN" })
  ) -join ","
}
[System.IO.File]::WriteAllLines((Join-Path $outDir "bali_ahp_weights.csv"), $ahpLines, (New-Object System.Text.UTF8Encoding $false))

# 4. Write bali_rekap_kabupaten.csv (for Choropleth Table Join in ArcGIS)
$regGroups = $ranked | Group-Object -Property Kabupaten
$regSummary = @()
foreach ($g in $regGroups) {
  $avgScore = ($g.Group | Measure-Object -Property SkorTOPSIS -Average).Average
  $maxScore = ($g.Group | Measure-Object -Property SkorTOPSIS -Maximum).Maximum
  $topItem = ($g.Group | Sort-Object -Property SkorTOPSIS -Descending)[0]
  $regSummary += [PSCustomObject]@{
    Kabupaten   = $g.Name
    JmlWisata   = $g.Count
    RataTOPSIS  = [Math]::Round($avgScore, 6)
    SkorMaks    = [Math]::Round($maxScore, 6)
    WisataTop   = $topItem.Nama
    KelasWil    = (Get-PotentialClass $avgScore)
  }
}
$regSummary = $regSummary | Sort-Object -Property RataTOPSIS -Descending
$regLines = @("RankWil,Kabupaten,JmlWisata,RataTOPSIS,SkorMaks,WisataTop,KelasWil")
for ($k = 0; $k -lt $regSummary.Count; $k++) {
  $r = $regSummary[$k]
  $regLines += @(
    ($k + 1),
    $r.Kabupaten,
    $r.JmlWisata,
    $r.RataTOPSIS.ToString("F6", $ic),
    $r.SkorMaks.ToString("F6", $ic),
    $r.WisataTop,
    $r.KelasWil
  ) -join ","
}
[System.IO.File]::WriteAllLines((Join-Path $outDir "bali_rekap_kabupaten.csv"), $regLines, (New-Object System.Text.UTF8Encoding $false))

Write-Output ("AHP LambdaMax={0:F6} CI={1:F6} CR={2:F6} Consistent={3}" -f $lambdaMax, $ci, $cr, ($cr -le 0.1))
Write-Output "Top 5 Destinations:"
$ranked | Select-Object -First 5 Rank, ID, Nama, Kabupaten, SkorTOPSIS, KelasPot | Format-Table -AutoSize
Write-Output "Class Distribution:"
$ranked | Group-Object KelasPot | Select-Object Name, Count | Format-Table -AutoSize
