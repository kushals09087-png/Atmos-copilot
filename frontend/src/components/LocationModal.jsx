import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Radio, X, Clock, Check, Sparkles, Globe } from "lucide-react";
import { reverseGeocode } from "../utils/telemetryData";

export const POPULAR_LOCATIONS = [
  { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946, tag: "HQ Station" },
  { name: "Mysuru, Karnataka", lat: 12.2958, lon: 76.6394, tag: "Heritage Hub" },
  { name: "Mandya, Karnataka", lat: 12.5245, lon: 76.8958, tag: "Agri Zone" },
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, tag: "Coastal Hub" },
  { name: "New Delhi, NCR", lat: 28.6139, lon: 77.2090, tag: "Capital Node" },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, tag: "Bay Sector" },
  { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867, tag: "Deccan Plateau" },
  { name: "London, United Kingdom", lat: 51.5074, lon: -0.1278, tag: "Global" },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060, tag: "Global" },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, tag: "Global" },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, tag: "Gulf Sector" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, tag: "Equatorial" }
];

export default function LocationModal({ isOpen, onClose, onSelectLocation, currentCoords, currentCity }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("atmos_recent_locs") || "[]");
    } catch {
      return [];
    }
  });
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setGpsMessage("");
    }
  }, [isOpen]);

  // Live search using OpenStreetMap Nominatim
  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en" }, signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.warn("Location search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleSelect(lat, lon, label) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    // Save to recents
    const newEntry = { name: label, lat: parsedLat, lon: parsedLon };
    const updatedRecents = [newEntry, ...recentLocations.filter(r => r.name !== label)].slice(0, 5);
    setRecentLocations(updatedRecents);
    localStorage.setItem("atmos_recent_locs", JSON.stringify(updatedRecents));

    if (onSelectLocation) {
      onSelectLocation(parsedLat, parsedLon, label);
    }
    onClose();
  }

  // Acquire hardware GPS
  async function handleAcquireGps() {
    if (!("geolocation" in navigator)) {
      setGpsMessage("Geolocation not supported by browser");
      return;
    }

    setGpsAcquiring(true);
    setGpsMessage("Locking hardware satellites...");

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ? `±${Math.round(pos.coords.accuracy)}m` : "";

      setGpsMessage(`Satellite fix locked (${accuracy})! Synchronizing...`);

      // Reverse geocode using unified Google-level zoning node resolution
      try {
        const label = await reverseGeocode(lat, lon);
        if (label) {
          setTimeout(() => handleSelect(lat, lon, label), 350);
          return;
        }
      } catch (geoErr) {
        console.warn("Location modal reverse geocode fallback:", geoErr);
      }

      setTimeout(() => handleSelect(lat, lon, `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E Station`), 350);
    } catch (err) {
      console.warn("GPS acquire error:", err);
      setGpsMessage("GPS permission denied or timed out. Defaulting to station coordinates.");
      setTimeout(() => setGpsAcquiring(false), 2000);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="location-modal-card glass" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Globe size={18} className="text-cyan" />
            </div>
            <div>
              <h2 className="modal-title">Geospatial Station & GPS Search</h2>
              <p className="modal-subtitle">Search any global city, regional district, or lock hardware GPS</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="modal-search-bar">
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            autoFocus
            placeholder="Type city, district, town, or coordinates..."
            value={query}
            onChange={handleQueryChange}
          />
          {loading && <Radio size={16} className="spin text-cyan" />}
          {query && !loading && (
            <button type="button" className="clear-search-btn" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* GPS Instant Locate Button */}
        <div className="gps-action-bar">
          <button
            type="button"
            className={`btn full gps-locate-btn ${gpsAcquiring ? "acquiring" : ""}`}
            onClick={handleAcquireGps}
            disabled={gpsAcquiring}
          >
            <Navigation size={16} className={gpsAcquiring ? "spin" : "pulse text-cyan"} />
            <span>{gpsAcquiring ? "Triangulating Satellites..." : "Detect My Location (Hardware GPS)"}</span>
          </button>
          {gpsMessage && <div className="gps-feedback-msg">{gpsMessage}</div>}
        </div>

        {/* Search Results List */}
        {results.length > 0 && (
          <div className="search-results-section">
            <div className="section-meta-lbl">Search Matches</div>
            <div className="search-results-list">
              {results.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="search-result-row"
                  onClick={() => handleSelect(item.lat, item.lon, item.display_name.split(",").slice(0, 2).join(","))}
                >
                  <MapPin size={16} className="text-cyan flex-shrink" />
                  <div className="result-text-box">
                    <span className="result-main-name">
                      {item.display_name.split(",")[0]}
                    </span>
                    <span className="result-sub-name">
                      {item.display_name.split(",").slice(1, 4).join(",")}
                    </span>
                  </div>
                  <span className="result-coords font-mono">
                    {parseFloat(item.lat).toFixed(2)}°, {parseFloat(item.lon).toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Locations */}
        {recentLocations.length > 0 && !query && (
          <div className="recent-locations-section">
            <div className="section-meta-lbl">
              <Clock size={12} /> Recent Stations
            </div>
            <div className="recent-pills-row">
              {recentLocations.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="recent-pill-btn"
                  onClick={() => handleSelect(r.lat, r.lon, r.name)}
                >
                  <MapPin size={12} className="text-cyan" />
                  <span>{r.name.split(",")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preset Regional & Global Hubs */}
        {!query && (
          <div className="popular-locations-section">
            <div className="section-meta-lbl">
              <Sparkles size={12} /> Quick Presets & Major Hubs
            </div>
            <div className="popular-grid">
              {POPULAR_LOCATIONS.map((loc, idx) => {
                const isCurrent =
                  Math.abs(currentCoords.lat - loc.lat) < 0.05 &&
                  Math.abs(currentCoords.lon - loc.lon) < 0.05;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`popular-tile-btn ${isCurrent ? "active-hub" : ""}`}
                    onClick={() => handleSelect(loc.lat, loc.lon, loc.name)}
                  >
                    <div className="popular-tile-top">
                      <span className="popular-name">{loc.name.split(",")[0]}</span>
                      {isCurrent ? (
                        <span className="hub-badge current">Current</span>
                      ) : (
                        <span className="hub-badge">{loc.tag}</span>
                      )}
                    </div>
                    <span className="popular-sub">{loc.name.split(",")[1] || "Global Station"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
