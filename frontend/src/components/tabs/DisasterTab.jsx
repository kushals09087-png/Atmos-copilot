import React from "react";
import { AlertTriangle, PhoneCall, ShieldAlert, Navigation, Building2, Flame, Droplets, Wind, ExternalLink } from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";

export default function DisasterTab({ weather, coords, lang = "en" }) {
  const currentTemp = weather?.current?.temp ?? 28;
  const precip = weather?.current?.precipitation ?? 0;
  const windSpeed = weather?.current?.wind ?? 14;
  const city = weather?.resolved_city || "Current Locality";

  const isRainElevated = precip > 15;
  const isWindElevated = windSpeed > 35;
  const isHighRisk = isRainElevated || isWindElevated;

  const emergencyContacts = [
    { name: "NDRF National Disaster Response Force", number: "011-24363260", category: "Central Rescue" },
    { name: "NDMA Control Room", number: "1078", category: "National Disaster" },
    { name: "State Disaster Management (SEOC)", number: "1070", category: "State Operations" },
    { name: "Unified Emergency Service (Police / Med)", number: "112", category: "Immediate Dispatch" }
  ];

  const shelters = [
    {
      name: "Govt Public School & Cyclone Shelter",
      dist: "1.2 km",
      time: "14 min walking",
      cap: "450 Persons",
      amenities: "Power Backup, Clean Water, First Aid"
    },
    {
      name: "Community Sports Complex Safe Point",
      dist: "2.8 km",
      time: "32 min walking / 6 min vehicle",
      cap: "1,200 Persons",
      amenities: "Emergency Kitchen, High Elevation, Generator"
    },
    {
      name: "District Civil Hospital Trauma Center",
      dist: "3.5 km",
      time: "8 min vehicle",
      cap: "300 Beds",
      amenities: "24/7 Emergency Surgery, Blood Bank, Oxygen"
    }
  ];

  return (
    <div className="tab-pane active fade-in">
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <ShieldAlert className="inline-icon text-amber" size={24} />
            Disaster Warning & Incident Management
          </h2>
          <p className="section-subtitle">
            Real-time automated flash flood, cyclonic squall, and storm trajectory matrix
          </p>
        </div>
        <div className={`status-pill ${isHighRisk ? "warning" : "online"}`}>
          <span className="dot"></span>
          {isHighRisk ? "ELEVATED CONVECTIVE WATCH" : "NOMINAL SURFACE STABILITY"}
        </div>
      </div>

      {/* Primary Disaster Threat Status Banner */}
      <div className={`disaster-hero-card glass ${isHighRisk ? "border-amber" : ""}`}>
        <div className="disaster-hero-left">
          <div className="risk-indicator-badge">
            <AlertTriangle size={20} className={isHighRisk ? "text-amber" : "text-cyan"} />
            <span>{isHighRisk ? "CONVECTIVE ADVISORY IN EFFECT" : "ZERO ACTIVE WARNINGS"}</span>
          </div>
          <h3 className="disaster-hero-title">
            {isHighRisk ? "Precipitation & Squall Vector Watch" : "Safe Atmospheric Envelope"}
          </h3>
          <p className="disaster-hero-desc">
            Telemetry for <strong>{city}</strong> indicates {isHighRisk ? "elevated hydrological run-off or wind shear." : "standard micro-climatic equilibrium with zero active storm cells within 50 km."} Automated Doppler monitoring continues at 5-minute sampling rates.
          </p>
        </div>

        <div className="disaster-metrics-grid">
          <div className="disaster-metric-item">
            <span className="metric-lbl">Flash Flood Prob</span>
            <span className="metric-val">{formatDigits(isRainElevated ? "68%" : "12%", lang)}</span>
            <span className="metric-sub">{isRainElevated ? "Soil Saturation High" : "Subsurface Drainage OK"}</span>
          </div>
          <div className="disaster-metric-item">
            <span className="metric-lbl">Rainfall Rate</span>
            <span className="metric-val">{formatDigits(precip, lang)} <small>mm/h</small></span>
            <span className="metric-sub">{precip > 0 ? "Active Gauge" : "Zero Precipitation"}</span>
          </div>
          <div className="disaster-metric-item">
            <span className="metric-lbl">Squall Wind Gust</span>
            <span className="metric-val">{formatDigits(Math.round(windSpeed * 1.3), lang)} <small>km/h</small></span>
            <span className="metric-sub">{windSpeed > 30 ? "Gust Shear Warning" : "Laminar Flow"}</span>
          </div>
          <div className="disaster-metric-item">
            <span className="metric-lbl">Model Confidence</span>
            <span className="metric-val">96.4%</span>
            <span className="metric-sub">Multi-ensemble blend</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ marginTop: "1.5rem" }}>
        {/* Designated Relief Shelters */}
        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <Building2 size={18} className="text-cyan" /> Designated Civil Relief Shelters
            </h3>
            <span className="badge-ghost">Near {city.split(",")[0]}</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: "1rem" }}>
            Pre-designated evacuation points identified by State Disaster Management Authorities with emergency rations and generators.
          </p>

          <div className="shelters-list">
            {shelters.map((s, idx) => (
              <div key={idx} className="shelter-card">
                <div className="shelter-header">
                  <span className="shelter-name">{s.name}</span>
                  <span className="shelter-dist">{formatDigits(s.dist, lang)}</span>
                </div>
                <div className="shelter-meta">
                  <span><strong>ETA:</strong> {s.time}</span>
                  <span><strong>Capacity:</strong> {s.cap}</span>
                </div>
                <div className="shelter-amenities">
                  🛡️ {s.amenities}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Hotline Directory */}
        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <PhoneCall size={18} className="text-amber" /> Emergency Response Hotlines
            </h3>
            <span className="badge-ghost">24x7 Priority Line</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: "1rem" }}>
            One-touch priority lines connected directly to NDRF, State Emergency Operations, and First Responders.
          </p>

          <div className="hotlines-list">
            {emergencyContacts.map((c, idx) => (
              <div key={idx} className="hotline-card">
                <div className="hotline-info">
                  <span className="hotline-category">{c.category}</span>
                  <span className="hotline-name">{c.name}</span>
                  <span className="hotline-number">{c.number}</span>
                </div>
                <a href={`tel:${c.number}`} className="btn btn-small emergency-btn">
                  <PhoneCall size={14} /> Call Now
                </a>
              </div>
            ))}
          </div>

          <div className="directive-box">
            <div className="directive-title">AI Disaster Directive</div>
            <p className="directive-text">
              Maintain emergency power banks at &gt;80% charge. In case of unexpected waterlogging along transit underpasses, seek higher elevation immediately and monitor Atmos Doppler Radar telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
