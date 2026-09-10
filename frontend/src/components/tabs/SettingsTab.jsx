import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Globe, User, Radio, LogOut, CheckCircle2, ShieldCheck, Cpu, HardDrive, Clapperboard, Volume2, Play, Square } from "lucide-react";
import { translations, formatDigits } from "../../utils/telemetryData";
import { BACKGROUND_THEMES } from "../BackgroundVideo";
import { VOCAL_PROFILES, speakText, stopAllSpeech, setStoredVoiceProfile, getStoredVoiceProfile } from "../../utils/vocalSynth";

export default function SettingsTab({ lang, setLang, weather, coords, bgTheme = "mountains", setBgTheme, onLogout }) {
  const [operator, setOperator] = useState({
    name: "Dr. K. Sharma",
    email: "sharma.met@atmos-intel.org",
    mobile: "+91 98450 12345",
    loginTime: new Date().toLocaleTimeString()
  });

  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem("atmos_vocal_voice") || "spandana";
  });
  const [playingPreviewId, setPlayingPreviewId] = useState(null);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("atmos_user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setOperator({
          name: u.name || u.email?.split("@")[0] || "Authorized Analyst",
          email: u.email || "analyst@atmos.ai",
          mobile: u.mobile || "+91 98450 12345",
          loginTime: u.loginTime || new Date().toLocaleTimeString()
        });
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const t = translations[lang] || translations.en;

  const languages = [
    { code: "en", label: "English (International)", native: "English" },
    { code: "kn", label: "Kannada (ಕನ್ನಡ)", native: "ಕನ್ನಡ" },
    { code: "hi", label: "Hindi (हिन्दी)", native: "हिन्दी" },
    { code: "ta", label: "Tamil (தமிழ்)", native: "தமிழ்" },
    { code: "te", label: "Telugu (తెలుగు)", native: "తెలుగు" },
    { code: "es", label: "Spanish (Español)", native: "Español" }
  ];

  function handleLanguageChange(code) {
    setLang(code);
    localStorage.setItem("atmos_lang", code);
  }

  function handleSelectVoice(profileId) {
    setSelectedVoice(profileId);
    setStoredVoiceProfile(profileId);
  }

  function handleTogglePreview(profile) {
    if (playingPreviewId === profile.id) {
      stopAllSpeech();
      setPlayingPreviewId(null);
      return;
    }

    stopAllSpeech();
    setPlayingPreviewId(profile.id);

    speakText(profile.previewText, profile.id, {
      onStart: () => setPlayingPreviewId(profile.id),
      onEnd: () => setPlayingPreviewId(null),
      onError: () => setPlayingPreviewId(null)
    });
  }

  const activeVoiceProfile = VOCAL_PROFILES.find(p => p.id === selectedVoice) || VOCAL_PROFILES[0];

  return (
    <div className="tab-pane active fade-in">
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <SettingsIcon className="inline-icon text-cyan" size={24} />
            {t.systemSettings}
          </h2>
          <p className="section-subtitle">{t.manageTelemetry}</p>
        </div>

        <div className="status-pill online">
          <span className="dot"></span>
          {t.authenticated}
        </div>
      </div>

      <div className="two-col-grid" style={{ marginTop: "1rem" }}>
        {/* System Language Selection */}
        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <Globe size={18} className="text-cyan" /> {t.systemLanguage}
            </h3>
            <span className="badge-cyan">{lang.toUpperCase()}</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: "1.25rem" }}>
            Select the active natural language model for multilingual copilot queries, synoptic telemetry values, and voice synthesis.
          </p>

          <div className="lang-radio-grid">
            {languages.map((l) => (
              <label
                key={l.code}
                className={`lang-option-card ${lang === l.code ? "selected" : ""}`}
                onClick={() => handleLanguageChange(l.code)}
              >
                <div className="lang-radio-left">
                  <input
                    type="radio"
                    name="system_language"
                    checked={lang === l.code}
                    onChange={() => handleLanguageChange(l.code)}
                  />
                  <div>
                    <div className="lang-title">{l.native}</div>
                    <div className="lang-desc">{l.label}</div>
                  </div>
                </div>
                {lang === l.code && <CheckCircle2 size={18} className="text-cyan" />}
              </label>
            ))}
          </div>
        </div>

        {/* Operator Profile Credentials */}
        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <User size={18} className="text-cyan" /> Operator Profile
            </h3>
            <span className="badge-ghost">Identity Node</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: "1.25rem" }}>
            Authorized analyst credentials and device location binding.
          </p>

          <div className="profile-fields-list">
            <div className="profile-field-row">
              <span className="profile-field-lbl">{t.operatorName}</span>
              <span className="profile-field-val">{operator.name}</span>
            </div>
            <div className="profile-field-row">
              <span className="profile-field-lbl">{t.registeredEmail}</span>
              <span className="profile-field-val">{operator.email}</span>
            </div>
            <div className="profile-field-row">
              <span className="profile-field-lbl">{t.mobileContact}</span>
              <span className="profile-field-val">{operator.mobile}</span>
            </div>
            <div className="profile-field-row">
              <span className="profile-field-lbl">{t.sessionTime}</span>
              <span className="profile-field-val">{operator.loginTime}</span>
            </div>
            <div className="profile-field-row">
              <span className="profile-field-lbl">Hardware Station Lock</span>
              <span className="profile-field-val">
                {coords?.lat ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Active"}
              </span>
            </div>
          </div>

          <button
            className="btn full logout-action-btn"
            style={{ marginTop: "1.5rem" }}
            onClick={onLogout}
          >
            <LogOut size={16} /> {t.logOut}
          </button>
        </div>
      </div>

      {/* Sun Copilot Vocal Synthesis & AI Voice Profile */}
      <div className="glass card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header-clean">
          <div>
            <h3 className="subheading" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Volume2 size={18} className="text-cyan" /> Sun Copilot Vocal Synthesis & AI Voice Profile
            </h3>
          </div>
          <span className="badge-cyan">
            Active: {activeVoiceProfile.name} ({activeVoiceProfile.genderLabel})
          </span>
        </div>
        <p className="text-secondary text-sm" style={{ marginBottom: "1.25rem" }}>
          Select the synthetic vocal personality for Sun Copilot spoken meteorological briefings, radar advisories, and weather alerts. Choose between natural girl (female) and boy (male) acoustic signatures.
        </p>

        <div className="vocal-profiles-grid">
          {VOCAL_PROFILES.map((profile) => {
            const isSelected = selectedVoice === profile.id;
            const isPlaying = playingPreviewId === profile.id;

            return (
              <div
                key={profile.id}
                className={`vocal-profile-card ${isSelected ? "selected" : ""}`}
                style={{
                  borderColor: isSelected ? profile.accentColor : undefined
                }}
                onClick={() => handleSelectVoice(profile.id)}
              >
                <div className="vocal-card-top">
                  <div className="vocal-avatar-wrap" style={{ borderColor: `${profile.accentColor}60` }}>
                    <span className="vocal-avatar-emoji">{profile.avatar}</span>
                  </div>
                  <div className="vocal-card-badges">
                    <span className="vocal-gender-tag" style={{ color: profile.accentColor, borderColor: `${profile.accentColor}40` }}>
                      {profile.genderLabel}
                    </span>
                    {isSelected && (
                      <span className="vocal-active-pill">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="vocal-card-body">
                  <div className="vocal-voice-name">
                    {profile.name} <span className="vocal-voice-gender-sub">({profile.genderLabel})</span>
                  </div>
                  <div className="vocal-voice-title">{profile.title}</div>
                  <p className="vocal-voice-desc">{profile.tagline}</p>

                  <div className="vocal-spec-tags">
                    <span className="vocal-spec-item">
                      <strong>Pitch:</strong> {profile.pitch > 1 ? `+${Math.round((profile.pitch - 1) * 100)}% (Natural Treble)` : profile.pitch < 1 ? `-${Math.round((1 - profile.pitch) * 100)}% (Deep Bass)` : "1.0x (Balanced)"}
                    </span>
                    <span className="vocal-spec-item">
                      <strong>Cadence:</strong> {profile.rate}x
                    </span>
                  </div>
                </div>

                <div className="vocal-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`vocal-preview-btn ${isPlaying ? "playing" : ""}`}
                    onClick={() => handleTogglePreview(profile)}
                    title={isPlaying ? "Stop voice sample" : "Listen to voice sample"}
                  >
                    {isPlaying ? (
                      <>
                        <Square size={13} fill="currentColor" />
                        <span>Stop Sample</span>
                        <span className="vocal-wave-bars">
                          <span className="vwave-bar"></span>
                          <span className="vwave-bar"></span>
                          <span className="vwave-bar"></span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="currentColor" />
                        <span>Preview Voice</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`vocal-select-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectVoice(profile.id)}
                  >
                    {isSelected ? "Selected" : "Set Active"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Atmospheric Video Background Selection Card */}
      <div className="glass card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header-clean">
          <h3 className="subheading">
            <Clapperboard size={18} className="text-cyan" /> Atmospheric Environment & Video Background
          </h3>
          <span className="badge-cyan">Live Ambient Motion</span>
        </div>
        <p className="text-secondary text-sm" style={{ marginBottom: "1rem" }}>
          Select the cinematic ambient background stream rendered beneath observatory telemetry and glassmorphic dashboards.
        </p>

        <div className="telemetry-grid three-col" style={{ gap: "12px" }}>
          {BACKGROUND_THEMES.map((theme) => {
            const Icon = theme.icon;
            const isSelected = bgTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={`ambient-setting-card ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  if (setBgTheme) setBgTheme(theme.id);
                  localStorage.setItem("atmos_bg_theme", theme.id);
                }}
              >
                <div className="ambient-setting-top">
                  <div className="ambient-setting-icon">
                    <Icon size={18} />
                  </div>
                  {isSelected && <span className="badge-cyan">Active</span>}
                </div>
                <div className="ambient-setting-name">{theme.name}</div>
                <div className="ambient-setting-tagline">{theme.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subsystem Telemetry Integration Diagnostics */}
      <div className="glass card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header-clean">
          <h3 className="subheading">
            <Cpu size={18} className="text-cyan" /> Subsystem Diagnostics & Data Pipelines
          </h3>
          <span className="badge-cyan">All Systems Operational</span>
        </div>

        <div className="telemetry-grid three-col" style={{ marginTop: "1rem" }}>
          <div className="diagnostic-item">
            <div className="diag-header">
              <Radio size={16} className="text-cyan" />
              <strong>Atmospheric Ingestion</strong>
            </div>
            <p className="diag-desc">
              Open-Meteo High-Resolution Global Model with real-time 15-minute Doppler updates.
            </p>
          </div>

          <div className="diagnostic-item">
            <div className="diag-header">
              <HardDrive size={16} className="text-cyan" />
              <strong>Satellite Radar Mosaic</strong>
            </div>
            <p className="diag-desc">
              RainViewer HD Doppler precipitation reflectivity and INSAT Cloud Top Temperature IR.
            </p>
          </div>

          <div className="diagnostic-item">
            <div className="diag-header">
              <ShieldCheck size={16} className="text-cyan" />
              <strong>Secure Edge Processing</strong>
            </div>
            <p className="diag-desc">
              Zero telemetry leaks. Local speech-to-text decoding via Web Speech Audio API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
