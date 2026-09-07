import React, { useState } from "react";
import { Bell, AlertCircle, CheckCircle2, CloudRain, Sun, Wind, Activity, Radio, Eye } from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";

export default function AlertsTab({ weather, envData, coords, lang = "en" }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const city = weather?.resolved_city || "Current Locality";
  const temp = weather?.current?.temp ?? 28;
  const precip = weather?.current?.precipitation ?? 0;
  const windSpeed = weather?.current?.wind ?? 14;
  const aqiVal = envData?.aqi?.value ?? 32;
  const uvVal = envData?.uv?.index ?? 4.8;

  const alerts = [
    {
      id: "rain",
      title: "Precipitation & Surface Water Risk Index",
      severity: precip > 20 ? "warning" : "nominal",
      icon: CloudRain,
      metric: `${precip}% rain probability`,
      description: precip > 20
        ? "Convective moisture cells detected in regional perimeter. Road surface slip risk elevated."
        : "Low precipitation probability. Surface transit corridors dry and safe."
    },
    {
      id: "uv",
      title: "Photochemical UV Solar Radiation Index",
      severity: uvVal > 6 ? "warning" : "nominal",
      icon: Sun,
      metric: `UV Index: ${uvVal} (${envData?.uv?.risk || "Moderate"})`,
      description: uvVal > 6
        ? `Burn window estimated under ${envData?.uv?.burnTime || "25 min"}. Recommend protective sunglasses and SPF 30+.`
        : "Solar radiation within safe biological threshold. Minimum sun protection needed."
    },
    {
      id: "wind",
      title: "Micro-Wind Shear & Low-Altitude Vector Advisory",
      severity: windSpeed > 30 ? "warning" : "nominal",
      icon: Wind,
      metric: `${windSpeed} km/h Surface Velocity`,
      description: windSpeed > 30
        ? "Gust vectors exceed 30 km/h. Unmanned Aerial Vehicles (drones) and high-profile vehicles exercise caution."
        : "Laminar surface vectors. Optimal condition for open-air operations and drone transit."
    },
    {
      id: "aqi",
      title: "Atmospheric Aerosol & Particulate Density",
      severity: aqiVal > 60 ? "warning" : "nominal",
      icon: Activity,
      metric: `AQI ${aqiVal} (${envData?.aqi?.status || "Good"})`,
      description: aqiVal > 60
        ? "PM2.5 particulate concentration elevated. Sensitive demographics should limit intense outdoor cardio."
        : "Atmospheric purity is optimal. Clean air index suitable for unrestricted outdoor activities."
    }
  ];

  return (
    <div className="tab-pane active fade-in">
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <Bell className="inline-icon text-cyan" size={24} />
            Meteorological Advisories & Threshold Alerts
          </h2>
          <p className="section-subtitle">
            Automated sensor surveillance, anomaly notifications, and micro-climate advisories for {city}
          </p>
        </div>

        <button
          className="btn btn-small ghost"
          onClick={() => setAcknowledged(!acknowledged)}
        >
          <CheckCircle2 size={16} />
          {acknowledged ? "Alerts Acknowledged" : "Acknowledge All"}
        </button>
      </div>

      {/* Sensor Station Lock Telemetry Banner */}
      <div className="sensor-lock-banner glass">
        <div className="sensor-lock-item">
          <Radio size={18} className="text-cyan pulse" />
          <div>
            <div className="sensor-lock-title">Telemetry Sensor Lock</div>
            <div className="sensor-lock-val">Open-Meteo V1 API Active (60s Synoptic Sync)</div>
          </div>
        </div>

        <div className="sensor-lock-item">
          <Eye size={18} className="text-cyan" />
          <div>
            <div className="sensor-lock-title">Hardware GPS Resolution</div>
            <div className="sensor-lock-val">
              {coords?.lat ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring coordinates..."}
            </div>
          </div>
        </div>

        <div className="sensor-lock-item">
          <CheckCircle2 size={18} className="text-cyan" />
          <div>
            <div className="sensor-lock-title">System Advisory Status</div>
            <div className="sensor-lock-val">{acknowledged ? "Surveillance Logged (User Verified)" : "Live Continuous Watch"}</div>
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="alerts-feed-grid" style={{ marginTop: "1.5rem" }}>
        {alerts.map((alert) => {
          const Icon = alert.icon;
          const isWarning = alert.severity === "warning";

          return (
            <div
              key={alert.id}
              className={`glass alert-card ${isWarning ? "alert-warning" : "alert-nominal"}`}
            >
              <div className="alert-card-top">
                <div className="alert-badge-wrap">
                  <div className={`alert-icon-box ${isWarning ? "bg-amber-dim" : "bg-cyan-dim"}`}>
                    <Icon size={20} className={isWarning ? "text-amber" : "text-cyan"} />
                  </div>
                  <div>
                    <h4 className="alert-title">{alert.title}</h4>
                    <span className="alert-metric">{formatDigits(alert.metric, lang)}</span>
                  </div>
                </div>

                <span className={`status-badge-mini ${isWarning ? "badge-amber" : "badge-cyan"}`}>
                  {isWarning ? "Advisory Active" : "Nominal State"}
                </span>
              </div>

              <p className="alert-desc">{alert.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
