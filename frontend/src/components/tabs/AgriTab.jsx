import React, { useState, useEffect } from "react";
import { Sprout, Search, Sparkles, CheckCircle2, RotateCw } from "lucide-react";
import { agricultureDistricts, askAiAssistant } from "../../utils/telemetryData";

export default function AgriTab({ coords, weather }) {
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru");
  const [searchQuery, setSearchQuery] = useState("");
  const [advisoryText, setAdvisoryText] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const districtData =
    agricultureDistricts.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase()) || {
      name: selectedDistrict,
      crops: ["Paddy", "Millets", "Pulses", "Seasonal Vegetables"],
      soil: "Loamy / Mixed Sandy Soil",
      rainfall: "750 - 900 mm"
    };

  const synthesizeAdvisory = async targetArea => {
    setIsSynthesizing(true);
    try {
      const prompt = `Provide practical agricultural guidance for ${targetArea} during current seasonal weather. List the top 3 best-suited crops, key soil considerations, and irrigation advice.`;
      const reply = await askAiAssistant(prompt, coords?.lat, coords?.lon, weather);
      setAdvisoryText(reply);
    } catch {
      setAdvisoryText(
        `Soil moisture and seasonal climate parameters in ${targetArea} are favorable for cultivation. Prioritize climate-resilient finger millets (Ragi) and maintain drip irrigation protocols during morning hours to prevent excessive evapotranspiration.`
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    synthesizeAdvisory(selectedDistrict);
  }, [selectedDistrict]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedDistrict(searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <div className="tab-container">
      {/* Header Banner */}
      <div className="module-banner glass">
        <div className="banner-top-row">
          <div>
            <div className="badge-pill emerald">
              <Sprout size={15} />
              <span>WEATHER-SMART AGRICULTURE INTELLIGENCE</span>
            </div>
            <h2>Crop Suitability & Agro-Advisory</h2>
            <p>Hyper-local soil and meteorological synthesis for optimized crop yield.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="district-search-form">
            <div className="search-field glass">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search area (e.g. Hassan, Davanagere)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-small">
              Analyze
            </button>
          </form>
        </div>

        {/* District Quick Selectors */}
        <div className="district-presets-grid">
          {agricultureDistricts.map(d => {
            const isSelected = selectedDistrict.toLowerCase() === d.name.toLowerCase();
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => setSelectedDistrict(d.name)}
                className={`district-card glass ${isSelected ? "selected-district" : ""}`}
              >
                <div className="district-name">{d.name}</div>
                <div className="district-meta">Soil: {d.soil}</div>
                <div className="district-rain text-cyan font-mono">Rainfall: ~{d.rainfall}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Crops & AI Guidance */}
      <div className="agri-layout-grid">
        {/* High-Yield Regional Crops */}
        <div className="agri-panel glass">
          <div className="panel-title-row">
            <span className="eyebrow">REGIONAL PROFILE</span>
            <h3>High-Yield Crops: {districtData.name}</h3>
          </div>

          <div className="crop-list">
            {districtData.crops.map((crop, idx) => (
              <div key={idx} className="crop-row glass">
                <div className="crop-info">
                  <CheckCircle2 size={16} className="crop-check-icon text-emerald" />
                  <span className="crop-name">{crop}</span>
                </div>
                <span className="crop-status-tag">Optimal</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agro Intelligence Synthesis */}
        <div className="agri-panel glass">
          <div className="panel-title-row">
            <div className="flex-row gap-2 text-cyan">
              <Sparkles size={16} />
              <span className="eyebrow">INTELLIGENCE SYNTHESIS</span>
            </div>
            <span className="target-district-label font-mono">District: {districtData.name}</span>
          </div>

          {isSynthesizing ? (
            <div className="loading-state">
              <RotateCw size={24} className="spin-icon" />
              <span>Querying agronomic crop models and meteorological baseline...</span>
            </div>
          ) : (
            <div className="advisory-text-block">
              {advisoryText ||
                "Synthesizing crop recommendations based on current relative humidity and ground moisture."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
