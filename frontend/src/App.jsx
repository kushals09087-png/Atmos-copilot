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
import LocationModal from "./components/LocationModal";
import TabErrorBoundary from "./components/TabErrorBoundary";
import Footer from "./components/Footer";
import {
  fetchTelemetryData,
  fetchEnvironmentalData,
  reverseGeocode,
  acquireUserGeolocation
} from "./utils/telemetryData";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("atmos_lang") || "en");
  const [bgTheme, setBgTheme] = useState(() => {
    const saved = localStorage.getItem("atmos_bg_theme");
    return saved && saved !== "mountains" ? saved : "auto";
  });
  const [coords, setCoords] = useState({ lat: 12.9716, lon: 77.5946 });
  const [weather, setWeather] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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
          if (parsed.locality) {
            setWeather(prev => prev ? { ...prev, resolved_city: parsed.locality } : { resolved_city: parsed.locality });
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

  // Keep scroll position at top whenever active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  function handleLoginSuccess(authenticatedUser, acquiredCoords, acquiredLocality) {
    setUser(authenticatedUser);
    if (acquiredCoords) {
      setCoords(acquiredCoords);
    }
    if (acquiredLocality) {
      setWeather(prev => prev ? { ...prev, resolved_city: acquiredLocality } : { resolved_city: acquiredLocality });
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
    setLoadingTelemetry(true);
    try {
      const geo = await acquireUserGeolocation();
      const newCoords = {
        lat: geo.lat,
        lon: geo.lon,
        accuracy: geo.accuracy,
        isExact: geo.isExact,
        source: geo.source
      };

      let newLocality = geo.formatted || geo.city;
      try {
        const rev = await reverseGeocode(newCoords.lat, newCoords.lon);
        if (rev && !rev.startsWith("Coordinates:")) {
          newLocality = rev;
        }
      } catch (geoErr) {
        console.warn("Reverse geocode warning:", geoErr);
      }

      if (!newLocality) {
        newLocality = `${newCoords.lat.toFixed(5)}°N, ${newCoords.lon.toFixed(5)}°E`;
      }

      setCoords(newCoords);
      setWeather(prev => prev ? { ...prev, resolved_city: newLocality } : { resolved_city: newLocality });

      // Immediate telemetry refresh
      try {
        const [wData, eData] = await Promise.all([
          fetchTelemetryData(newCoords.lat, newCoords.lon, newLocality),
          fetchEnvironmentalData(newCoords.lat, newCoords.lon)
        ]);
        if (wData) setWeather(wData);
        if (eData) setEnvData(eData);
      } catch (fetchErr) {
        console.warn("Telemetry refresh error:", fetchErr);
      }

      if (user) {
        const updatedUser = { ...user, coords: newCoords, locality: newLocality };
        setUser(updatedUser);
        localStorage.setItem("atmos_user", JSON.stringify(updatedUser));
      }

      return {
        coords: newCoords,
        locality: newLocality,
        source: geo.source,
        isExact: geo.isExact,
        accuracy: geo.accuracy,
        permissionDenied: geo.permissionDenied
      };
    } catch (e) {
      console.warn("GPS refresh error:", e);
      return null;
    } finally {
      setLoadingTelemetry(false);
    }
  }

  async function handleSelectLocation(newLat, newLon, label, accuracy = null) {
    const newCoords = {
      lat: parseFloat(newLat),
      lon: parseFloat(newLon),
      accuracy,
      isExact: true
    };
    setCoords(newCoords);
    let resolvedLabel = label;
    if (!resolvedLabel) {
      resolvedLabel = await reverseGeocode(newLat, newLon);
    }
    if (resolvedLabel) {
      setWeather(prev => prev ? { ...prev, resolved_city: resolvedLabel } : { resolved_city: resolvedLabel });
    }
    if (user) {
      const updatedUser = { ...user, coords: newCoords, locality: resolvedLabel || user.locality };
      setUser(updatedUser);
      localStorage.setItem("atmos_user", JSON.stringify(updatedUser));
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

      {/* Global Location & GPS Search Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        currentCoords={coords}
        currentCity={weather?.resolved_city}
      />

      {/* 10-Tab Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        weather={weather}
        coords={coords}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        lang={lang}
      />

      {/* Main Content Area */}
      <main className="main-content-layout">
        <TabErrorBoundary key={activeTab}>
          <div className="tab-viewport-container">
            {activeTab === "home" && (
              <ObservatoryTab
                weather={weather}
                envData={envData}
                coords={coords}
                lang={lang}
                onRefreshGps={handleRefreshGps}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                refreshingGps={loadingTelemetry}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === "satellite" && (
              <SatelliteTab
                weather={weather}
                coords={coords}
                lang={lang}
                onSelectLocation={handleSelectLocation}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            )}

            {activeTab === "copilot" && (
              <SunCopilotTab
                weather={weather}
                coords={coords}
                lang={lang}
                onNavigateTab={setActiveTab}
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
        </TabErrorBoundary>
      </main>
      
      {/* Global Application Footer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
}
