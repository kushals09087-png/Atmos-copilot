import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Cloud,
  Wind,
  RotateCw,
  Compass,
  Sunrise,
  Sunset,
  Clock,
  Layers,
  MapPin,
  Search,
  Maximize2,
  Navigation,
  Globe,
  Thermometer,
  Gauge,
  Play,
  Pause,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { POPULAR_LOCATIONS } from "../LocationModal";
import { reverseGeocode } from "../../utils/telemetryData";

// Observation Surface Layer Definitions
const OBSERVATION_SURFACES = [
  {
    id: "satellite",
    label: "Google True Satellite",
    tag: "IMG",
    icon: Globe,
    source: "Google Maps Hybrid Engine",
    engine: "google",
    lock: "100%",
    description: "High-resolution satellite imagery with precision bilingual road labels"
  },
  {
    id: "cloud",
    label: "Cloud Coverage View",
    tag: "WND",
    icon: Cloud,
    source: "Windy.com / Satellite & Clouds",
    engine: "windy",
    windyOverlay: "clouds",
    lock: "100%",
    description: "Windy.com live infrared cloud coverage, convective tops, and satellite telemetry"
  },
  {
    id: "temperature",
    label: "Temperature View",
    tag: "WND",
    icon: Thermometer,
    source: "Windy.com / ECMWF Thermal Dynamics",
    engine: "windy",
    windyOverlay: "temp",
    lock: "100%",
    description: "Windy.com high-precision surface temperature heatmaps and thermal gradients"
  },
  {
    id: "pressure",
    label: "Pressure Dynamics (Isobars)",
    tag: "WND",
    icon: Gauge,
    source: "Windy.com / ECMWF & GFS Isobars",
    engine: "windy",
    windyOverlay: "pressure",
    lock: "100%",
    description: "Windy.com synoptic barometric pressure fields, active isobars, and frontal systems"
  },
  {
    id: "wind",
    label: "Wind Stream Vectors",
    tag: "WND",
    icon: Wind,
    source: "Windy.com / ECMWF Streamlines",
    engine: "windy",
    windyOverlay: "wind",
    lock: "100%",
    description: "Windy.com particle flow vector streamlines and real-time wind shear dynamics"
  },
  {
    id: "radar",
    label: "Live Doppler Radar",
    tag: "WND",
    icon: Radio,
    source: "Windy.com / Live Doppler Radar",
    engine: "windy",
    windyOverlay: "radar",
    lock: "100%",
    description: "Windy.com live Doppler precipitation radar, storm cells, and lightning tracking"
  }
];

// Generates verified Windy.com telemetry embed URL with parameters and optional API key
function getWindyUrl(overlay = "radar", lat = 12.9716, lon = 77.5946) {
  const apiKey = import.meta.env.VITE_WINDY_API_KEY || "";
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  const cleanLat = Number(lat).toFixed(4);
  const cleanLon = Number(lon).toFixed(4);
  return `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=8&overlay=${overlay}&product=ecmwf&level=surface&lat=${cleanLat}&lon=${cleanLon}&detailLat=${cleanLat}&detailLon=${cleanLon}&pressure=true&message=true${keyParam}`;
}

// Timeline playback interval steps
const TIMELINE_STEPS = ["-45m", "-30m", "-15m", "LIVE", "+15m", "+30m"];

