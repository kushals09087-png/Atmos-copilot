import React, { useState } from "react";
import {
  Activity,
  Satellite,
  Bot,
  Sprout,
  Navigation,
  ShieldAlert,
  History,
  Bell,
  Clock,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  MapPin
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { translations } from "../utils/telemetryData";

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  weather,
  coords,
  lang = "en"
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: "home", label: t.observatory || "Observatory", icon: Activity },
    { id: "satellite", label: t.satellite || "Satellite", icon: Satellite },
    { id: "copilot", label: t.sunCopilot || "Sun Copilot", icon: Bot },
    { id: "agri", label: t.agri || "Agri Advisory", icon: Sprout },
    { id: "routes", label: t.routePlanner || "Route Planner", icon: Navigation },
    { id: "disaster", label: t.disaster || "Disaster Warning", icon: ShieldAlert },
    { id: "climate", label: t.climate || "Climate Intel", icon: History },
    { id: "alerts", label: t.alerts || "Alerts", icon: Bell, badge: true },
    { id: "history", label: t.history || "History", icon: Clock },
    { id: "settings", label: t.settings || "Settings", icon: Settings }
  ];

  const localityText = weather?.resolved_city || "Bengaluru, Karnataka";
  const coordsSnippet = coords?.lat
    ? `(${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E)`
    : "";

  function handleTabClick(id) {
    setActiveTab(id);
    setMobileMenuOpen(false);
  }

  return (
    <>
      <header className="navbar atmos-main-navbar">
        <div className="nav-left-cluster">
          {/* Brand Logo */}
          <div className="brand" onClick={() => handleTabClick("home")} style={{ cursor: "pointer" }}>
            <span className="brand-mark">☀️</span>
            <span>ATMOS <b>COPILOT</b></span>
          </div>

          {/* Locality & Hardware GPS pill */}
          <div className="locality-pill" title="Hardware GPS Station Resolution">
            <span className="live-dot pulse"></span>
            <MapPin size={13} className="text-cyan" />
            <span className="locality-name">{localityText.split(",")[0]}</span>
            {coordsSnippet && <span className="coords-text">{coordsSnippet}</span>}
          </div>
        </div>

        {/* Desktop 10-Tab Navigation */}
        <nav className="desktop-tab-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`tab-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge && <span className="tab-alert-dot"></span>}
              </button>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="nav-actions">
          <ThemeToggle />

          {/* Operator Profile Badge */}
          {user && (
            <div className="operator-pill">
              <span className="operator-icon-badge">
                <User size={13} />
              </span>
              <span className="operator-name-truncate">
                {user.name || user.email?.split("@")[0]}
              </span>
              <button
                className="logout-icon-btn"
                onClick={onLogout}
                title="Log out and return to sign in"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer glass fade-in">
          <div className="mobile-drawer-header">
            <div className="locality-pill mobile-locality">
              <span className="live-dot"></span>
              <span>{localityText}</span>
            </div>
            <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="mobile-tabs-grid">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`mobile-tab-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.badge && <span className="mobile-tab-dot"></span>}
                </button>
              );
            })}
          </div>

          {user && (
            <div className="mobile-drawer-footer">
              <div className="mobile-operator-info">
                <User size={16} className="text-cyan" />
                <span>{user.name || user.email}</span>
              </div>
              <button className="btn btn-small full logout-action-btn" onClick={onLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
