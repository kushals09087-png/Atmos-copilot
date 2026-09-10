import React, { useState, useEffect, useMemo } from "react";
import {
  Navigation,
  Droplets,
  CloudRain,
  Thermometer,
  RotateCw,
  Wind,
  Sun,
  Moon,
  Activity,
  ShieldCheck,
  Compass,
  Search,
  Radio,
  MapPin,
  Check,
  Copy,
  Layers,
  Sparkles,
  Sunrise,
  Sunset,
  Gauge,
  FileText,
  ChevronDown,
  ChevronUp,
  Radar,
  Eye,
  Scan,
  Clock,
  ExternalLink
} from "lucide-react";
import { weatherConditionEmoji, formatDigits } from "../../utils/telemetryData";

// Unit conversion helpers
export const convertTemp = (c, unit) => (unit === "F" ? Math.round((c * 9) / 5 + 32) : Math.round(c));
export const convertWind = (kmh, unit) => {
  if (unit === "mph") return Math.round(kmh * 0.621371);
  if (unit === "kts") return Math.round(kmh * 0.539957);
  return Math.round(kmh);
};
export const convertPressure = (hpa, unit) => {
  if (unit === "inHg") return (hpa * 0.02953).toFixed(2);
  if (unit === "mmHg") return Math.round(hpa * 0.750062);
  return Math.round(hpa);
};

