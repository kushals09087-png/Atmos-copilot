import React, { useState } from "react";
import {
  Navigation,
  Droplets,
  CloudRain,
  Thermometer,
  RotateCw,
  Wind,
  Sun,
  Activity,
  ShieldCheck,
  Compass
} from "lucide-react";
import { weatherConditionEmoji, formatDigits } from "../../utils/telemetryData";

export default function ObservatoryTab({
  weather,
  envData,
  coords,
  onRefreshGps,
  refreshingGps,
  lang = "en"
}) {
  const [trendMetric, setTrendMetric] = useState("temp"); // "temp" | "precip" | "wind"

  const cur = weather?.current || {
    temp: 28,
    condition: "Partly Cloudy",
    precipitation: 0,
    humidity: 55,
    wind: 14,
    dew_point: 17
  };

  const cityName = weather?.resolved_city || "Bengaluru, Karnataka";
  const hourly = weather?.hourly || [];
  const daily = weather?.daily || [];

  const aqi = envData?.aqi || { value: 32, status: "Good", pm25: 18, pm10: 34 };
  const uv = envData?.uv || { index: 4.8, risk: "Moderate", burnTime: "40 min" };
  const agro = envData?.agro || { soilMoisture: "24.5", vpd: "1.12" };

  return (
    <div className="tab-container">
      {/* Top Banner: Live Telemetry Feed */}
      <div className="observatory-hero-grid">
        <div className="hero-weather-surface glass">
          <div className="hero-surface-top">
            <div>
              <div className="telemetry-badge">
                <span className="pulse-dot" />
                <span>LIVE TELEMETRY FEED</span>
                <button
                  type="button"
                  onClick={onRefreshGps}
                  className="gps-refresh-btn"
                  title="Refresh Hardware GPS Coordinates"
                >
                  <RotateCw size={12} className={refreshingGps ? "spin-icon" : ""} />
                  {refreshingGps ? "Acquiring..." : "Refresh GPS"}
                </button>
              </div>
              <h1 className="hero-location-name">{cityName}</h1>
              <p className="hero-coordinates font-mono">
                <Compass size={13} />
                Hardware GPS: {coords ? `${Number(coords.lat).toFixed(4)}°N, ${Number(coords.lon).toFixed(4)}°E` : "12.9716°N, 77.5946°E"}
              </p>
            </div>
            <div className="hero-condition-emoji">
              {weatherConditionEmoji(cur.condition)}
            </div>
          </div>

          <div className="hero-metrics-row">
            <div className="hero-temp-large">
              <span className="temp-num">{formatDigits(cur.temp, lang)}</span>
              <span className="temp-unit">°C</span>
            </div>
            <div className="hero-condition-sub">
              <div className="cond-label">{cur.condition}</div>
              <div className="cond-detail">
                Precipitation Probability: <b>{formatDigits(cur.precipitation, lang)}%</b>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Telemetry Metric Tiles */}
        <div className="metric-tiles-grid">
          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Wind Velocity</span>
              <Wind size={16} className="metric-icon cyan" />
            </div>
            <div className="metric-tile-body">
              <span className="metric-val">{formatDigits(cur.wind, lang)}</span>
              <span className="metric-sub">km/h</span>
            </div>
            <span className="metric-foot text-cyan">Surface Vector</span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Relative Humidity</span>
              <Droplets size={16} className="metric-icon blue" />
            </div>
            <div className="metric-tile-body">
              <span className="metric-val">{formatDigits(cur.humidity, lang)}</span>
              <span className="metric-sub">%</span>
            </div>
            <span className="metric-foot text-blue">Atmospheric Moisture</span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Precipitation</span>
              <CloudRain size={16} className="metric-icon purple" />
            </div>
            <div className="metric-tile-body">
              <span className="metric-val">{formatDigits(cur.precipitation, lang)}</span>
              <span className="metric-sub">%</span>
            </div>
            <span className="metric-foot text-purple">Model Probability</span>
          </div>

          <div className="metric-tile glass">
            <div className="metric-tile-header">
              <span className="metric-tile-label">Dew Point</span>
              <Thermometer size={16} className="metric-icon amber" />
            </div>
            <div className="metric-tile-body">
              <span className="metric-val">{formatDigits(cur.dew_point, lang)}</span>
              <span className="metric-sub">°C</span>
            </div>
            <span className="metric-foot text-amber">Baseline Moisture</span>
          </div>
        </div>
      </div>

      {/* Environmental Metrics: AQI, Solar UV, Agro */}
      <div className="env-metrics-grid">
        {/* AQI Tile */}
        <div className="env-card glass">
          <div className="env-header">
            <div className="env-title-group">
              <div className="env-icon-badge emerald">
                <Activity size={18} />
              </div>
              <div>
                <h3>Air Quality Index</h3>
                <p>Regional Atmospheric Purity</p>
              </div>
            </div>
            <span className={`status-pill ${aqi.color}`}>{aqi.status}</span>
          </div>

          <div className="env-main-val">
            <span className="env-number font-mono">{formatDigits(aqi.value, lang)}</span>
            <span className="env-scale">EAQI</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>PM 2.5</span>
              <strong>{formatDigits(aqi.pm25, lang)} µg/m³</strong>
            </div>
            <div>
              <span>PM 10</span>
              <strong>{formatDigits(aqi.pm10, lang)} µg/m³</strong>
            </div>
          </div>
        </div>

        {/* Solar & UV Tile */}
        <div className="env-card glass">
          <div className="env-header">
            <div className="env-title-group">
              <div className="env-icon-badge amber">
                <Sun size={18} />
              </div>
              <div>
                <h3>Solar Exposure & UV</h3>
                <p>Photochemical Intensity</p>
              </div>
            </div>
            <span className="status-pill amber">{uv.risk}</span>
          </div>

          <div className="env-main-val">
            <span className="env-number font-mono text-amber">{formatDigits(uv.index, lang)}</span>
            <span className="env-scale">UVI</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>Burn Window</span>
              <strong>~{uv.burnTime}</strong>
            </div>
            <div>
              <span>Protection</span>
              <strong>{uv.index > 5 ? "SPF 30+ Required" : "Nominal"}</strong>
            </div>
          </div>
        </div>

        {/* Agro & VPD Tile */}
        <div className="env-card glass">
          <div className="env-header">
            <div className="env-title-group">
              <div className="env-icon-badge cyan">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3>Agro & Evapotranspiration</h3>
                <p>Soil Saturation & Crop Dynamics</p>
              </div>
            </div>
            <span className="status-pill cyan">Field Metrics</span>
          </div>

          <div className="env-main-val">
            <span className="env-number font-mono text-cyan">{formatDigits(agro.soilMoisture, lang)}%</span>
            <span className="env-scale">Saturation</span>
          </div>

          <div className="env-sub-stats">
            <div>
              <span>Vapor Deficit</span>
              <strong>{formatDigits(agro.vpd, lang)} kPa</strong>
            </div>
            <div>
              <span>Transpiration Stress</span>
              <strong>{parseFloat(agro.vpd) > 1.5 ? "Elevated" : "Optimal"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Diurnal Trend Vectors Curve (24h) */}
      <div className="diurnal-card glass">
        <div className="diurnal-header">
          <div>
            <h3>Diurnal Trend Vectors</h3>
            <p>Continuous 24-hour meteorological projection</p>
          </div>
          <div className="diurnal-toggle-group">
            <button
              type="button"
              className={`trend-tab ${trendMetric === "temp" ? "active" : ""}`}
              onClick={() => setTrendMetric("temp")}
            >
              Temperature
            </button>
            <button
              type="button"
              className={`trend-tab ${trendMetric === "precip" ? "active" : ""}`}
              onClick={() => setTrendMetric("precip")}
            >
              Precipitation
            </button>
            <button
              type="button"
              className={`trend-tab ${trendMetric === "wind" ? "active" : ""}`}
              onClick={() => setTrendMetric("wind")}
            >
              Wind
            </button>
          </div>
        </div>

        {/* Interactive SVG Curve */}
        <div className="diurnal-graph-wrapper">
          <svg className="diurnal-svg" preserveAspectRatio="none" viewBox="0 0 500 100">
            <defs>
              <linearGradient id="trendCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55 L 500,100 L 0,100 Z"
              fill="url(#trendCurveGradient)"
            />
            <path
              d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="2.5"
            />
          </svg>

          <div className="diurnal-data-overlay">
            {hourly.map((h, idx) => (
              <div key={idx} className="diurnal-point">
                <span className="diurnal-val font-mono">
                  {trendMetric === "temp"
                    ? `${formatDigits(h.temp, lang)}°`
                    : trendMetric === "precip"
                    ? `${formatDigits(h.precip, lang)}%`
                    : `${formatDigits(h.wind, lang)}k`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="diurnal-timeline">
          {hourly.map((h, idx) => (
            <span key={idx} className="timeline-time font-mono">
              {h.time}
            </span>
          ))}
        </div>
      </div>

      {/* 7-Day Synoptic Forecast */}
      <div className="synoptic-card glass">
        <h3 className="section-title">7-Day Synoptic Forecast</h3>
        <div className="synoptic-grid">
          {daily.map((d, idx) => (
            <div key={idx} className={`synoptic-day-card glass ${idx === 0 ? "current-day" : ""}`}>
              <span className="synoptic-day-name">{d.day}</span>
              <span className="synoptic-emoji">{weatherConditionEmoji(d.condition)}</span>
              <span className="synoptic-condition-text">{d.condition}</span>
              <div className="synoptic-temps font-mono">
                <span className="max-temp">{formatDigits(d.max_temp, lang)}°</span>
                <span className="min-temp">{formatDigits(d.min_temp, lang)}°</span>
              </div>
              <span className="synoptic-rain-prob">💧 {formatDigits(d.chance_of_rain, lang)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
