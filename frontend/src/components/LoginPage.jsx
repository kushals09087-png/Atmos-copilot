import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Radio,
  Sparkles,
  Globe,
  Cpu,
  Compass,
  Zap,
  Activity,
  Heart,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
  Check,
  X
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AtmosLogo from "./AtmosLogo";
import StartingPageAtmosphere, { AtmosphereControls } from "./StartingPageAtmosphere";
import { authApi } from "../services/api";
import { reverseGeocode, acquireUserGeolocation } from "../utils/telemetryData";

// Strict validation patterns
const NAME_STRICT_REGEX = /^[a-zA-Z\s.'-]{2,50}$/;
const EMAIL_STRICT_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage({ onAuthorized }) {
  // Navigation view: "welcome" (starting logo & name landing) | "auth" (credentials form)
  const [view, setView] = useState("welcome");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [atmosphereMode, setAtmosphereMode] = useState("rain-clouds");
  const [isRainAudioActive, setIsRainAudioActive] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "Dr. K. Sharma",
    email: "sharma.met@atmos-intel.org",
    mobile: "+91 98450 12345",
    password: "Atmos#Secure2026"
  });

  // Security & Validation State
  const [nameFeedback, setNameFeedback] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [fillBurst, setFillBurst] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("Ready for authorization");

  // Cooldown countdown timer for brute force protection
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Real-time password strength analyzer
  const passwordMetrics = useMemo(() => {
    const pwd = formData.password || "";
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    let score = 0;
    if (hasMinLen) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 1;

    let label = "Very Weak";
    let color = "var(--red, #ef4444)";
    if (score === 5) {
      label = "Military-Grade Security";
      color = "var(--green, #10b981)";
    } else if (score >= 4) {
      label = "Strong";
      color = "var(--cyan, #06b6d4)";
    } else if (score >= 3) {
      label = "Moderate";
      color = "var(--amber, #f59e0b)";
    } else if (score >= 2) {
      label = "Weak";
      color = "var(--red, #ef4444)";
    }

    return {
      hasMinLen,
      hasUpper,
      hasLower,
      hasDigit,
      hasSpecial,
      score,
      pct: Math.min(100, Math.round((score / 5) * 100)),
      label,
      color,
      isCompliant: hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial
    };
  }, [formData.password]);

  // Strict Name Input Handler: only alphabetic characters, spaces, dots, hyphens
  function handleNameChange(e) {
    const raw = e.target.value;
    // Filter out any numbers, special symbols, HTML tags
    const filtered = raw.replace(/[^a-zA-Z\s.'-]/g, "");

    if (raw !== filtered) {
      setNameFeedback("Security policy: Only alphabetic letters, spaces, dots, and hyphens are allowed.");
    } else if (filtered.length > 0 && filtered.trim().length < 2) {
      setNameFeedback("Name must contain at least 2 characters.");
    } else {
      setNameFeedback("");
    }

    setFormData((prev) => ({ ...prev, name: filtered }));
  }

  // Strict Email Input Handler
  function handleEmailChange(e) {
    const raw = e.target.value.trim();
    setFormData((prev) => ({ ...prev, email: raw }));

    if (raw.length > 0 && !EMAIL_STRICT_REGEX.test(raw)) {
      setEmailFeedback("Enter a valid RFC-compliant institutional email address.");
    } else {
      setEmailFeedback("");
    }
  }

  // Strict Mobile Input Handler: only +, digits, spaces, hyphens
  function handleMobileChange(e) {
    const raw = e.target.value;
    const filtered = raw.replace(/[^0-9+\s-]/g, "");
    setFormData((prev) => ({ ...prev, mobile: filtered }));
  }

  // Transition from starting welcome page to auth credentials form
  function handleGoToAuth(registerMode = false) {
    if (isTransitioning) return;
    setIsRegister(registerMode);
    setIsTransitioning(true);
    setTimeout(() => {
      setView("auth");
      setIsTransitioning(false);
    }, 280);
  }

  // Transition back from auth credentials form to starting welcome page
  function handleBackToWelcome() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setView("welcome");
      setIsTransitioning(false);
    }, 280);
  }

  // Instant 1-click Demo Access directly from welcome or auth (All Security Bypassed)
  function handleQuickDemoLogin() {
    setError("");
    setCooldownSeconds(0);
    setFailedAttempts(0);
    setNameFeedback("");
    setEmailFeedback("");
    setLoading(true);

    const demoCoords = { lat: 12.9716, lon: 77.5946 };
    const demoLocality = "Bengaluru, Karnataka (HQ)";
    const sessionUser = {
      name: "Dr. K. Sharma",
      email: "sharma.met@atmos-intel.org",
      mobile: "+91 98450 12345",
      loginTime: new Date().toLocaleTimeString(),
      coords: demoCoords,
      locality: demoLocality,
      isDemo: true
    };

    localStorage.setItem("atmos_token", "atmos_operator_token_demo");
    localStorage.setItem("atmos_user", JSON.stringify(sessionUser));
    window.dispatchEvent(new Event("atmos-auth-change"));

    setUnlocking(true);
    setGpsStatus("Station Verified (Instant Demo Access) • Initializing Synoptic Core...");

    setTimeout(() => {
      setLoading(false);
      if (onAuthorized) {
        onAuthorized(sessionUser, demoCoords, demoLocality);
      }
    }, 400);
  }

  async function handleAuthorize(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = formData.email.trim().toLowerCase();
    const isDemoAccount = cleanEmail === "sharma.met@atmos-intel.org";

    // ONLY for Instant Demo Access: Remove security checks
    if (!isDemoAccount) {
      // Enforce brute-force lockout for regular users
      if (cooldownSeconds > 0) {
        setError(`Security Lockdown Active: Please wait ${cooldownSeconds}s before retrying.`);
        return;
      }

      // Enforce strict name policy (Letters only)
      if (isRegister) {
        const cleanName = formData.name.trim();
        if (!NAME_STRICT_REGEX.test(cleanName)) {
          setError("Security Error: Operator Name may only contain alphabetic characters, spaces, dots, and hyphens (2-50 characters). Numbers and special symbols are strictly disallowed.");
          return;
        }
      }

      // Enforce strict email formatting
      if (!EMAIL_STRICT_REGEX.test(cleanEmail)) {
        setError("Security Error: Please enter a valid corporate or institutional email address.");
        return;
      }

      // Enforce strict password complexity
      if (!formData.password || formData.password.length < 8) {
        setError("Security Error: Security key password must contain at least 8 characters.");
        return;
      }

      if (isRegister && !passwordMetrics.isCompliant) {
        setError("Security Error: Password does not satisfy policy. It must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.");
        return;
      }
    } else {
      // Demo access: clear any existing security lockout instantly
      setCooldownSeconds(0);
      setFailedAttempts(0);
    }

    setLoading(true);
    setGpsStatus("Acquiring hardware GPS satellite fix...");

    // Acquire geolocation via multi-tiered resolver (GPS / WiFi / IP)
    let userCoords = { lat: 12.9716, lon: 77.5946 };
    let userLocality = "Bengaluru, Karnataka";
    try {
      const geo = await acquireUserGeolocation();
      userCoords = { lat: geo.lat, lon: geo.lon };
      userLocality = geo.formatted || geo.city || "Bengaluru, Karnataka";
      try {
        const rev = await reverseGeocode(userCoords.lat, userCoords.lon);
        if (rev && !rev.startsWith("Coordinates:")) {
          userLocality = rev;
        }
      } catch (revErr) {
        console.warn("Reverse geocode warning:", revErr);
      }
      setGpsStatus(`GPS fix locked: ${userLocality}`);
    } catch (gpsErr) {
      console.warn("GPS acquire fallback to default:", gpsErr);
      setGpsStatus("Defaulting to station coordinates");
    }

    // Backend authentication attempt
    try {
      if (isRegister) {
        try {
          const res = await authApi.register({
            name: formData.name.trim(),
            email: cleanEmail,
            password: formData.password
          });
          if (res.token) localStorage.setItem("atmos_token", res.token);
        } catch (apiErr) {
          // If server rejects with validation or conflict error, inform user
          if (apiErr.message && !apiErr.message.includes("Failed to fetch")) {
            setLoading(false);
            setError(apiErr.message);
            return;
          }
          localStorage.setItem("atmos_token", "atmos_operator_token_" + Date.now());
        }
      } else {
        try {
          const res = await authApi.login({
            email: cleanEmail,
            password: formData.password
          });
          if (res.token) localStorage.setItem("atmos_token", res.token);
        } catch (apiErr) {
          // Failed attempt counter
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);

          if (nextAttempts >= 5) {
            setCooldownSeconds(30);
            setError("Security Lockdown Activated: 5 consecutive failed authorization attempts. Cooldown in effect for 30s.");
          } else {
            setError(apiErr.message || `Invalid credentials. (${5 - nextAttempts} attempts remaining)`);
          }
          setLoading(false);
          return;
        }
      }
    } catch {
      localStorage.setItem("atmos_token", "atmos_operator_token_" + Date.now());
    }

    // Success: reset attempts
    setFailedAttempts(0);
    const sessionUser = {
      name: formData.name.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
      mobile: formData.mobile.trim(),
      loginTime: new Date().toLocaleTimeString(),
      coords: userCoords,
      locality: userLocality
    };

    localStorage.setItem("atmos_user", JSON.stringify(sessionUser));
    window.dispatchEvent(new Event("atmos-auth-change"));

    setUnlocking(true);
    setGpsStatus("Station Verified • Initializing Synoptic Core...");

    setTimeout(() => {
      setLoading(false);
      if (onAuthorized) {
        onAuthorized(sessionUser, userCoords, userLocality);
      }
    }, 600);
  }

  function handleFillDemo() {
    setFillBurst(true);
    setTimeout(() => setFillBurst(false), 500);
    setFormData({
      name: "Dr. K. Sharma",
      email: "sharma.met@atmos-intel.org",
      mobile: "+91 98450 12345",
      password: "Atmos#Secure2026"
    });
    setNameFeedback("");
    setEmailFeedback("");
    setIsRegister(false);
  }

  return (
    <div className={`login-screen-wrap ${unlocking ? "screen-unlocking" : ""}`}>
      {/* Background ambient lighting orbs & grid */}
      <div className="login-backdrop-glow glow-orb-1"></div>
      <div className="login-backdrop-glow glow-orb-2"></div>
      <div className="login-backdrop-glow glow-orb-3"></div>
      <div className="login-backdrop-glow glow-orb-4"></div>
      <div className="login-ambient-grid"></div>

      {/* Full-screen Shockwave Burst on Successful Unlock */}
      {unlocking && (
        <div className="unlock-shockwave-overlay">
          <div className="unlock-wave-ring ring-1"></div>
          <div className="unlock-wave-ring ring-2"></div>
          <div className="unlock-badge-popup">
            <ShieldCheck size={32} className="text-cyan pulse" />
            <span>OPERATOR AUTHORIZED &bull; CONNECTING</span>
          </div>
        </div>
      )}

      {/* VIEW 1: STARTING PAGE (Persistent Logo & Name Showcase with Option to Go to Sign In) */}
      {view === "welcome" && (
        <div className={`welcome-screen-wrap ${isTransitioning ? "welcome-leaving" : "welcome-entering"}`}>
          {/* Natural Moving Clouds & Dynamic Rainfall Atmosphere Layer */}
          <StartingPageAtmosphere
            mode={atmosphereMode}
            onModeChange={setAtmosphereMode}
            isAudioActive={isRainAudioActive}
            onToggleAudio={() => setIsRainAudioActive((prev) => !prev)}
            showControls={false}
          />

          {/* Welcome Top Header Bar */}
          <header className="welcome-top-bar">
            <div className="welcome-station-status">
              <span className="station-status-dot pulse" />
              <span className="station-status-text">ATMOS METEOROLOGICAL OBSERVATORY &bull; ONLINE</span>
            </div>
            <div className="welcome-top-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AtmosphereControls
                mode={atmosphereMode}
                onToggleMode={() =>
                  setAtmosphereMode((prev) =>
                    prev === "rain-clouds" ? "clouds-only" : prev === "clouds-only" ? "clear" : "rain-clouds"
                  )
                }
                isAudioActive={isRainAudioActive}
                onToggleAudio={() => setIsRainAudioActive((prev) => !prev)}
              />
              <ThemeToggle />
            </div>
          </header>

          {/* Central Hero Showcase Card */}
          <div className="welcome-hero-card">
            {/* Radial aura flares & orbital rings */}
            <div className="intro-aura-halo" />
            <div className="intro-concentric-ring ring-outer" />
            <div className="intro-concentric-ring ring-middle" />
            <div className="intro-concentric-ring ring-inner" />
            <div className="intro-radar-sweep-beam" />

            <div className="welcome-content-container">
              {/* Hero Insignia Logo with pulse beam */}
              <div className="intro-logo-glow-shell">
                <div className="intro-pulse-beam" />
                <AtmosLogo size={116} variant="lockup" className="intro-hero-logo" />
              </div>

              {/* Page Title & Subtitle */}
              <div className="intro-title-block">
                <div className="intro-eyebrow-badge">
                  <Sparkles size={13} className="text-cyan pulse" />
                  <span>NEXT-GEN SYNOPTIC METEOROLOGICAL PLATFORM</span>
                </div>
                <h1 className="intro-brand-heading">
                  <span className="atmos-gradient-text">ATMOS</span>{" "}
                  <span className="copilot-white-text">COPILOT</span>
                </h1>
                <p className="intro-tagline-text">
                  Geospatial Doppler Radar &bull; AI Agro Intelligence &bull; Route Weather Forecasting
                </p>
              </div>

              {/* System Capabilities Grid */}
              <div className="welcome-capabilities-cards-grid">
                <div className="welcome-cap-card cap-cyan">
                  <div className="cap-card-icon-halo">
                    <Globe size={18} />
                  </div>
                  <div className="cap-card-text">
                    <div className="cap-card-title">Windy.com HD Layers</div>
                    <div className="cap-card-desc">Clouds, Streamlines, Isobars & Jetstream</div>
                  </div>
                </div>

                <div className="welcome-cap-card cap-emerald">
                  <div className="cap-card-icon-halo">
                    <Radio size={18} />
                  </div>
                  <div className="cap-card-text">
                    <div className="cap-card-title">Live Doppler Radar</div>
                    <div className="cap-card-desc">Real-time Precipitation & Storm Cells</div>
                  </div>
                </div>

                <div className="welcome-cap-card cap-purple">
                  <div className="cap-card-icon-halo">
                    <Cpu size={18} />
                  </div>
                  <div className="cap-card-text">
                    <div className="cap-card-title">AI Agro Intelligence</div>
                    <div className="cap-card-desc">Soil Moisture, VPD & Sowing Windows</div>
                  </div>
                </div>

                <div className="welcome-cap-card cap-amber">
                  <div className="cap-card-icon-halo">
                    <Compass size={18} />
                  </div>
                  <div className="cap-card-text">
                    <div className="cap-card-title">Route Hazard Telemetry</div>
                    <div className="cap-card-desc">Highway Corridors & Safety Directives</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons to navigate to Sign In */}
              <div className="welcome-actions-cluster">
                <button
                  type="button"
                  id="btn-go-to-signin"
                  className="welcome-primary-btn"
                  onClick={() => handleGoToAuth(false)}
                >
                  <span>Sign In to Station Console</span>
                  <ArrowRight size={18} className="btn-arrow" />
                </button>

                <div className="welcome-secondary-row">
                  <button
                    type="button"
                    id="btn-go-to-register"
                    className="welcome-secondary-btn"
                    onClick={() => handleGoToAuth(true)}
                  >
                    <UserPlus size={15} className="text-cyan" />
                    <span>Register Operator Station</span>
                  </button>

                  <button
                    type="button"
                    id="btn-instant-demo-access"
                    className="welcome-demo-pill"
                    onClick={handleQuickDemoLogin}
                  >
                    <Zap size={14} className="text-amber" />
                    <span>Instant Demo Access ⚡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Synoptic Status Ticker */}
          <div className="welcome-live-ticker-bar">
            <div className="welcome-ticker-inner">
              <span className="ticker-chip status-live"><span className="pulse-dot-green" /> SYNOPTIC CORE: ONLINE</span>
              <span className="ticker-chip"><Radio size={12} className="text-cyan" /> DOPPLER RADAR: ACTIVE</span>
              <span className="ticker-chip"><Globe size={12} className="text-purple" /> WINDY.COM HD OVERLAYS</span>
              <span className="ticker-chip"><Activity size={12} className="text-emerald" /> 10 REGIONAL STATIONS LOCKED</span>
              <span className="ticker-chip"><Zap size={12} className="text-amber" /> LIGHTNING DETECTION: NOMINAL</span>
            </div>
          </div>

          {/* Copyright Footer */}
          <footer className="welcome-copyright-footer">
            <span>&copy; {new Date().getFullYear()} ATMOS COPILOT. All rights reserved.</span>
            <span className="footer-dot-divider">&bull;</span>
            <span className="footer-credit">
              Made by <b className="nexus-gradient-text">Team NEXUS</b> with{" "}
              <Heart size={14} className="footer-heart-inline text-rose" fill="#f43f5e" />
            </span>
          </footer>
        </div>
      )}

      {/* VIEW 2: AUTHENTICATION / SIGN IN CREDENTIALS (Animated In) */}
      {view === "auth" && (
        <div className={`auth-screen-wrap ${isTransitioning ? "auth-leaving" : "auth-entering"}`}>
          {/* Top bar */}
          <header className="login-top-bar">
            <button
              type="button"
              id="btn-back-to-home"
              className="back-to-welcome-btn"
              onClick={handleBackToWelcome}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>

            <div className="brand login-brand-anim">
              <AtmosLogo size={34} />
              <span>ATMOS <b>COPILOT</b></span>
            </div>

            <ThemeToggle />
          </header>

          {/* Main Login Card */}
          <main className="login-container">
            <div className={`login-card glass ${unlocking ? "card-unlocking" : ""}`}>
              {/* Top edge shimmer beam */}
              <div className="login-card-edge-glow"></div>

              <div className="login-header">
                {/* Back Link inside card header for convenient mobile reach */}
                <button
                  type="button"
                  className="card-return-link"
                  onClick={handleBackToWelcome}
                >
                  <ArrowLeft size={13} />
                  <span>Return to Welcome Screen</span>
                </button>

                {/* Brand Header inside card */}
                <div className="login-card-brand-lockup">
                  <AtmosLogo size={38} />
                  <div className="login-card-brand-text">
                    <span className="brand-name">ATMOS <b>COPILOT</b></span>
                    <span className="brand-sub">Meteorological Intelligence Core</span>
                  </div>
                </div>

                <div className="security-badge pulse-glow">
                  <ShieldCheck size={14} className="text-cyan" />
                  <span>256-BIT ENCRYPTION &bull; STRICT IDENTITY VERIFIED</span>
                </div>
                <h1 className="login-title">
                  {isRegister ? "Register Operator Station" : "Sign In to Atmos Copilot"}
                </h1>
                <p className="login-subtitle">
                  {isRegister
                    ? "Establish a cryptographically secured meteorological operator identity."
                    : "Enter verified credentials to initialize real-time synoptic radar telemetry and route forecasting."}
                </p>
              </div>

              {/* Mode switch pills with sliding pill indicator */}
              <div className="tab-pill-group login-mode-toggle">
                <div className={`login-mode-slider ${isRegister ? "slide-register" : "slide-signin"}`} />
                <button
                  type="button"
                  className={`pill-btn ${!isRegister ? "active" : ""}`}
                  onClick={() => {
                    setIsRegister(false);
                    setError("");
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`pill-btn ${isRegister ? "active" : ""}`}
                  onClick={() => {
                    setIsRegister(true);
                    setError("");
                  }}
                >
                  Register Operator
                </button>
              </div>

              {/* Cooldown Lock Warning Banner */}
              {cooldownSeconds > 0 && (
                <div className="cooldown-lock-banner">
                  <LockKeyhole size={18} className="text-amber pulse-fast" />
                  <div>
                    <strong>SECURITY COOLDOWN IN EFFECT</strong>
                    <p>Too many failed attempts. Console locked for <strong>{cooldownSeconds}s</strong>.</p>
                  </div>
                </div>
              )}

              {error && <div className="error-box error-shake">{error}</div>}

              <form onSubmit={handleAuthorize} className="auth-form-styled">
                {/* Expandable registration full name (Letters Only) */}
                <div className={`form-field-expandable ${isRegister ? "field-open" : "field-closed"}`}>
                  {isRegister && (
                    <div className="form-group anim-field-in">
                      <div className="field-label-row">
                        <label>
                          <User size={14} className="text-cyan field-icon" /> Operator Full Name <small className="field-tag-secure">(Letters Only)</small>
                        </label>
                        {formData.name.trim().length >= 2 && NAME_STRICT_REGEX.test(formData.name.trim()) && (
                          <span className="field-valid-badge">
                            <CheckCircle2 size={13} className="text-green" /> Valid
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required={isRegister}
                        maxLength={50}
                        placeholder="e.g. Dr. Kushal Sharma"
                        value={formData.name}
                        onChange={handleNameChange}
                        className={nameFeedback ? "input-border-warning" : ""}
                      />
                      {nameFeedback && (
                        <div className="field-security-hint text-amber">
                          <AlertCircle size={12} /> {nameFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <div className="field-label-row">
                    <label>
                      <Mail size={14} className="text-cyan field-icon" /> Registered Email Address
                    </label>
                    {formData.email && EMAIL_STRICT_REGEX.test(formData.email) && (
                      <span className="field-valid-badge">
                        <CheckCircle2 size={13} className="text-green" /> Valid Format
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="analyst@atmos.ai"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className={emailFeedback ? "input-border-warning" : ""}
                  />
                  {emailFeedback && (
                    <div className="field-security-hint text-amber">
                      <AlertCircle size={12} /> {emailFeedback}
                    </div>
                  )}
                </div>

                {/* Expandable registration mobile contact */}
                <div className={`form-field-expandable ${isRegister ? "field-open" : "field-closed"}`}>
                  {isRegister && (
                    <div className="form-group anim-field-in">
                      <label>
                        <Phone size={14} className="text-cyan field-icon" /> Mobile Contact <small className="field-tag-secure">(Digits Only)</small>
                      </label>
                      <input
                        type="tel"
                        required={isRegister}
                        maxLength={20}
                        placeholder="+91 98450 12345"
                        value={formData.mobile}
                        onChange={handleMobileChange}
                      />
                    </div>
                  )}
                </div>

                {/* Security Key / Password with Show/Hide Toggle & Strength Meter */}
                <div className="form-group">
                  <div className="field-label-row">
                    <label>
                      <Lock size={14} className="text-cyan field-icon" /> Security Key / Password
                    </label>
                    <span className="field-strength-tag" style={{ color: passwordMetrics.color }}>
                      {formData.password ? passwordMetrics.label : "Required"}
                    </span>
                  </div>

                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter Bar */}
                  {formData.password && (
                    <div className="password-strength-meter">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${passwordMetrics.pct}%`,
                          backgroundColor: passwordMetrics.color
                        }}
                      />
                    </div>
                  )}

                  {/* Security Policy Checklist for Registration */}
                  {isRegister && (
                    <div className="password-rules-checklist">
                      <span className={`rule-chip ${passwordMetrics.hasMinLen ? "satisfied" : ""}`}>
                        {passwordMetrics.hasMinLen ? <Check size={11} /> : <X size={11} />} 8+ Chars
                      </span>
                      <span className={`rule-chip ${passwordMetrics.hasUpper ? "satisfied" : ""}`}>
                        {passwordMetrics.hasUpper ? <Check size={11} /> : <X size={11} />} Uppercase (A-Z)
                      </span>
                      <span className={`rule-chip ${passwordMetrics.hasLower ? "satisfied" : ""}`}>
                        {passwordMetrics.hasLower ? <Check size={11} /> : <X size={11} />} Lowercase (a-z)
                      </span>
                      <span className={`rule-chip ${passwordMetrics.hasDigit ? "satisfied" : ""}`}>
                        {passwordMetrics.hasDigit ? <Check size={11} /> : <X size={11} />} Number (0-9)
                      </span>
                      <span className={`rule-chip ${passwordMetrics.hasSpecial ? "satisfied" : ""}`}>
                        {passwordMetrics.hasSpecial ? <Check size={11} /> : <X size={11} />} Special Symbol (#$%)
                      </span>
                    </div>
                  )}
                </div>

                {/* GPS Telemetry Acquisition Notice */}
                <div className="gps-lock-preview radar-scanner-box">
                  <div className="radar-scanner-beam"></div>
                  <div className="flex-row gap-xs text-sm" style={{ position: "relative", zIndex: 2 }}>
                    <Radio size={14} className="text-cyan pulse" />
                    <span className="text-secondary">Station Telemetry Security:</span>
                  </div>
                  <div className="gps-status-text" style={{ position: "relative", zIndex: 2 }}>
                    {gpsStatus}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn full authorize-btn ${loading ? "btn-loading" : ""} ${unlocking ? "btn-unlocking" : ""}`}
                  disabled={loading || unlocking || cooldownSeconds > 0}
                >
                  {loading || unlocking ? (
                    <>
                      <Radio size={18} className="spin" /> Locking Telemetry & Authorizing...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <LockKeyhole size={18} /> Locked ({cooldownSeconds}s remaining)
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? "Register & Unlock Station" : "Authorize & Unlock Observatory"}</span>
                      <ArrowRight size={18} className="btn-arrow-icon" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant Demo Access (Security Removed for Demo) */}
              <div className="demo-credentials-footer">
                <div className="demo-footer-left">
                  <span className="flex-row gap-xs">
                    <Sparkles size={14} className="text-amber spin-hover" />
                    <span className="demo-label">Instant Demo Access:</span>
                  </span>
                  <span className="demo-sub-tag">⚡ Security checks & credentials bypassed</span>
                </div>
                <div className="demo-actions-row">
                  <button
                    type="button"
                    id="btn-instant-demo-direct"
                    className="btn-demo-direct"
                    onClick={handleQuickDemoLogin}
                    title="Bypass all security checks and enter observatory instantly"
                  >
                    <Zap size={14} className="text-amber" />
                    <span>Instant Demo Access ⚡</span>
                  </button>
                  <button
                    type="button"
                    className={`badge-ghost demo-fill-btn ${fillBurst ? "fill-burst-active" : ""}`}
                    onClick={handleFillDemo}
                    title="Fill demo credentials into form"
                  >
                    Fill Form
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Copyright Footer */}
          <footer className="welcome-copyright-footer auth-footer-spacing">
            <span>&copy; {new Date().getFullYear()} ATMOS COPILOT. All rights reserved.</span>
            <span className="footer-dot-divider">&bull;</span>
            <span className="footer-credit">
              Made by <b className="nexus-gradient-text">Team NEXUS</b> with{" "}
              <Heart size={14} className="footer-heart-inline text-rose" fill="#f43f5e" />
            </span>
          </footer>
        </div>
      )}
    </div>
  );
}
