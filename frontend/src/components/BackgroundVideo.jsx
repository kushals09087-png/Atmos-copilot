import React, { useEffect, useRef, useState } from "react";
import { Mountain, Waves, Moon, Sunset, Sparkles, SlidersHorizontal, Check } from "lucide-react";

export const BACKGROUND_THEMES = [
  {
    id: "mountains",
    name: "Misty Mountains",
    icon: Mountain,
    video: "/videos/mountains.mp4",
    cdnVideo: "https://shotstack-assets.s3.amazonaws.com/footage/mountains.mp4",
    tagline: "Alpine ridges & rolling cloud mist",
    fallbackGrad: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)"
  },
  {
    id: "ocean",
    name: "Deep Ocean Waves",
    icon: Waves,
    video: "/videos/ocean.mp4",
    cdnVideo: "https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4",
    tagline: "Turquoise coastal surf & shoreline swell",
    fallbackGrad: "radial-gradient(ellipse at top, #0c4a6e 0%, #082f49 50%, #020617 100%)"
  },
  {
    id: "nightsky",
    name: "Cosmic Night Sky",
    icon: Moon,
    video: "/videos/night-sky.mp4",
    cdnVideo: "https://shotstack-assets.s3.amazonaws.com/footage/night-sky.mp4",
    tagline: "Starlit deep cosmos & interstellar dust",
    fallbackGrad: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)"
  },
  {
    id: "sunset",
    name: "Atmospheric Sunset",
    icon: Sunset,
    video: "/videos/sunset.mp4",
    cdnVideo: "https://shotstack-assets.s3.amazonaws.com/footage/sunset.mp4",
    tagline: "Golden hour horizon & twilight radiance",
    fallbackGrad: "radial-gradient(ellipse at top, #431407 0%, #1e1b4b 60%, #020617 100%)"
  },
  {
    id: "auto",
    name: "Auto Weather Sync",
    icon: Sparkles,
    tagline: "Synchronized to local diurnal & sky telemetry",
    fallbackGrad: "radial-gradient(ellipse at top, #0f2744 0%, #0b1528 60%, #050a12 100%)"
  }
];

export default function BackgroundVideo({ currentTheme = "mountains", onThemeChange, weather }) {
  const videoRef = useRef(null);
  const [effectiveTheme, setEffectiveTheme] = useState("mountains");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [dimLevel, setDimLevel] = useState(() => Number(localStorage.getItem("atmos_bg_dim") || "70"));

  // Resolve "auto" theme dynamically based on current hour and weather
  useEffect(() => {
    if (currentTheme === "auto") {
      const hour = new Date().getHours();
      const condition = (weather?.current?.condition || "").toLowerCase();

      if (hour >= 19 || hour < 5) {
        setEffectiveTheme("nightsky");
      } else if (hour >= 17 || hour <= 6) {
        setEffectiveTheme("sunset");
      } else if (condition.includes("rain") || condition.includes("cloud")) {
        setEffectiveTheme("mountains");
      } else {
        setEffectiveTheme("ocean");
      }
    } else {
      setEffectiveTheme(currentTheme);
    }
  }, [currentTheme, weather]);

  const activeMeta = BACKGROUND_THEMES.find(t => t.id === effectiveTheme) || BACKGROUND_THEMES[0];

  useEffect(() => {
    setVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted until user interaction
      });
    }
  }, [effectiveTheme]);

  function handleSelectTheme(themeId) {
    if (onThemeChange) {
      onThemeChange(themeId);
    }
    localStorage.setItem("atmos_bg_theme", themeId);
    setIsMenuOpen(false);
  }

  function handleDimChange(e) {
    const val = Number(e.target.value);
    setDimLevel(val);
    localStorage.setItem("atmos_bg_dim", String(val));
  }

  return (
    <div className="atmospheric-video-container" aria-hidden="true">
      {/* Dynamic Ambient Fallback Gradient */}
      <div
        className="video-fallback-gradient"
        style={{ background: activeMeta.fallbackGrad }}
      />

      {/* Video element */}
      <video
        ref={videoRef}
        className={`ambient-video-surface ${videoLoaded ? "loaded" : "loading"}`}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
      >
        <source src={activeMeta.video} type="video/mp4" />
        <source src={activeMeta.cdnVideo} type="video/mp4" />
      </video>

      {/* Atmospheric Glass Overlay with user-adjustable opacity */}
      <div
        className="video-atmospheric-overlay"
        style={{
          "--user-overlay-opacity": `${dimLevel / 100}`
        }}
      />

      {/* Floating Ambient Background Switcher Pill */}
      <div className="ambient-switcher-floating">
        <button
          type="button"
          className="ambient-trigger-pill glass"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title="Change Ambient Video Background"
        >
          <activeMeta.icon size={15} className="text-cyan" />
          <span className="ambient-trigger-label">{activeMeta.name}</span>
          <SlidersHorizontal size={12} className="text-secondary" />
        </button>

        {isMenuOpen && (
          <div className="ambient-dropdown-menu glass fade-in">
            <div className="ambient-menu-header">
              <span className="ambient-menu-title">Atmospheric Environment</span>
              <span className="text-secondary text-xs">Live Video Background</span>
            </div>

            <div className="ambient-options-list">
              {BACKGROUND_THEMES.map((theme) => {
                const Icon = theme.icon;
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`ambient-option-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectTheme(theme.id)}
                  >
                    <div className="ambient-option-left">
                      <div className="ambient-icon-box">
                        <Icon size={16} />
                      </div>
                      <div className="ambient-option-text">
                        <div className="ambient-option-name">{theme.name}</div>
                        <div className="ambient-option-sub">{theme.tagline}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-cyan" />}
                  </button>
                );
              })}
            </div>

            {/* Ambient Dimmer / Contrast Slider */}
            <div className="ambient-dimmer-control">
              <div className="dimmer-header">
                <span className="text-xs text-secondary">Card Contrast / Dim</span>
                <span className="text-xs font-mono text-cyan">{dimLevel}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="92"
                value={dimLevel}
                onChange={handleDimChange}
                className="ambient-range-slider"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
