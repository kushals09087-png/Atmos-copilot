import React, { useState, useEffect } from "react";
import { History as HistoryIcon, Trash2, Clock, MapPin, CheckCircle, Search, Terminal } from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";

export default function HistoryTab({ weather, coords, lang = "en" }) {
  const [historyList, setHistoryList] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    loadHistory();
    const storedUser = localStorage.getItem("atmos_user");
    if (storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser));
      } catch (e) {
        setSessionUser(null);
      }
    }
  }, []);

  function loadHistory() {
    try {
      const raw = localStorage.getItem("atmos_search_history");
      if (raw) {
        setHistoryList(JSON.parse(raw));
      } else {
        // Provide initial default history records
        const defaults = [
          {
            id: 1,
            query: "Surface rain probability and squall forecast",
            location: weather?.resolved_city || "Bengaluru, Karnataka",
            time: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            type: "AI Synthesis"
          },
          {
            id: 2,
            query: "Crop advisory for Finger Millet (Ragi) under current soil moisture",
            location: "Mandya, Karnataka",
            time: new Date(Date.now() - 1000 * 60 * 65).toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            type: "Agro Intelligence"
          },
          {
            id: 3,
            query: "Weather safe route analysis to Mysuru Palace corridor",
            location: "Bengaluru -> Mysuru Highway",
            time: new Date(Date.now() - 1000 * 60 * 140).toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            type: "Route Planner"
          }
        ];
        setHistoryList(defaults);
        localStorage.setItem("atmos_search_history", JSON.stringify(defaults));
      }
    } catch {
      setHistoryList([]);
    }
  }

  function handleClearHistory() {
    localStorage.removeItem("atmos_search_history");
    setHistoryList([]);
  }

  return (
    <div className="tab-pane active fade-in">
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <HistoryIcon className="inline-icon text-cyan" size={24} />
            Telemetry & Query History Log
          </h2>
          <p className="section-subtitle">
            Audit trail of operator queries, geocoded station locks, and Copilot intelligence responses
          </p>
        </div>

        {historyList.length > 0 && (
          <button className="btn btn-small ghost" onClick={handleClearHistory}>
            <Trash2 size={16} /> Clear Log
          </button>
        )}
      </div>

      {/* Operator Session Metadata Card */}
      <div className="glass card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header-clean">
          <div className="flex-row gap-sm">
            <Terminal size={18} className="text-cyan" />
            <h3 className="subheading">Active Operator Session Audit</h3>
          </div>
          <span className="badge-cyan">Hardware Lock: OK</span>
        </div>

        <div className="telemetry-grid three-col" style={{ marginTop: "1rem" }}>
          <div className="session-meta-item">
            <span className="meta-lbl">Authorized Operator</span>
            <span className="meta-val">{sessionUser?.name || "Meteorological Analyst"}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">Station Node Lock</span>
            <span className="meta-val">{coords?.lat ? `${coords.lat.toFixed(3)}°N, ${coords.lon.toFixed(3)}°E` : "GPS Locked"}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-lbl">Session Origin</span>
            <span className="meta-val">{sessionUser?.loginTime || new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Query History Log Table */}
      <div className="glass card">
        <div className="card-header-clean">
          <h3 className="subheading">Dispatched Intelligence Queries</h3>
          <span className="badge-ghost">{formatDigits(historyList.length, lang)} Records Stored</span>
        </div>

        {historyList.length === 0 ? (
          <div className="empty-state-box">
            <Search size={32} className="text-secondary" />
            <p>No queries logged in the local session yet.</p>
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time / Date</th>
                  <th>Intelligence Query</th>
                  <th>Target Locality</th>
                  <th>Module</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-sm text-secondary">
                      <div className="flex-row gap-xs">
                        <Clock size={13} /> {formatDigits(item.time, lang)}
                      </div>
                      <small>{item.date}</small>
                    </td>
                    <td>
                      <strong>{item.query}</strong>
                    </td>
                    <td className="text-sm">
                      <div className="flex-row gap-xs">
                        <MapPin size={13} className="text-cyan" /> {item.location}
                      </div>
                    </td>
                    <td>
                      <span className="badge-ghost">{item.type || "Copilot Query"}</span>
                    </td>
                    <td>
                      <span className="status-badge-inline">
                        <CheckCircle size={13} className="text-cyan" /> Processed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
