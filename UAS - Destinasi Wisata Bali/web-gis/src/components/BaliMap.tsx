"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { NGURAH_RAI_AIRPORT } from "@/data/baliDestinations";
import { getPotentialColor } from "@/lib/ahpTopsis";
import { TOPSISAlternativeResult } from "@/types/tourism";
import { Layers, Plane, LocateFixed } from "lucide-react";

type BasemapId = "osm" | "satellite" | "topo" | "light";

const BASEMAPS: Record<
  BasemapId,
  { label: string; url: string; attribution: string }
> = {
  osm: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
  topo: {
    label: "Esri Topographic",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  light: {
    label: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
};

const BALI_CENTER: [number, number] = [-8.42, 115.14];
const BALI_DEFAULT_ZOOM = 9;

interface BaliMapProps {
  items: TOPSISAlternativeResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function BaliMap({ items, selectedId, onSelect }: BaliMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const airportLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [basemap, setBasemap] = useState<BasemapId>("osm");
  const [showAirport, setShowAirport] = useState(true);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: BALI_CENTER,
      zoom: BALI_DEFAULT_ZOOM,
      zoomControl: true,
    });

    const initialTile = L.tileLayer(BASEMAPS.osm.url, {
      attribution: BASEMAPS.osm.attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = initialTile;
    markersLayerRef.current = L.layerGroup().addTo(map);
    airportLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      airportLayerRef.current = null;
    };
  }, []);

  // Switch basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = BASEMAPS[basemap];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 18,
    }).addTo(map);
  }, [basemap]);

  // Render destination markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    items.forEach((item) => {
      const d = item.destination;
      const color = getPotentialColor(item.potentialClass);
      const isSelected = d.id === selectedId;

      const icon = L.divIcon({
        className: "custom-rank-marker",
        html: `<div class="rank-pin ${isSelected ? "selected" : ""}" style="background:${color};">#${item.rank}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      });

      const popupHtml = `
        <div style="font-family:inherit;">
          <div style="background:${color};color:#fff;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:700;opacity:0.95;text-transform:uppercase;letter-spacing:0.04em;">Peringkat #${item.rank} • ${d.id}</span>
              <span style="font-size:11px;background:rgba(255,255,255,0.22);padding:2px 7px;border-radius:999px;font-weight:600;">${item.potentialClass}</span>
            </div>
            <div style="font-size:14px;font-weight:700;margin-top:4px;line-height:1.25;">${d.nama}</div>
            <div style="font-size:11px;opacity:0.9;margin-top:2px;">${d.kabupaten} • ${d.kategori}</div>
          </div>
          <div style="padding:10px 12px;background:#fff;color:#0f172a;font-size:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#475569;font-weight:500;">Skor TOPSIS (V<sub>i</sub>)</span>
              <span style="font-size:15px;font-weight:800;color:${color};">${item.preferenceScore.toFixed(4)}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:11px;color:#334155;">
              <div>Daya Tarik: <b>${d.dayaTarik}</b></div>
              <div>Akses: <b>${d.aksesibilitas}</b></div>
              <div>Fasilitas: <b>${d.fasilitas}</b></div>
              <div>Rating: <b>${d.rating.toFixed(1)}/5</b></div>
              <div>Tiket: <b>Rp ${d.hargaTiket.toLocaleString("id-ID")}</b></div>
              <div>Jarak Bdr: <b>${d.jarakBandara} km</b></div>
            </div>
            <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #e2e8f0;font-size:10px;color:#64748b;font-family:monospace;">
              WGS84: ${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([d.latitude, d.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100 - item.rank,
      });

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on("click", () => onSelect(d.id));
      marker.addTo(layer);
      markerMapRef.current.set(d.id, marker);
    });
  }, [items, selectedId, onSelect]);

  // Render Ngurah Rai Airport marker & distance line to selected destination
  useEffect(() => {
    const layer = airportLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!showAirport) return;

    const airportIcon = L.divIcon({
      className: "custom-rank-marker",
      html: `<div class="airport-pin" title="${NGURAH_RAI_AIRPORT.name}">✈</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const airportMarker = L.marker(
      [NGURAH_RAI_AIRPORT.latitude, NGURAH_RAI_AIRPORT.longitude],
      { icon: airportIcon, zIndexOffset: 500 }
    );
    airportMarker.bindPopup(
      `<div style="padding:10px 12px;font-size:12px;">
        <div style="font-weight:700;color:#0f172a;">${NGURAH_RAI_AIRPORT.name}</div>
        <div style="color:#64748b;font-size:11px;margin-top:2px;">Titik Referensi Kriteria Jarak (C6)</div>
        <div style="color:#64748b;font-size:10px;font-family:monospace;margin-top:4px;">${NGURAH_RAI_AIRPORT.latitude.toFixed(4)}, ${NGURAH_RAI_AIRPORT.longitude.toFixed(4)}</div>
      </div>`
    );
    airportMarker.addTo(layer);

    if (selectedId) {
      const selected = items.find((i) => i.destination.id === selectedId);
      if (selected) {
        L.polyline(
          [
            [NGURAH_RAI_AIRPORT.latitude, NGURAH_RAI_AIRPORT.longitude],
            [selected.destination.latitude, selected.destination.longitude],
          ],
          {
            color: "#0f172a",
            weight: 2,
            dashArray: "6, 6",
            opacity: 0.65,
          }
        )
          .bindTooltip(
            `Estimasi rute darat: ${selected.destination.jarakBandara} km`,
            { sticky: true }
          )
          .addTo(layer);
      }
    }
  }, [showAirport, selectedId, items]);

  // Smooth pan & open popup when selectedId changes
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const target = items.find((i) => i.destination.id === selectedId);
    if (!target) return;

    mapRef.current.flyTo(
      [target.destination.latitude, target.destination.longitude],
      Math.max(mapRef.current.getZoom(), 11),
      { duration: 0.6 }
    );
    const marker = markerMapRef.current.get(selectedId);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedId, items]);

  const handleResetView = () => {
    mapRef.current?.flyTo(BALI_CENTER, BALI_DEFAULT_ZOOM, { duration: 0.6 });
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[610px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top-right Map Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 p-1.5 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-500 ml-1" />
          {(Object.keys(BASEMAPS) as BasemapId[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBasemap(key)}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                basemap === key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {BASEMAPS[key].label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setShowAirport((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-md border transition ${
              showAirport
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            Ref. Bandara
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-md border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            Reset Bali
          </button>
        </div>
      </div>

      {/* Bottom-left Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 px-3 py-2.5 text-xs">
        <div className="font-semibold text-slate-800 mb-1.5">
          Legenda Potensi (TOPSIS V<sub>i</sub>)
        </div>
        <div className="space-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block ring-2 ring-white shadow-sm" />
            <span>Sangat Potensial (&ge; 0.72)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block ring-2 ring-white shadow-sm" />
            <span>Potensial (0.58 – 0.71)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 inline-block ring-2 ring-white shadow-sm" />
            <span>Cukup Potensial (0.44 – 0.57)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block ring-2 ring-white shadow-sm" />
            <span>Kurang Potensial (&lt; 0.44)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