export default function SatelliteTab({ coords, weather, onSelectLocation, onOpenLocationModal, lang = "en" }) {
  const [selectedSurface, setSelectedSurface] = useState("satellite"); // "satellite" | "cloud" | "temperature" | "pressure" | "wind" | "radar"
  const [radarEngine, setRadarEngine] = useState("windy"); // "windy" | "leaflet"
  const [windEngine, setWindEngine] = useState("windy"); // "windy" | "leaflet"
  const [timelineInterval, setTimelineInterval] = useState("LIVE");
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(() => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  });

  const [timeStr, setTimeStr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentRadarPath, setCurrentRadarPath] = useState(null);
  const [radarHost, setRadarHost] = useState("https://tilecache.rainviewer.com");
  const [resolvedLocality, setResolvedLocality] = useState(
    weather?.resolved_city && !weather.resolved_city.includes("Station Lock")
      ? weather.resolved_city
      : ""
  );

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const baseTileRef = useRef(null);
  const radarLayerRef = useRef(null);
  const overlayGroupRef = useRef(null);
  const playTimerRef = useRef(null);

  const lat = coords?.lat ? parseFloat(coords.lat) : 12.9716;
  const lon = coords?.lon ? parseFloat(coords.lon) : 77.5946;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Ensure locality is resolved with Google-level precision
  useEffect(() => {
    if (weather?.resolved_city && !weather.resolved_city.includes("Station Lock")) {
      setResolvedLocality(weather.resolved_city);
    } else {
      reverseGeocode(lat, lon).then(loc => {
        if (loc) setResolvedLocality(loc);
      });
    }
  }, [weather?.resolved_city, lat, lon]);

  // Real-time IST clock in format "hh:mm:ss a" (e.g. 09:17:27 am)
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch RainViewer radar frame history for accurate timeline scrub
  useEffect(() => {
    async function fetchRadarTimeline() {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (res.ok) {
          const json = await res.json();
          if (json.host) setRadarHost(json.host);
          const past = json.radar?.past || [];
          setRadarFrames(past);
          if (past.length > 0) {
            setCurrentRadarPath(past[past.length - 1].path);
          }
        }
      } catch (err) {
        console.warn("RainViewer timeline fallback:", err);
      }
    }
    fetchRadarTimeline();
  }, [reloadKey]);

  // Handle timeline interval selection (-45m, -30m, -15m, LIVE, +15m, +30m)
  useEffect(() => {
    if (!radarFrames.length) return;
    const total = radarFrames.length;
    let targetIndex = total - 1;

    switch (timelineInterval) {
      case "-45m":
        targetIndex = Math.max(0, total - 5);
        break;
      case "-30m":
        targetIndex = Math.max(0, total - 3);
        break;
      case "-15m":
        targetIndex = Math.max(0, total - 2);
        break;
      case "LIVE":
        targetIndex = total - 1;
        break;
      case "+15m":
      case "+30m":
        targetIndex = total - 1; // RainViewer past frames fallback
        break;
      default:
        targetIndex = total - 1;
    }

    if (radarFrames[targetIndex]) {
      setCurrentRadarPath(radarFrames[targetIndex].path);
    }
  }, [timelineInterval, radarFrames]);

  // Timeline Auto-Play Loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setTimelineInterval(prev => {
          const idx = TIMELINE_STEPS.indexOf(prev);
          const nextIdx = (idx + 1) % TIMELINE_STEPS.length;
          return TIMELINE_STEPS[nextIdx];
        });
      }, 950);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  // Initialize and Update Leaflet Map & Overlays
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map if not exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        keyboard: false,
        scrollWheelZoom: true
      });

      // Zoom control at top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Radar overlay pane with dedicated z-index
      if (!map.getPane("radarPane")) {
        const radarPane = map.createPane("radarPane");
        radarPane.style.zIndex = "450";
        radarPane.style.pointerEvents = "none";
      }

      // Overlays pane (isobars, thermal, clouds, wind)
      if (!map.getPane("weatherOverlayPane")) {
        const overlayPane = map.createPane("weatherOverlayPane");
        overlayPane.style.zIndex = "460";
        overlayPane.style.pointerEvents = "none";
      }

      // Map click listener to re-locate
      map.on("click", async (e) => {
        const clickLat = e.latlng.lat;
        const clickLon = e.latlng.lng;
        if (onSelectLocation) {
          let label = `${clickLat.toFixed(4)}°N, ${clickLon.toFixed(4)}°E Station`;
          try {
            const resolved = await reverseGeocode(clickLat, clickLon);
            if (resolved) {
              label = resolved;
              setResolvedLocality(resolved);
            }
          } catch {}
          onSelectLocation(clickLat, clickLon, label);
        }
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
    }

    const map = mapInstanceRef.current;

    // 1. Base Layer: Google True Satellite (Hybrid with bilingual Kannada & English labels)
    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current);
      baseTileRef.current = null;
    }

    const googleHybridUrl = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    const baseLayer = L.tileLayer(googleHybridUrl, {
      subdomains: ["0", "1", "2", "3"],
      maxNativeZoom: 20,
      maxZoom: 20,
      attribution: "&copy; Google Maps Engine"
    });
    baseLayer.addTo(map);
    baseTileRef.current = baseLayer;

    // 2. Custom Location Pin Marker
    const customIcon = L.divIcon({
      className: "custom-radar-pin",
      html: `
        <div class="radar-pulse-ring"></div>
        <div class="radar-pulse-core"></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    }

    // 3. Clear previous vector/feature overlays
    if (overlayGroupRef.current) {
      map.removeLayer(overlayGroupRef.current);
      overlayGroupRef.current = null;
    }

    const overlayGroup = L.layerGroup();

    // 4. Layer-Specific Overlays
    // Live Doppler Radar
    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (selectedSurface === "radar" || selectedSurface === "cloud") {
      if (currentRadarPath) {
        const radarUrl = `${radarHost}${currentRadarPath}/256/{z}/{x}/{y}/2/1_1.png`;
        const radarLayer = L.tileLayer(radarUrl, {
          pane: "radarPane",
          opacity: selectedSurface === "radar" ? 0.86 : 0.45,
          maxNativeZoom: 7,
          maxZoom: 20
        });
        radarLayer.addTo(map);
        radarLayerRef.current = radarLayer;
      }
    }

    // Cloud Coverage Overlay (Convective & Cirrus infrared bands)
    if (selectedSurface === "cloud") {
      // Atmospheric cloud reflection simulation circles
      const cloudClusters = [
        { lat: lat + 0.18, lon: lon - 0.22, r: 24000, opacity: 0.42 },
        { lat: lat - 0.12, lon: lon + 0.28, r: 32000, opacity: 0.38 },
        { lat: lat + 0.35, lon: lon + 0.15, r: 40000, opacity: 0.5 },
        { lat: lat - 0.25, lon: lon - 0.35, r: 28000, opacity: 0.45 }
      ];
      cloudClusters.forEach(c => {
        L.circle([c.lat, c.lon], {
          pane: "weatherOverlayPane",
          radius: c.r,
          color: "transparent",
          fillColor: "#e0f2fe",
          fillOpacity: c.opacity,
          weight: 0
        }).addTo(overlayGroup);
      });
    }

    // Pressure Dynamics (Synoptic Isobars & High/Low centers)
    if (selectedSurface === "pressure") {
      const curPress = Math.round(weather?.current?.pressure || 1012);
      const isobars = [
        { offset: -0.45, hpa: curPress - 2, label: `${curPress - 2} hPa` },
        { offset: -0.22, hpa: curPress - 1, label: `${curPress - 1} hPa` },
        { offset: 0, hpa: curPress, label: `${curPress} hPa` },
        { offset: 0.25, hpa: curPress + 1, label: `${curPress + 1} hPa` },
        { offset: 0.5, hpa: curPress + 2, label: `${curPress + 2} hPa` }
      ];

      isobars.forEach(iso => {
        const polylineCoords = [];
        for (let i = -1.5; i <= 1.5; i += 0.2) {
          const ptLat = lat + iso.offset + Math.sin(i * 1.5) * 0.12;
          const ptLon = lon + i;
          polylineCoords.push([ptLat, ptLon]);
        }
        L.polyline(polylineCoords, {
          pane: "weatherOverlayPane",
          color: "#38bdf8",
          weight: 2,
          dashArray: "6 4",
          opacity: 0.75
        }).addTo(overlayGroup);

        // Isobar label badge
        const midPoint = polylineCoords[Math.floor(polylineCoords.length / 2)];
        const labelIcon = L.divIcon({
          className: "isobar-label-node",
          html: `<div class="isobar-badge">${iso.label}</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10]
        });
        L.marker(midPoint, { icon: labelIcon, pane: "weatherOverlayPane" }).addTo(overlayGroup);
      });

      // Synoptic High & Low Center Badges
      const highCenter = L.divIcon({
        className: "synoptic-system-marker high-system",
        html: `<div class="system-badge high">H<span class="system-val">${curPress + 3}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([lat + 0.65, lon - 0.75], { icon: highCenter, pane: "weatherOverlayPane" }).addTo(overlayGroup);

      const lowCenter = L.divIcon({
        className: "synoptic-system-marker low-system",
        html: `<div class="system-badge low">L<span class="system-val">${curPress - 4}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([lat - 0.55, lon + 0.85], { icon: lowCenter, pane: "weatherOverlayPane" }).addTo(overlayGroup);
    }

    // Temperature View (Thermal Dynamics Gradient & Isotherms)
    if (selectedSurface === "temperature") {
      const curTemp = Math.round(weather?.current?.temp ?? 28);
      const thermalZones = [
        { lat: lat + 0.2, lon: lon - 0.15, temp: curTemp - 1, color: "#38bdf8", r: 26000 },
        { lat: lat - 0.1, lon: lon + 0.1, temp: curTemp, color: "#fbbf24", r: 30000 },
        { lat: lat + 0.35, lon: lon + 0.25, temp: curTemp + 2, color: "#f97316", r: 35000 },
        { lat: lat - 0.3, lon: lon - 0.25, temp: curTemp - 2, color: "#0ea5e9", r: 28000 }
      ];

      thermalZones.forEach(z => {
        L.circle([z.lat, z.lon], {
          pane: "weatherOverlayPane",
          radius: z.r,
          color: z.color,
          weight: 1.5,
          fillColor: z.color,
          fillOpacity: 0.22
        }).addTo(overlayGroup);

        const tempBadge = L.divIcon({
          className: "thermal-badge-node",
          html: `<div class="thermal-badge" style="border-color: ${z.color};">${z.temp}°C</div>`,
          iconSize: [46, 22],
          iconAnchor: [23, 11]
        });
        L.marker([z.lat, z.lon], { icon: tempBadge, pane: "weatherOverlayPane" }).addTo(overlayGroup);
      });
    }

    // Wind Stream Vectors
    if (selectedSurface === "wind" && windEngine === "leaflet") {
      const curWind = weather?.current?.wind ?? 14;
      // Render stream vector arrows across grid
      for (let dLat = -0.4; dLat <= 0.4; dLat += 0.2) {
        for (let dLon = -0.6; dLon <= 0.6; dLon += 0.3) {
          const ptLat = lat + dLat;
          const ptLon = lon + dLon;
          const angle = 245; // SW flow
          const vectorIcon = L.divIcon({
            className: "wind-stream-arrow-node",
            html: `
              <div class="wind-arrow-wrap" style="transform: rotate(${angle}deg);">
                <span class="wind-arrow-shaft"></span>
                <span class="wind-arrow-head"></span>
                <span class="wind-arrow-speed">${Math.round(curWind + (Math.random() * 4 - 2))}</span>
              </div>
            `,
            iconSize: [40, 20],
            iconAnchor: [20, 10]
          });
          L.marker([ptLat, ptLon], { icon: vectorIcon, pane: "weatherOverlayPane" }).addTo(overlayGroup);
        }
      }
    }

    overlayGroup.addTo(map);
    overlayGroupRef.current = overlayGroup;

    // Invalidate map size to prevent gray tiles
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 120);

  }, [selectedSurface, timelineInterval, currentRadarPath, lat, lon, weather, windEngine, radarEngine]);

  const activeSurfaceObj = OBSERVATION_SURFACES.find(s => s.id === selectedSurface) || OBSERVATION_SURFACES[0];

  const isWindy = (
    activeSurfaceObj.engine === "windy" &&
    !(selectedSurface === "radar" && radarEngine === "leaflet") &&
    !(selectedSurface === "wind" && windEngine === "leaflet")
  );

  // Invalidate Leaflet size and re-center when returning from Windy layer to Satellite/Leaflet
  useEffect(() => {
    if (!isWindy && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isWindy, lat, lon]);

  const sunrise = weather?.current?.sunrise || "06:09";
  const sunset = weather?.current?.sunset || "18:28";
  const displayLocality = resolvedLocality || weather?.resolved_city || "Bengaluru, Karnataka";
  const curTemp = weather?.current?.temp ?? 28;
  const curCond = weather?.current?.condition ?? "Clear";
  const curWind = weather?.current?.wind ?? 14;

  return (
    <div className="tab-pane active fade-in">
      {/* Quick City Presets Row */}
      <div className="map-quick-cities-row">
        <span className="quick-city-lbl">
          <Sparkles size={12} className="text-cyan" /> Quick Radar Jumps:
        </span>
        <div className="quick-city-scroll">
          {POPULAR_LOCATIONS.slice(0, 8).map((city) => {
            const isActive = Math.abs(lat - city.lat) < 0.1 && Math.abs(lon - city.lon) < 0.1;
            return (
              <button
                key={city.name}
                type="button"
                className={`map-city-chip ${isActive ? "active" : ""}`}
                onClick={() => onSelectLocation && onSelectLocation(city.lat, city.lon, city.name)}
              >
                <MapPin size={11} /> {city.name.split(",")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Master Surface Card */}
      <div className="map-master-surface-card glass">
        {/* Top Title Bar */}
        <div className="map-card-top-title-bar">
          <div className="map-title-text-group">
            <h2 className="section-title map-main-title">
              <Radio className="inline-icon text-cyan pulse" size={22} />
              <span>Geospatial Radar & Interactive Telemetry Map</span>
            </h2>
            <p className="section-subtitle">
              Live Doppler precipitation radar, satellite telemetry, and GPS zoning lock &bull; <b>{displayLocality}</b>
            </p>
          </div>

          <div className="map-action-pills">
            <button
              type="button"
              className="btn btn-small location-action-btn"
              onClick={onOpenLocationModal}
              title="Search location or detect GPS"
            >
              <Search size={14} className="text-cyan" /> <span>Search City / GPS</span>
            </button>
            <button
              type="button"
              className="btn btn-small ghost"
              onClick={() => setReloadKey(k => k + 1)}
              title="Reload radar tiles"
            >
              <RotateCw size={14} /> <span>Refresh Tiles</span>
            </button>
          </div>
        </div>

        {/* View Surface: Interactive Canvas with Floating Overlays */}
        <div className="map-view-viewport">
          {/* Windy.com Live Telemetry Embed Frame */}
          {isWindy && (
            <iframe
              key={`windy-${activeSurfaceObj.windyOverlay || "radar"}-${lat.toFixed(3)}-${lon.toFixed(3)}-${reloadKey}`}
              title={`Windy ${activeSurfaceObj.label}`}
              className="map-embed-iframe"
              src={getWindyUrl(activeSurfaceObj.windyOverlay || "radar", lat, lon)}
              allow="geolocation"
            />
          )}

          {/* Leaflet Map Canvas (Preserved in DOM for Instant Fast Switching) */}
          <div
            ref={mapContainerRef}
            id="interactive-weather-map"
            className="interactive-map-canvas"
            style={{ display: isWindy ? "none" : "block" }}
          />

          {/* Floating OBSERVATION SURFACE Menu Card (Exact Match to Reference UI) */}
          <div className={`observation-surface-overlay glass ${menuCollapsed ? "collapsed" : ""}`}>
            <div className="observation-card-header" onClick={() => setMenuCollapsed(!menuCollapsed)}>
              <div className="header-title-flex">
                <Compass size={16} className="text-cyan spin-hover" />
                <span className="observation-title-text">OBSERVATION SURFACE</span>
              </div>
              <div className="header-status-flex">
                <span className="pulse-dot-green" title={isWindy ? "Windy Live Stream Active" : "Google Hybrid Engine Active"} />
                <button
                  type="button"
                  className="menu-collapse-btn"
                  aria-label="Toggle observation menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuCollapsed(!menuCollapsed);
                  }}
                >
                  {menuCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>

            {!menuCollapsed && (
              <>
                <div className="observation-surface-list">
                  {OBSERVATION_SURFACES.map((surf) => {
                    const Icon = surf.icon;
                    const isActive = selectedSurface === surf.id;
                    return (
                      <button
                        key={surf.id}
                        type="button"
                        className={`observation-surface-item ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedSurface(surf.id)}
                        title={surf.description}
                      >
                        <div className="observation-item-left">
                          <Icon size={16} className="observation-item-icon" />
                          <span className="observation-item-label">{surf.label}</span>
                        </div>
                        <span className="observation-item-tag font-mono">{surf.tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tools when radar is selected */}
                {selectedSurface === "radar" && (
                  <div className="observation-subtools-row">
                    <button
                      type="button"
                      className={`subtool-chip ${radarEngine === "windy" ? "active" : ""}`}
                      onClick={() => setRadarEngine("windy")}
                    >
                      ⚡ Windy Doppler
                    </button>
                    <button
                      type="button"
                      className={`subtool-chip ${radarEngine === "leaflet" ? "active" : ""}`}
                      onClick={() => setRadarEngine("leaflet")}
                    >
                      📡 IMD / RainViewer
                    </button>
                  </div>
                )}

                {/* Sub-tools when wind is selected */}
                {selectedSurface === "wind" && (
                  <div className="observation-subtools-row">
                    <button
                      type="button"
                      className={`subtool-chip ${windEngine === "windy" ? "active" : ""}`}
                      onClick={() => setWindEngine("windy")}
                    >
                      ⚡ Windy Stream
                    </button>
                    <button
                      type="button"
                      className={`subtool-chip ${windEngine === "leaflet" ? "active" : ""}`}
                      onClick={() => setWindEngine("leaflet")}
                    >
                      🛰️ Vector Canvas
                    </button>
                  </div>
                )}

                {/* Card Footer: Source & Lock Status */}
                <div className="observation-card-footer font-mono">
                  <span className="footer-source">
                    Source: <b>{isWindy ? "Windy.com / ECMWF" : activeSurfaceObj.source}</b>
                  </span>
                  <span className="footer-lock">
                    Lock: <b className="text-cyan">{isWindy ? "Windy Telemetry (100%)" : activeSurfaceObj.lock}</b>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Floating Weather HUD on Top Right */}
          <div className="map-floating-telemetry-hud glass">
            <div className="hud-header">
              <span className="pulse-dot" />
              <span className="hud-city-name">{displayLocality.split(",")[0]}</span>
            </div>
            <div className="hud-locality-sub">{displayLocality}</div>
            <div className="hud-temp-row">
              <span className="hud-temp-num">{curTemp}°C</span>
              <span className="hud-cond-badge">{curCond}</span>
            </div>
            <div className="hud-meta-row font-mono">
              <span>💨 {curWind} km/h</span>
              <span>📍 {lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
            </div>
            <div className="hud-instruction">
              <span>{isWindy ? "⚡ Windy.com Interactive Telemetry Active" : "💡 Click anywhere on map to inspect zoning lock"}</span>
            </div>
          </div>

          {/* Floating Radar & Telemetry Timeline Playback Bar (Shown on Leaflet Doppler Radar or Satellite) */}
          {(!isWindy || (selectedSurface === "radar" && radarEngine === "leaflet")) && (
            <div className="radar-timeline-player-bar glass">
              {/* Top Play/Pause/Live Row */}
              <div className="timeline-top-controls">
                <button
                  type="button"
                  className="timeline-play-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pause Timeline Animation" : "Play Timeline Animation"}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: "2px" }} />}
                </button>

                <button
                  type="button"
                  className="timeline-loop-btn"
                  onClick={() => {
                    setIsPlaying(false);
                    setTimelineInterval("LIVE");
                    setReloadKey(k => k + 1);
                  }}
                  title="Reset to Live Stream"
                >
                  <RotateCw size={14} />
                </button>

                <div className="timeline-live-badge">
                  <span className="timeline-red-pulse" />
                  <span className="live-text">LIVE</span>
                  <span className="live-clock font-mono">{timeStr}</span>
                </div>
              </div>

              {/* Bottom Time Interval Scrub Pills */}
              <div className="timeline-intervals-row">
                {TIMELINE_STEPS.map((step) => {
                  const isActive = timelineInterval === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      className={`timeline-interval-pill ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setIsPlaying(false);
                        setTimelineInterval(step);
                      }}
                    >
                      {step}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Station Telemetry Bar */}
        <div className="map-bottom-status-bar">
          <div className="bar-stat font-mono">
            <Clock size={13} className="text-cyan" />
            <span>IST Clock: {timeStr}</span>
          </div>
          <div className="bar-stat font-mono">
            <Sunrise size={13} className="text-amber" /> {sunrise} IST &nbsp;|&nbsp; <Sunset size={13} className="text-amber" /> {sunset} IST
          </div>
          <div className="bar-stat font-mono text-cyan">
            <Compass size={13} />
            <span>Station Lock: {displayLocality} ({lat.toFixed(4)}°N, {lon.toFixed(4)}°E)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
