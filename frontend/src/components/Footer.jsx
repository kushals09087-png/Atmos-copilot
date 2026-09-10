import React from "react";
import { Heart, ExternalLink } from "lucide-react";
import AtmosLogo from "./AtmosLogo";

export default function Footer({ onNavigateTab }) {
  const currentYear = new Date().getFullYear();

  function handleTabNav(tabId) {
    if (onNavigateTab) {
      onNavigateTab(tabId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <footer className="atmos-global-footer glass">
      <div className="footer-top-accent-line" />

      <div className="footer-content-container">
        {/* Left: Brand Lockup & Mission */}
        <div className="footer-brand-section">
          <div className="footer-brand-header">
            <AtmosLogo size={30} />
            <span className="footer-brand-title">
              ATMOS <b>COPILOT</b>
            </span>
            <span className="footer-version-tag">v3.8</span>
          </div>
          <p className="footer-tagline">
            Next-generation synoptic meteorological observatory, geospatial Doppler radar telemetry, and AI agriculture decision support.
          </p>
          <div className="footer-status-indicator">
            <span className="footer-pulse-dot" />
            <span>Station Core Operational &bull; 10 Regional Nodes Synchronized</span>
          </div>
        </div>

        {/* Center/Right: Quick Telemetry Links & Data Engines */}
        <div className="footer-nav-columns">
          <div className="footer-col">
            <h4 className="footer-col-title">Telemetry Modules</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => handleTabNav("home")} className="footer-link-btn">
                  Observatory HUD
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleTabNav("satellite")} className="footer-link-btn">
                  Doppler Radar & Map
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleTabNav("routes")} className="footer-link-btn">
                  Highway Route Corridors
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleTabNav("agri")} className="footer-link-btn">
                  Agro Crop Advisories
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Data Engines & Layers</h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="https://www.windy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                  title="Visit Windy.com"
                >
                  <span>Windy.com HD Layers</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <span className="footer-static-item">Open-Meteo Synoptic Grid</span>
              </li>
              <li>
                <span className="footer-static-item">Doppler Rain Reflectivity</span>
              </li>
              <li>
                <span className="footer-static-item">Hardware GPS Telemetry</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & "Made by Team NEXUS with ❤️" */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner">
          <div className="footer-copyright-text">
            &copy; {currentYear} ATMOS COPILOT. All rights reserved.
          </div>

          <div className="footer-credit-badge">
            <span>Made by <b className="nexus-gradient-text">Team NEXUS</b> with</span>
            <Heart size={15} className="footer-heart-icon text-rose" fill="#f43f5e" />
          </div>
        </div>
      </div>
    </footer>
  );
}
