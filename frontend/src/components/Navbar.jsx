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
  MapPin,
  Search
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AtmosLogo from "./AtmosLogo";
import { translations } from "../utils/telemetryData";

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  weather,
  coords,
  onOpenLocationModal,
  lang = "en"
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: "home", label: t.observatory || "Observatory", icon: Activity },
    { id: "satellite", label: "Radar / Map", icon: Satellite },
    { id: "copilot", label: t.sunCopilot || "Sun Copilot", icon: Bot },
    { id: "agri", label: t.agri || "Agri Advisory", icon: Sprout },
    { id: "routes", label: t.routePlanner || "Route Planner", icon: Navigation },
    { id: "disaster", label: t.disaster || "Disaster Warning", icon: ShieldAlert },
    { id: "climate", label: t.climate || "Climate Intel", icon: History },
    { id: "alerts", label: t.alerts || "Alerts", icon: Bell, badge: true },
    { id: "history", label: t.history || "History", icon: Clock },
    { id: "settings", label: t.settings || "Settings", icon: Settings }
  ];

  const localityText = weather?.resolved_city || (coords?.lat ? `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E` : "Bengaluru, Karnataka");

  function handleTabClick(id) {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <>
      <header className="navbar atmos-main-navbar single-row-header">
        {/* Left: Brand + Active Locality stacked vertically in 2 compact lines */}
        <div className="nav-brand-locality-cluster">
          <div
            className="brand-mark-btn"
            onClick={() => handleTabClick("home")}
            title="Return to Observatory"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleTabClick("home")}
          >
            <AtmosLogo size={34} />
          </div>

          <div className="brand-locality-text-stack">
            <div
              className="brand-title"
              onClick={() => handleTabClick("home")}
              style={{ cursor: "pointer" }}
            >
              <span>ATMOS <b>COPILOT</b></span>
            </div>

            <button
              type="button"
              className="nav-locality-sub-btn"
              onClick={onOpenLocationModal}
              title="Click to search city or change GPS location"
            >
              <span className="gps-lock-pulse-dot" />
              <MapPin size={11} className="text-cyan flex-shrink-0" />
              <span className="nav-sub-city-name">{localityText}</span>
              <span className="change-hint-mini">CHANGE</span>
            </button>
          </div>
        </div>

        {/* Center: 10 Module Tabs in a sleek horizontal track */}
        <nav className="desktop-tab-nav" aria-label="Workspace Module Navigation">
          <div className="tabs-scroll-track">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-nav-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleTabClick(tab.id)}
                  title={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={14} />
                  <span className="tab-btn-title">{tab.label}</span>
                  {tab.badge && <span className="tab-alert-dot"></span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Theme Toggle, Operator Profile & Mobile Menu Trigger */}
        <div className="nav-actions">
          <ThemeToggle />

          {user && (
            <div className="operator-pill nav-operator-desktop">
              <span className="operator-icon-badge">
                <User size={13} />
              </span>
              <span className="operator-name-truncate">
                {user.name || user.email?.split("@")[0]}
              </span>
              <span className="operator-online-dot" title="Station Connected" />
              <button
                type="button"
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
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer glass fade-in">
          <div className="mobile-drawer-header">
            <button
              type="button"
              className="locality-pill mobile-locality mobile-drawer-locality-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLocationModal();
              }}
              title="Click to search city or change GPS location"
            >
              <span className="live-dot pulse"></span>
              <MapPin size={13} className="text-cyan flex-shrink-0" />
              <span className="mobile-locality-text">{localityText}</span>
              <span className="change-hint-mini">CHANGE</span>
            </button>
            <button
              type="button"
              className="close-drawer-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
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
                  type="button"
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
              <button
                type="button"
                className="btn btn-small full logout-action-btn"
                onClick={onLogout}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
