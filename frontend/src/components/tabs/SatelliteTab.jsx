import React, { useState, useEffect } from "react";
import { Radio, CloudRain, Wind, RotateCw, Compass, Sunrise, Sunset, Clock } from "lucide-react";

export default function SatelliteTab({ coords, weather }) {
  const [layer, setLayer] = useState("radar"); // "radar" | "satellite" | "wind"
  const [timeStr, setTimeStr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;

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

  const getEmbedUrl = () => {
    if (layer === "radar") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oc=1&layer=radar&sm=1&sn=1`;
    }
    if (layer === "satellite") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&oFa=0&oc=1&layer=satellite&sm=1&sn=1`;
    }
    return `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${lat}&lon=${lon}`;
  };

  const sunrise = weather?.current?.sunrise || "06:09";
  const sunset = weather?.current?.sunset || "18:28";
  const stationName = weather?.resolved_city || "Bengaluru Station";

  return (
    <div className="satellite-view-wrapper">
      {/* Live iframe Surface */}
      <iframe
        key={`${layer}-${reloadKey}`}
        title="Atmospheric Telemetry Surface"
        src={getEmbedUrl()}
        className="satellite-iframe"
        allow="geolocation; fullscreen"
        loading="eager"
      />

      {/* Floating Controls Overlay */}
      <div className="satellite-control-overlay glass">
        <div className="satellite-overlay-header">
          <div className="status-flex">
            <span className="pulse-dot" />
            <span className="satellite-title">OBSERVATION SURFACE</span>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            className="satellite-reload-btn"
            title="Reload Frame"
          >
            <RotateCw size={13} />
          </button>
        </div>

        <div className="layer-button-group">
          <button
            type="button"
            onClick={() => setLayer("radar")}
            className={`layer-btn ${layer === "radar" ? "active" : ""}`}
          >
            <div className="layer-btn-title">
              <Radio size={14} />
              <span>Live Doppler Radar</span>
            </div>
            <span className="tag-pill">HD</span>
          </button>

          <button
            type="button"
            onClick={() => setLayer("satellite")}
            className={`layer-btn ${layer === "satellite" ? "active" : ""}`}
          >
            <div className="layer-btn-title">
              <CloudRain size={14} />
              <span>INSAT / Cloud Infrared</span>
            </div>
            <span className="tag-pill">IR</span>
          </button>

          <button
            type="button"
            onClick={() => setLayer("wind")}
            className={`layer-btn ${layer === "wind" ? "active" : ""}`}
          >
            <div className="layer-btn-title">
              <Wind size={14} />
              <span>Wind Stream Vectors</span>
            </div>
            <span className="tag-pill">SFC</span>
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="satellite-bottom-bar glass">
        <div className="bar-stat font-mono">
          <Clock size={13} />
          <span>{timeStr}</span>
        </div>
        <div className="bar-separator" />
        <div className="bar-stat font-mono">
          <Sunrise size={13} /> {sunrise} IST &nbsp;|&nbsp; <Sunset size={13} /> {sunset} IST
        </div>
        <div className="bar-separator hidden-mobile" />
        <div className="bar-stat font-mono text-cyan hidden-mobile">
          <Compass size={13} />
          <span>Lock: {stationName} ({Number(lat).toFixed(4)}°, {Number(lon).toFixed(4)}°)</span>
        </div>
      </div>
    </div>
  );
}