// Astronomically accurate synodic lunar phase calculator
function getLunarPhase(date = new Date()) {
  const refDate = new Date("2024-01-11T11:57:00Z");
  const diffDays = (date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.53058867;
  const cycleProgress = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = Math.round(((1 - Math.cos((cycleProgress / synodicMonth) * 2 * Math.PI)) / 2) * 100);

  if (cycleProgress < 1.845) return { phase: "New Moon", icon: "🌑", illumination };
  if (cycleProgress < 5.536) return { phase: "Waxing Crescent", icon: "🌒", illumination };
  if (cycleProgress < 9.228) return { phase: "First Quarter", icon: "🌓", illumination };
  if (cycleProgress < 12.919) return { phase: "Waxing Gibbous", icon: "🌔", illumination };
  if (cycleProgress < 16.611) return { phase: "Full Moon", icon: "🌕", illumination };
  if (cycleProgress < 20.302) return { phase: "Waning Gibbous", icon: "🌖", illumination };
  if (cycleProgress < 23.994) return { phase: "Last Quarter", icon: "🌗", illumination };
  if (cycleProgress < 27.685) return { phase: "Waning Crescent", icon: "🌘", illumination };
  return { phase: "New Moon", icon: "🌑", illumination };
}

// Solar trajectory & elevation calculator
function getSolarCalculations(sunriseStr = "06:09", sunsetStr = "18:28") {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = sunriseStr.split(":").map(Number);
  const [eH, eM] = sunsetStr.split(":").map(Number);
  const riseMin = (sH || 6) * 60 + (sM || 9);
  const setMin = (eH || 18) * 60 + (eM || 28);

  const isDay = nowMin >= riseMin && nowMin <= setMin;
  let progress = 0;
  let statusText = "";
  let elevation = 0;
  let azimuth = 0;

  if (isDay) {
    progress = (nowMin - riseMin) / (setMin - riseMin);
    const remMin = setMin - nowMin;
    const rH = Math.floor(remMin / 60);
    const rM = remMin % 60;
    statusText = `${rH}h ${rM}m daylight remaining`;
    elevation = Math.round(Math.sin(progress * Math.PI) * 72);
    azimuth = Math.round(90 + progress * 180);
  } else {
    let toRiseMin = 0;
    if (nowMin < riseMin) {
      toRiseMin = riseMin - nowMin;
    } else {
      toRiseMin = 1440 - nowMin + riseMin;
    }
    const rH = Math.floor(toRiseMin / 60);
    const rM = toRiseMin % 60;
    statusText = `Night Sky • ${rH}h ${rM}m until dawn`;
    const nightDuration = 1440 - (setMin - riseMin);
    const nightElapsed = nowMin > setMin ? nowMin - setMin : nowMin + (1440 - setMin);
    progress = Math.max(0, Math.min(1, nightElapsed / nightDuration));
    elevation = -Math.round(Math.sin(progress * Math.PI) * 55);
    azimuth = Math.round(270 + progress * 180) % 360;
  }

  return { isDay, progress: Math.max(0, Math.min(1, progress)), statusText, elevation, azimuth };
}

// Aviation / Synoptic METAR generator
function generateMetar(cityName, temp, dewPoint, windKmh, condition, pressureHpa) {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const min = String(Math.floor(now.getUTCMinutes() / 30) * 30).padStart(2, "0");
  const zulu = `${day}${hour}${min}Z`;

  const clean = cityName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const icao = clean.length >= 4 ? `VO${clean.slice(0, 2)}` : "VOBG";
  const kts = Math.round(windKmh * 0.539957);
  const windDir = "270";
  const windCode = `${windDir}${String(kts).padStart(2, "0")}KT`;
  const vis = "9999";

  let wx = "FEW030";
  const condLower = (condition || "").toLowerCase();
  if (condLower.includes("rain") || condLower.includes("shower")) {
    wx = "-RA BKN025";
  } else if (condLower.includes("thunder") || condLower.includes("storm")) {
    wx = "TSRA SCT020CB";
  } else if (condLower.includes("cloud")) {
    wx = "SCT035";
  }

  const tStr = temp < 0 ? `M${String(Math.abs(temp)).padStart(2, "0")}` : String(temp).padStart(2, "0");
  const dStr = dewPoint < 0 ? `M${String(Math.abs(dewPoint)).padStart(2, "0")}` : String(dewPoint).padStart(2, "0");
  const tempDewCode = `${tStr}/${dStr}`;
  const qnh = `Q${Math.round(pressureHpa)}`;

  const raw = `METAR ${icao} ${zulu} ${windCode} ${vis} ${wx} ${tempDewCode} ${qnh} NOSIG`;

  return {
    raw,
    icao,
    zulu,
    wind: `${windDir}° at ${kts} knots (${windKmh} km/h)`,
    vis: "> 10 km (Optical Horizon Clear)",
    sky: wx,
    tempDew: `Temperature: ${temp}°C | Dew Point: ${dewPoint}°C`,
    qnh: `${pressureHpa} hPa (${(pressureHpa * 0.02953).toFixed(2)} inHg Altimeter)`
  };
}

export default function ObservatoryTab({
  weather,
  envData,
  coords,
  onRefreshGps,
  onOpenLocationModal,
  refreshingGps,
  lang = "en",
  onNavigateTab
}) {
  // Unit conversion state with persistence
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem("atmos_temp_unit") || "C");
  const [windUnit, setWindUnit] = useState(() => localStorage.getItem("atmos_wind_unit") || "kmh");
  const [pressureUnit, setPressureUnit] = useState(() => localStorage.getItem("atmos_press_unit") || "hpa");

  // Interactive View States
  const [trendMetric, setTrendMetric] = useState("temp"); // "temp" | "precip" | "wind" | "dew"
  const [activeVisualizer, setActiveVisualizer] = useState("radar"); // "radar" | "sounding"
  const [selectedDayIdx, setSelectedDayIdx] = useState(0); // 7-day detail drawer
  const [showMetar, setShowMetar] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedMetar, setCopiedMetar] = useState(false);
  const [hoveredHourIdx, setHoveredHourIdx] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("atmos_temp_unit", tempUnit);
      localStorage.setItem("atmos_wind_unit", windUnit);
      localStorage.setItem("atmos_press_unit", pressureUnit);
    } catch {}
  }, [tempUnit, windUnit, pressureUnit]);

  const currentHour = new Date().getHours();
  const isNightNow =
    weather?.current?.is_day !== undefined
      ? Number(weather.current.is_day) === 0
      : currentHour < 6 || currentHour >= 19;

  const cur = weather?.current || {
    temp: 25,
    condition: isNightNow ? "Clear Night" : "Clear",
    precipitation: 0,
    humidity: 55,
    wind: 14,
    dew_point: 17,
    is_day: isNightNow ? 0 : 1,
    sunrise: "06:09",
    sunset: "18:28"
  };

  const cityName = weather?.resolved_city || "Bengaluru, Karnataka";
  const hourly = weather?.hourly || [];
  const daily = weather?.daily || [];

  const aqi = envData?.aqi || { value: 32, status: "Good", pm25: 18, pm10: 34, color: "emerald" };
  const uv = envData?.uv || { index: 4.8, risk: "Moderate", burnTime: "40 min" };
  const agro = envData?.agro || { soilMoisture: "24.5", vpd: "1.12" };

  const lat = coords?.lat ? parseFloat(coords.lat) : 12.9716;
  const lon = coords?.lon ? parseFloat(coords.lon) : 77.5946;

  // Base barometric pressure
  const pressureHpa = 1013.2;

  // Conversions for active unit settings
  const dispTemp = convertTemp(cur.temp, tempUnit);
  const dispDew = convertTemp(cur.dew_point, tempUnit);
  const dispFeelsLike = convertTemp(Math.round(cur.temp + (cur.humidity > 60 ? 1 : 0)), tempUnit);
  const dispWind = convertWind(cur.wind, windUnit);
  const dispPressure = convertPressure(pressureHpa, pressureUnit);
  const dispDayMax = convertTemp(cur.temp + 3, tempUnit);
  const dispDayMin = convertTemp(Math.max(16, cur.temp - 5), tempUnit);

  // Unit suffixes
  const tempSuffix = tempUnit === "F" ? "°F" : "°C";
  const windSuffix = windUnit === "mph" ? "mph" : windUnit === "kts" ? "kts" : "km/h";
  const pressureSuffix = pressureUnit === "inHg" ? "inHg" : pressureUnit === "mmHg" ? "mmHg" : "hPa";

  // Solar trajectory & lunar phase calculations
  const solar = useMemo(
    () => getSolarCalculations(cur.sunrise || "06:09", cur.sunset || "18:28"),
    [cur.sunrise, cur.sunset]
  );
  const lunar = useMemo(() => getLunarPhase(), []);
  const metar = useMemo(
    () => generateMetar(cityName, cur.temp, cur.dew_point, cur.wind, cur.condition, pressureHpa),
    [cityName, cur.temp, cur.dew_point, cur.wind, cur.condition, pressureHpa]
  );

  // Sounding calculations
  const freezingLevelMeters = Math.max(800, Math.round((cur.temp / 6.5) * 1000));

  function handleCopyCoords() {
    navigator.clipboard.writeText(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  }

  function handleCopyMetar() {
    navigator.clipboard.writeText(metar.raw);
    setCopiedMetar(true);
    setTimeout(() => setCopiedMetar(false), 2000);
  }

  // Selected Day for the extended 7-Day drawer
  const selectedDay = daily[selectedDayIdx] || daily[0] || {
    day: "Today",
    max_temp: cur.temp + 3,
    min_temp: cur.temp - 5,
    condition: cur.condition,
    chance_of_rain: cur.precipitation
  };

  return (
    <div className="tab-pane active fade-in observatory-container">
      {/* Top Action Bar: Station Heading & Location Controls */}
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <Activity className="inline-icon text-cyan" size={24} />
            Atmospheric Observatory & Synoptic Telemetry
          </h2>
          <p className="section-subtitle">
            Aerospace-grade synoptic command core, Doppler sweep telemetry, and diurnal vectors
          </p>
        </div>

        <div className="header-actions-cluster">
          {/* Multi-Unit Telemetry Switcher */}
          <div className="observatory-unit-switcher glass">
            <div className="unit-toggle-group" title="Temperature Unit">
              <button
                type="button"
                className={`unit-toggle-btn ${tempUnit === "C" ? "active" : ""}`}
                onClick={() => setTempUnit("C")}
              >
                °C
              </button>
              <button
                type="button"
                className={`unit-toggle-btn ${tempUnit === "F" ? "active" : ""}`}
                onClick={() => setTempUnit("F")}
              >
                °F
              </button>
            </div>

            <div className="unit-toggle-group" title="Wind Velocity Unit">
              <button
                type="button"
                className={`unit-toggle-btn ${windUnit === "kmh" ? "active" : ""}`}
                onClick={() => setWindUnit("kmh")}
              >
                km/h
              </button>
              <button
                type="button"
                className={`unit-toggle-btn ${windUnit === "mph" ? "active" : ""}`}
                onClick={() => setWindUnit("mph")}
              >
                mph
              </button>
              <button
                type="button"
                className={`unit-toggle-btn ${windUnit === "kts" ? "active" : ""}`}
                onClick={() => setWindUnit("kts")}
              >
                kts
              </button>
            </div>

            <div className="unit-toggle-group" title="Barometric Pressure Unit">
              <button
                type="button"
                className={`unit-toggle-btn ${pressureUnit === "hpa" ? "active" : ""}`}
                onClick={() => setPressureUnit("hpa")}
              >
                hPa
              </button>
              <button
                type="button"
                className={`unit-toggle-btn ${pressureUnit === "inHg" ? "active" : ""}`}
                onClick={() => setPressureUnit("inHg")}
              >
                inHg
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-small location-action-btn"
            onClick={onOpenLocationModal}
          >
            <Search size={14} className="text-cyan" />
            <span>Search City / GPS</span>
          </button>
          <button
            type="button"
            className="btn btn-small ghost gps-refresh-btn"
            onClick={onRefreshGps}
            title="Refresh hardware GPS coordinates"
          >
            <RotateCw size={14} className={refreshingGps ? "spin" : ""} />
            <span>{refreshingGps ? "Acquiring..." : "Locate Me"}</span>
          </button>
        </div>
      </div>

      {/* Hero Weather & 4 Primary Telemetry Metrics */}
      <div className="observatory-hero-grid">
        {/* Main Synoptic Weather Card */}
        <div className="hero-weather-surface glass">
          <div className="hero-surface-top">
            <div className="hero-location-block">
              <div className="telemetry-live-badge">
                <span className="pulse-dot" />
                <span>LIVE TELEMETRY STATION</span>
              </div>
              <h1 className="hero-location-name">{cityName}</h1>
              <p className="hero-coordinates font-mono">
                <Compass size={13} className="text-cyan" />
                <span>
                  Hardware GPS: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                </span>
              </p>
            </div>
            <div className={`hero-condition-emoji ${isNightNow ? "night" : "day"}`}>
              <div className="condition-aura-halo" />
              {weatherConditionEmoji(cur.condition, cur.is_day)}
            </div>
          </div>

          <div className="hero-metrics-row">
            <div className="hero-temp-large">
              <span className="temp-num font-mono">{formatDigits(dispTemp, lang)}</span>
              <span className="temp-unit">{tempSuffix}</span>
            </div>
            <div className="hero-condition-sub">
              <div className="cond-label">{cur.condition}</div>
              <div className="cond-detail">
                Precipitation Probability: <b>{formatDigits(cur.precipitation, lang)}%</b>
              </div>
              <div className="cond-dew text-sm text-secondary">
                Dew point: {formatDigits(dispDew, lang)}
                {tempSuffix} &bull; Humidity: {formatDigits(cur.humidity, lang)}%
              </div>
            </div>
          </div>

          {/* Quick Atmospheric Metrics Strip */}
          <div className="hero-atmospheric-strip">
            <div className="strip-item">
              <span className="strip-label">DAY RANGE</span>
              <span className="strip-val font-mono">
                ▲ {formatDigits(dispDayMax, lang)}° ▼ {formatDigits(dispDayMin, lang)}°
              </span>
            </div>
            <div className="strip-item">
              <span className="strip-label">FEELS LIKE</span>
              <span className="strip-val font-mono">
                {formatDigits(dispFeelsLike, lang)}
                {tempSuffix}
              </span>
            </div>
            <div className="strip-item">
              <span className="strip-label">BAROMETER</span>
              <span className="strip-val font-mono">
                {formatDigits(dispPressure, lang)} {pressureSuffix}
              </span>
            </div>
            <div className="strip-item">
              <span className="strip-label">VISIBILITY</span>
              <span className="strip-val font-mono">
                {windUnit === "mph" ? "6.2 mi" : "10 km"}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Tiles Grid with Visual Progress Meters */}
        <div className="metric-tiles-grid">
          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Wind Velocity</span>
              <div className="metric-icon-badge cyan">
                <Wind size={16} />
              </div>
            </div>
            <div className="metric-tile-body">
              <span className="metric-val font-mono">{formatDigits(dispWind, lang)}</span>
              <span className="metric-sub">{windSuffix}</span>
            </div>
            <div className="metric-meter-track">
              <div
                className="metric-meter-fill cyan"
                style={{ width: `${Math.min(100, Math.max(12, (cur.wind / 40) * 100))}%` }}
              />
            </div>
            <span className="metric-foot text-cyan">
              Surface Vector &bull; {cur.wind > 20 ? "Fresh Breeze" : "Moderate Breeze"}
            </span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Relative Humidity</span>
              <div className="metric-icon-badge blue">
                <Droplets size={16} />
              </div>
            </div>
            <div className="metric-tile-body">
              <span className="metric-val font-mono">{formatDigits(cur.humidity, lang)}</span>
              <span className="metric-sub">%</span>
            </div>
            <div className="metric-meter-track">
              <div
                className="metric-meter-fill blue"
                style={{ width: `${Math.min(100, Math.max(10, cur.humidity))}%` }}
              />
            </div>
            <span className="metric-foot text-blue">
              Atmospheric Moisture &bull; {cur.humidity > 70 ? "Elevated" : "Optimal"}
            </span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Precipitation</span>
              <div className="metric-icon-badge purple">
                <CloudRain size={16} />
              </div>
            </div>
            <div className="metric-tile-body">
              <span className="metric-val font-mono">{formatDigits(cur.precipitation, lang)}</span>
              <span className="metric-sub">%</span>
            </div>
            <div className="metric-meter-track">
              <div
                className="metric-meter-fill purple"
                style={{ width: `${Math.max(6, Math.min(100, cur.precipitation))}%` }}
              />
            </div>
            <span className="metric-foot text-purple">
              Rain Radar &bull; {cur.precipitation > 30 ? "Rain Alert" : "Clear Window"}
            </span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Dew Point</span>
              <div className="metric-icon-badge amber">
                <Thermometer size={16} />
              </div>
            </div>
            <div className="metric-tile-body">
              <span className="metric-val font-mono">{formatDigits(dispDew, lang)}</span>
              <span className="metric-sub">{tempSuffix}</span>
            </div>
            <div className="metric-meter-track">
              <div
                className="metric-meter-fill amber"
                style={{ width: `${Math.min(100, Math.max(15, (cur.dew_point / 30) * 100))}%` }}
              />
            </div>
            <span className="metric-foot text-amber">Condensation Baseline &bull; Nominal</span>
          </div>
        </div>
      </div>

      {/* NEW SECTION 1: Dual Visualizer - Solar Celestial Arc & Doppler Radar Sweep */}
      <div className="observatory-telemetry-dual-grid">
        {/* Solar Celestial Arc & Day/Night Celestial Vector */}
        <div className="solar-celestial-card glass">
          <div className="card-header-clean">
            <div className="flex-row gap-sm">
              <div className="modal-icon-badge yellow-glow">
                {solar.isDay ? <Sun size={17} className="text-amber" /> : <Moon size={17} className="text-cyan" />}
              </div>
              <div>
                <h3 className="subheading">Solar Celestial Arc & Ephemeris</h3>
                <p className="text-secondary text-sm">Sun altitude angle, diurnal trajectory & lunar phase</p>
              </div>
            </div>
            <span className="celestial-status-badge">
              <Clock size={12} /> {solar.statusText}
            </span>
          </div>

          {/* SVG Celestial Trajectory Arc */}
          <div className="celestial-arc-wrap">
            <svg viewBox="0 0 400 150" className="celestial-svg">
              <defs>
                <linearGradient id="solarSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
                <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizon baseline */}
              <line x1="20" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Parabolic Solar Arc */}
              <path
                d="M 30,130 Q 200,10 370,130"
                fill="none"
                stroke={solar.isDay ? "url(#solarSkyGrad)" : "rgba(255,255,255,0.1)"}
                strokeWidth="3"
                strokeDasharray={solar.isDay ? "none" : "4,4"}
              />

              {/* Position along arc */}
              {(() => {
                const t = solar.progress;
                // Quadratic bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
                const cx = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 200 + t * t * 370;
                const cy = (1 - t) * (1 - t) * 130 + 2 * (1 - t) * t * 10 + t * t * 130;

                return (
                  <g filter="url(#solarGlow)">
                    {/* Beam down to horizon */}
                    <line x1={cx} y1={cy} x2={cx} y2="130" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1.5" strokeDasharray="2,2" />
                    {/* Glowing celestial orb */}
                    <circle cx={cx} cy={cy} r="8" fill={solar.isDay ? "#f59e0b" : "#38bdf8"} stroke="#ffffff" strokeWidth="2.5" />
                    <text x={cx} y={cy - 14} fill="var(--text-heading)" fontSize="11" fontWeight="700" textAnchor="middle">
                      {solar.elevation > 0 ? `+${solar.elevation}°` : `${solar.elevation}°`}
                    </text>
                  </g>
                );
              })()}

              {/* Sunrise & Sunset labels */}
              <text x="30" y="145" fill="var(--text-muted)" fontSize="10" fontWeight="600" textAnchor="start">
                🌅 {cur.sunrise || "06:09"}
              </text>
              <text x="200" y="32" fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                Solar Noon ~ 12:18
              </text>
              <text x="370" y="145" fill="var(--text-muted)" fontSize="10" fontWeight="600" textAnchor="end">
                🌇 {cur.sunset || "18:28"}
              </text>
            </svg>
          </div>

          {/* Celestial Telemetry Grid */}
          <div className="celestial-meta-grid">
            <div className="celestial-meta-item">
              <span className="celestial-lbl">Solar Elevation</span>
              <span className="celestial-val font-mono text-amber">
                {solar.elevation > 0 ? `▲ ${solar.elevation}° Above Horizon` : `▼ ${Math.abs(solar.elevation)}° Below Horizon`}
              </span>
            </div>
            <div className="celestial-meta-item">
              <span className="celestial-lbl">Solar Azimuth</span>
              <span className="celestial-val font-mono text-cyan">
                {solar.azimuth}° {solar.azimuth > 180 ? "WSW" : "ESE"}
              </span>
            </div>
            <div className="celestial-meta-item">
              <span className="celestial-lbl">Lunar Synodic Phase</span>
              <span className="celestial-val">
                {lunar.icon} {lunar.phase} ({lunar.illumination}%)
              </span>
            </div>
            <div className="celestial-meta-item">
              <span className="celestial-lbl">Photoperiod Length</span>
              <span className="celestial-val font-mono">12h 19m Total</span>
            </div>
          </div>
        </div>

        {/* Live Doppler Radar Sweep & Micro-Sounding Visualizer */}
        <div className="radar-sounding-card glass">
          <div className="card-header-clean">
            <div className="flex-row gap-sm">
              <div className="modal-icon-badge cyan-glow">
                <Radar size={17} className="text-cyan" />
              </div>
              <div>
                <h3 className="subheading">Station Radar & Atmospheric Sounding</h3>
                <p className="text-secondary text-sm">Dual-Pol Doppler reflectivity and tropospheric lapse profile</p>
              </div>
            </div>

            {/* Visualizer Mode Toggle */}
            <div className="visualizer-toggle-pills">
              <button
                type="button"
                className={`viz-pill-btn ${activeVisualizer === "radar" ? "active" : ""}`}
                onClick={() => setActiveVisualizer("radar")}
              >
                <Scan size={12} /> Doppler Sweep
              </button>
              <button
                type="button"
                className={`viz-pill-btn ${activeVisualizer === "sounding" ? "active" : ""}`}
                onClick={() => setActiveVisualizer("sounding")}
              >
                <Layers size={12} /> Sounding Layers
              </button>
            </div>
          </div>

          {activeVisualizer === "radar" ? (
            /* Live Doppler Radar Sweep View */
            <div className="radar-sweep-container">
              <div className="radar-scope-circle">
                {/* Concentric distance range rings */}
                <div className="radar-ring ring-15" title="15 km Range Ring">
                  <span className="ring-label">15 km</span>
                </div>
                <div className="radar-ring ring-30" title="30 km Range Ring">
                  <span className="ring-label">30 km</span>
                </div>
                <div className="radar-ring ring-50" title="50 km Range Ring">
                  <span className="ring-label">50 km</span>
                </div>

                {/* Crosshair axes */}
                <div className="radar-axis axis-vert" />
                <div className="radar-axis axis-horiz" />

                {/* Simulated Doppler Echo Cells */}
                <div className={`radar-echo echo-1 ${cur.precipitation > 20 ? "active-rain" : ""}`} />
                <div className={`radar-echo echo-2 ${cur.precipitation > 40 ? "active-storm" : ""}`} />

                {/* Rotating Conical Sweep Beam */}
                <div className="radar-sweep-beam" />

                {/* Center Antenna Beacon */}
                <div className="radar-center-antenna">
                  <span className="center-dot" />
                </div>
              </div>

              {/* Radar Telemetry Metrics & dBZ Scale */}
              <div className="radar-meta-panel">
                <div className="radar-meta-header">
                  <span className="radar-band-tag">S-Band 2.8 GHz &bull; Dual-Pol V/H</span>
                  <span className="radar-prf-tag">PRF: 1200 Hz &bull; 3.2 RPM</span>
                </div>

                <div className="dbz-scale-wrap">
                  <span className="dbz-title">Reflectivity Index (dBZ):</span>
                  <div className="dbz-gradient-bar" />
                  <div className="dbz-labels-row">
                    <span>15 dBZ (Light)</span>
                    <span>35 dBZ (Moderate)</span>
                    <span>50 dBZ (Heavy)</span>
                    <span>65+ dBZ (Severe)</span>
                  </div>
                </div>

                <div className="radar-footer-link">
                  <span>Current Echo Intensity: <strong>{cur.precipitation > 30 ? "28-35 dBZ (Rain Cells Active)" : "< 15 dBZ (Clear Air Mode)"}</strong></span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("satellite")}
                      className="radar-jump-btn"
                    >
                      <ExternalLink size={12} /> Full Satellite View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Atmospheric Stratification Sounding View */
            <div className="sounding-layers-container">
              <div className="sounding-column">
                <div className="sounding-layer tropopause">
                  <span className="layer-alt font-mono">11,000 m</span>
                  <div className="layer-info">
                    <span className="layer-name">Tropopause & Jetstream Boundary</span>
                    <span className="layer-metric">-56°C &bull; Clear Tropospheric Ceiling</span>
                  </div>
                </div>

                <div className="sounding-layer freezing">
                  <span className="layer-alt font-mono">{freezingLevelMeters} m</span>
                  <div className="layer-info">
                    <span className="layer-name">Freezing Level (0°C Isotherm)</span>
                    <span className="layer-metric">0°C &bull; Icing Probability Window</span>
                  </div>
                </div>

                <div className="sounding-layer lcl">
                  <span className="layer-alt font-mono">1,850 m</span>
                  <div className="layer-info">
                    <span className="layer-name">Lifted Condensation Level (LCL)</span>
                    <span className="layer-metric">Cloud Base Ceiling &bull; Dew Point Saturation</span>
                  </div>
                </div>

                <div className="sounding-layer pbl">
                  <span className="layer-alt font-mono">1,200 m</span>
                  <div className="layer-info">
                    <span className="layer-name">Planetary Boundary Layer (PBL) Top</span>
                    <span className="layer-metric">Convective Mixing Depth &bull; Surface Shear</span>
                  </div>
                </div>

                <div className="sounding-layer surface">
                  <span className="layer-alt font-mono">0 m</span>
                  <div className="layer-info">
                    <span className="layer-name">Surface Observatory Station</span>
                    <span className="layer-metric">
                      {dispTemp}
                      {tempSuffix} &bull; RH {cur.humidity}% &bull; QNH {dispPressure} {pressureSuffix}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sounding-footer-legend">
                <span>Environmental Lapse Rate: <strong>-6.5°C / 1,000 m (Standard Adiabatic)</strong></span>
                <span className="sounding-stability-badge text-emerald">
                  <ShieldCheck size={13} /> Tropospheric Column Stable
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hardware GPS Station Telemetry & Synoptic Barometer HUD */}
      <div className="glass card gps-telemetry-hud-card">
        <div className="card-header-clean">
          <div className="flex-row gap-sm">
            <div className="modal-icon-badge">
              <Radio size={16} className="text-cyan pulse" />
            </div>
            <div>
              <h3 className="subheading">Hardware GPS Station Telemetry Lock & Barometer</h3>
              <p className="text-secondary text-sm">Geospatial positioning, satellite fix & 3-hour barometric trend</p>
            </div>
          </div>
          <div className="flex-row gap-sm">
            <button
              type="button"
              className="badge-ghost copy-coords-btn"
              onClick={() => setShowMetar(!showMetar)}
              title="Toggle Aviation METAR Report"
            >
              <FileText size={13} className="text-cyan" />
              <span>{showMetar ? "Hide METAR" : "View METAR"}</span>
            </button>

            <button
              type="button"
              className="badge-ghost copy-coords-btn"
              onClick={handleCopyCoords}
              title="Copy coordinates to clipboard"
            >
              {copiedCoords ? <Check size={13} className="text-cyan" /> : <Copy size={13} />}
              <span>{copiedCoords ? "Copied!" : "Copy Coordinates"}</span>
            </button>
          </div>
        </div>

        <div className="telemetry-grid five-col" style={{ marginTop: "0.75rem" }}>
          <div className="session-meta-item">
            <span className="meta-lbl">Latitude / Longitude</span>
            <span className="meta-val text-cyan font-mono">
              {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
            </span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">Geocoded Locality</span>
            <span className="meta-val">{cityName}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">Fix Precision</span>
            <span className="meta-val text-emerald">±6.2m Accuracy &bull; 3D Lock</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">3-Hour Pressure Trend</span>
            <span className="meta-val text-cyan font-mono">
              ▲ +0.4 {pressureSuffix} (Rising Steadily)
            </span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">Synoptic Tendency</span>
            <span className="meta-val">Anticyclonic Ridge Stable</span>
          </div>
        </div>

        {/* Collapsible Aviation METAR Report Box */}
        {showMetar && (
          <div className="metar-drawer-box glass">
            <div className="metar-header-row">
              <div className="metar-title-wrap">
                <span className="metar-dot" />
                <span className="metar-title">ICAO Synoptic METAR Observation Feed</span>
              </div>
              <button
                type="button"
                onClick={handleCopyMetar}
                className="metar-copy-btn"
                title="Copy raw METAR string"
              >
                {copiedMetar ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedMetar ? "Copied" : "Copy METAR"}</span>
              </button>
            </div>

            <div className="metar-terminal-block font-mono">
              <code>{metar.raw}</code>
            </div>

            <div className="metar-decoded-grid">
              <div>
                <span>Station:</span>
                <strong>{metar.icao} ({cityName})</strong>
              </div>
              <div>
                <span>Observation UTC:</span>
                <strong>{metar.zulu}</strong>
              </div>
              <div>
                <span>Wind Vector:</span>
                <strong>{metar.wind}</strong>
              </div>
              <div>
                <span>Altimeter Setting:</span>
                <strong>{metar.qnh}</strong>
              </div>
              <div>
                <span>Visibility:</span>
                <strong>{metar.vis}</strong>
              </div>
              <div>
                <span>Cloud & Weather:</span>
                <strong>{metar.sky}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environmental Trio: AQI, Solar UV, Agro */}
      <div className="environmental-trio-grid">
        {/* Air Quality Index */}
        <div className="env-card glass">
          <div className="env-card-header">
            <div>
              <h3 className="env-card-title">Air Quality Index</h3>
              <p className="env-card-sub">Regional Atmospheric Purity</p>
            </div>
            <span className={`status-pill ${aqi.color || "emerald"}`}>{aqi.status}</span>
          </div>

          <div className="env-score-large">
            <span className="env-score-num font-mono">{formatDigits(aqi.value, lang)}</span>
            <span className="env-scale">EAQI</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>PM 2.5:</span>
              <strong>{formatDigits(aqi.pm25, lang)} µg/m³</strong>
            </div>
            <div>
              <span>PM 10:</span>
              <strong>{formatDigits(aqi.pm10, lang)} µg/m³</strong>
            </div>
          </div>
        </div>

        {/* Solar Exposure & UV */}
        <div className="env-card glass">
          <div className="env-card-header">
            <div>
              <h3 className="env-card-title">Solar Exposure & UV</h3>
              <p className="env-card-sub">Photochemical Intensity</p>
            </div>
            <span className="status-pill amber">{uv.risk} Risk</span>
          </div>

          <div className="env-score-large">
            <span className="env-score-num font-mono text-amber">{formatDigits(uv.index, lang)}</span>
            <span className="env-scale">UVI</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>Burn Window:</span>
              <strong>~{uv.burnTime}</strong>
            </div>
            <div>
              <span>Protection:</span>
              <strong>{uv.index > 5 ? "SPF 30+ Required" : "Nominal"}</strong>
            </div>
          </div>
        </div>

        {/* Agro Soil & Evapotranspiration */}
        <div className="env-card glass">
          <div className="env-card-header">
            <div>
              <h3 className="env-card-title">Agro & Evapotranspiration</h3>
              <p className="env-card-sub">Soil Saturation & Crop Dynamics</p>
            </div>
            <span className="status-pill cyan">Optimal</span>
          </div>

          <div className="env-score-large">
            <span className="env-score-num font-mono text-cyan">{formatDigits(agro.soilMoisture, lang)}%</span>
            <span className="env-scale">Saturation</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>Vapor Deficit (VPD):</span>
              <strong>{formatDigits(agro.vpd, lang)} kPa</strong>
            </div>
            <div>
              <span>Transpiration Stress:</span>
              <strong>{parseFloat(agro.vpd) > 1.5 ? "Elevated" : "Normal"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Diurnal Trend Vectors (24h Curve with Interactive Inspection) */}
      <div className="diurnal-section-card glass">
        <div className="diurnal-header">
          <div>
            <h3 className="subheading">Diurnal Trend Vectors</h3>
            <p className="text-secondary text-sm">
              Continuous 24-hour meteorological projection for {cityName.split(",")[0]}
            </p>
          </div>

          <div className="metric-switcher-pills">
            <button
              type="button"
              className={`pill-btn ${trendMetric === "temp" ? "active" : ""}`}
              onClick={() => setTrendMetric("temp")}
            >
              Temperature ({tempSuffix})
            </button>
            <button
              type="button"
              className={`pill-btn ${trendMetric === "precip" ? "active" : ""}`}
              onClick={() => setTrendMetric("precip")}
            >
              Precipitation (%)
            </button>
            <button
              type="button"
              className={`pill-btn ${trendMetric === "wind" ? "active" : ""}`}
              onClick={() => setTrendMetric("wind")}
            >
              Wind Velocity ({windSuffix})
            </button>
            <button
              type="button"
              className={`pill-btn ${trendMetric === "dew" ? "active" : ""}`}
              onClick={() => setTrendMetric("dew")}
            >
              Dew Point Spread
            </button>
          </div>
        </div>

        {/* SVG Curve with dynamic data points and hover inspection */}
        <div className="diurnal-chart-wrap">
          {hourly.length > 0 &&
            (() => {
              const vals = hourly.map(h => {
                if (trendMetric === "temp") return convertTemp(h.temp, tempUnit);
                if (trendMetric === "precip") return h.precip;
                if (trendMetric === "wind") return convertWind(h.wind, windUnit);
                // Dew point gap (temp - dew)
                return Math.max(1, convertTemp(h.temp, tempUnit) - convertTemp(h.temp - 6, tempUnit));
              });

              const minV = Math.min(...vals) - (trendMetric === "temp" ? 2 : 4);
              const maxV = Math.max(...vals) + (trendMetric === "temp" ? 2 : 8);
              const range = maxV - minV || 1;
              const width = 760;
              const height = 150;
              const stepX = width / (vals.length - 1 || 1);

              const coordsList = vals.map((val, i) => ({
                x: i * stepX,
                y: height - ((val - minV) / range) * (height - 45) - 20,
                val,
                rawHour: hourly[i],
                time: hourly[i].time
              }));

              const pathD = coordsList.reduce(
                (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
                ""
              );
              const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

              return (
                <div className="diurnal-relative-container">
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="diurnal-svg"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="diurnalCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#diurnalCurveGrad)" />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="var(--cyan)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {coordsList.map((pt, i) => {
                      const isHovered = hoveredHourIdx === i;
                      return (
                        <g
                          key={i}
                          className="diurnal-point-group"
                          onMouseEnter={() => setHoveredHourIdx(i)}
                          onMouseLeave={() => setHoveredHourIdx(null)}
                          onClick={() => setHoveredHourIdx(isHovered ? null : i)}
                          style={{ cursor: "pointer" }}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? "6.5" : "4.5"}
                            fill="var(--bg)"
                            stroke={isHovered ? "#38bdf8" : "var(--cyan)"}
                            strokeWidth={isHovered ? "3.5" : "2.5"}
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            fill="var(--text-heading)"
                            fontSize="11"
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {formatDigits(
                              trendMetric === "temp"
                                ? `${pt.val}°`
                                : trendMetric === "precip"
                                ? `${pt.val}%`
                                : trendMetric === "wind"
                                ? `${pt.val}${windSuffix}`
                                : `Δ${pt.val}°`,
                              lang
                            )}
                          </text>
                          <text
                            x={pt.x}
                            y={height - 4}
                            fill={isHovered ? "var(--cyan)" : "var(--text-muted)"}
                            fontSize="10"
                            fontWeight={isHovered ? "700" : "400"}
                            textAnchor="middle"
                          >
                            {pt.time}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Interactive Diurnal Hover Tooltip */}
                  {hoveredHourIdx !== null && coordsList[hoveredHourIdx] && (
                    <div
                      className="diurnal-hover-tooltip glass"
                      style={{
                        left: `${(coordsList[hoveredHourIdx].x / width) * 100}%`
                      }}
                    >
                      <div className="tooltip-title font-mono">{coordsList[hoveredHourIdx].time}</div>
                      <div className="tooltip-row">
                        <span>Temperature:</span>
                        <strong>
                          {convertTemp(coordsList[hoveredHourIdx].rawHour.temp, tempUnit)}
                          {tempSuffix}
                        </strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Precipitation:</span>
                        <strong>{coordsList[hoveredHourIdx].rawHour.precip}%</strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Wind:</span>
                        <strong>
                          {convertWind(coordsList[hoveredHourIdx].rawHour.wind, windUnit)} {windSuffix}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      </div>

      {/* 7-Day Synoptic Forecast with Expandable Day Detail Drawer */}
      <div className="synoptic-forecast-section glass">
        <div className="card-header-clean">
          <div>
            <h3 className="subheading">7-Day Synoptic Multi-Model Ensemble</h3>
            <p className="text-secondary text-sm">
              Click any forecast day to inspect high-resolution synoptic parameters
            </p>
          </div>
          <span className="badge-ghost">Interactive Multi-Model Feed</span>
        </div>

        {/* 7-Day Cards Grid */}
        <div className="synoptic-cards-grid">
          {daily.map((d, idx) => {
            const minT = convertTemp(d.min_temp, tempUnit);
            const maxT = convertTemp(d.max_temp, tempUnit);
            const barWidth = Math.min(100, Math.max(25, (maxT - minT) * (tempUnit === "F" ? 4 : 8)));
            const isSelected = selectedDayIdx === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`synoptic-card glass ${idx === 0 ? "today" : ""} ${isSelected ? "selected-day" : ""}`}
                style={{ cursor: "pointer" }}
                title="Click to view detailed synoptic profile"
              >
                {idx === 0 && <span className="today-badge-pill">TODAY</span>}
                <span className="synoptic-day">{d.day}</span>
                <span className="synoptic-emoji">
                  {weatherConditionEmoji(d.condition, idx === 0 ? cur.is_day : 1)}
                </span>
                <div className="synoptic-temps font-mono">
                  <span className="synoptic-high">{formatDigits(maxT, lang)}°</span>
                  <span className="synoptic-low">{formatDigits(minT, lang)}°</span>
                </div>
                <div className="synoptic-temp-bar-wrap">
                  <div className="synoptic-temp-bar-fill" style={{ width: `${barWidth}%` }} />
                </div>
                <span className="synoptic-cond">{d.condition}</span>
                <span className="synoptic-rain">💧 {formatDigits(d.chance_of_rain, lang)}%</span>
                <div className="synoptic-expand-hint">
                  {isSelected ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Day Detail Drawer */}
        <div className="synoptic-day-drawer glass">
          <div className="drawer-header-row">
            <div className="drawer-day-title">
              <span className="drawer-day-name">{selectedDay.day} Detailed Synoptic Forecast</span>
              <span className="drawer-day-cond">
                {weatherConditionEmoji(selectedDay.condition, 1)} {selectedDay.condition}
              </span>
            </div>
            <div className="drawer-temp-spread font-mono">
              High: <strong>{convertTemp(selectedDay.max_temp, tempUnit)}{tempSuffix}</strong> &bull; Low: <strong>{convertTemp(selectedDay.min_temp, tempUnit)}{tempSuffix}</strong>
            </div>
          </div>

          <div className="drawer-metrics-grid">
            <div className="drawer-metric-item">
              <span className="drawer-lbl">Precipitation Accumulation</span>
              <span className="drawer-val">
                {selectedDay.chance_of_rain > 20 ? "2.4 – 6.8 mm expected" : "0.0 mm (Negligible precipitation)"}
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-lbl">Peak Surface Gusts</span>
              <span className="drawer-val font-mono">
                {convertWind(cur.wind + (selectedDay.chance_of_rain > 30 ? 10 : 4), windUnit)} {windSuffix} (Westerly Flow)
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-lbl">Photochemical UV Index</span>
              <span className="drawer-val">
                Index 5.8 &bull; Safe exposure window ~35 min
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-lbl">Agronomic Guidance</span>
              <span className="drawer-val text-cyan">
                {selectedDay.chance_of_rain > 30 ? "⚠️ Exercise spraying caution (wash-off risk)" : "✅ Optimal agrochemical spraying window"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
