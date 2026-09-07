import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import ObservatoryTab from "./components/tabs/ObservatoryTab";
import SatelliteTab from "./components/tabs/SatelliteTab";
import SunCopilotTab from "./components/tabs/SunCopilotTab";
import AgriTab from "./components/tabs/AgriTab";
import RoutesTab from "./components/tabs/RoutesTab";
import DisasterTab from "./components/tabs/DisasterTab";
import ClimateTab from "./components/tabs/ClimateTab";
import AlertsTab from "./components/tabs/AlertsTab";
import HistoryTab from "./components/tabs/HistoryTab";
import SettingsTab from "./components/tabs/SettingsTab";
import BackgroundVideo from "./components/BackgroundVideo";
import {
  fetchTelemetryData,
  fetchEnvironmentalData,
  reverseGeocode
} from "./utils/telemetryData";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("atmos_lang") || "en");
  const [bgTheme, setBgTheme] = useState(() => localStorage.getItem("atmos_bg_theme") || "mountains");
  const [coords, setCoords] = useState({ lat: 12.9716, lon: 77.5946 });
  const [weather, setWeather] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  // Check authentication status
  useEffect(() => {
    function verifyAuth() {
      const stored = localStorage.getItem("atmos_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          if (parsed.coords?.lat && parsed.coords?.lon) {
            setCoords(parsed.coords);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    verifyAuth();
    window.addEventListener("storage", verifyAuth);
    window.addEventListener("atmos-auth-change", verifyAuth);
    return () => {
      window.removeEventListener("storage", verifyAuth);
      window.removeEventListener("atmos-auth-change", verifyAuth);
    };
  }, []);

  // Sync telemetry when coords change or user authenticates
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadData() {
      setLoadingTelemetry(true);
      try {
        const locality = await reverseGeocode(coords.lat, coords.lon);
        const [wData, eData] = await Promise.all([
          fetchTelemetryData(coords.lat, coords.lon, locality),
          fetchEnvironmentalData(coords.lat, coords.lon)
        ]);
        if (isMounted) {
          setWeather(wData);
          setEnvData(eData);
        }
      } catch (err) {
        console.warn("Telemetry synchronization error:", err);
      } finally {
        if (isMounted) setLoadingTelemetry(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // refresh every 5 min
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, coords.lat, coords.lon]);

  function handleLoginSuccess(authenticatedUser, acquiredCoords) {
    setUser(authenticatedUser);
    if (acquiredCoords) {
      setCoords(acquiredCoords);
    }
  }

  function handleLogout() {
    localStorage.removeItem("atmos_user");
    localStorage.removeItem("atmos_token");
    setUser(null);
    setActiveTab("home");
    window.dispatchEvent(new Event("atmos-auth-change"));
  }

  async function handleRefreshGps() {
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            enableHighAccuracy: true
          });
        });
        const newCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(newCoords);
        if (user) {
          const updatedUser = { ...user, coords: newCoords };
          setUser(updatedUser);
          localStorage.setItem("atmos_user", JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.warn("GPS refresh error:", e);
      }
    }
  }

  // Login-First Gate: Unauthenticated users are shown the login page first
  if (!user) {
    return (
      <div className="app-shell-root">
        <BackgroundVideo
          currentTheme={bgTheme}
          onThemeChange={setBgTheme}
          weather={weather}
        />
        <LoginPage onAuthorized={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Dynamic Video Background Layer */}
      <BackgroundVideo
        currentTheme={bgTheme}
        onThemeChange={setBgTheme}
        weather={weather}
      />

      {/* 10-Tab Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        weather={weather}
        coords={coords}
        lang={lang}
      />

      {/* Main Content Area */}
      <main className="main-content-layout">
        <div className="tab-viewport-container">
          {activeTab === "home" && (
            <ObservatoryTab
              weather={weather}
              envData={envData}
              coords={coords}
              lang={lang}
              onRefreshGps={handleRefreshGps}
              loading={loadingTelemetry}
            />
          )}

          {activeTab === "satellite" && (
            <SatelliteTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "copilot" && (
            <SunCopilotTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "agri" && (
            <AgriTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "routes" && (
            <RoutesTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "disaster" && (
            <DisasterTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "climate" && (
            <ClimateTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "alerts" && (
            <AlertsTab
              weather={weather}
              envData={envData}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              weather={weather}
              coords={coords}
              lang={lang}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              lang={lang}
              setLang={setLang}
              weather={weather}
              coords={coords}
              bgTheme={bgTheme}
              setBgTheme={setBgTheme}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>
    </div>
  );
}
