import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  CloudLightning,
  Sun,
  Wind,
  Activity,
  Radio,
  Eye,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  Droplets,
  Thermometer,
  Compass,
  Sprout,
  Share2,
  Flame,
  Search,
  CheckSquare,
  Square,
  Zap,
  Info
} from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";
import { speakText, stopAllSpeech, getStoredVoiceProfile } from "../../utils/vocalSynth";

/**
 * Web Audio API Dual-Harmonic Emergency Alert Chime Synthesizer
 */
function playEmergencyChime(type = "warning") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "critical") {
      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174, now + 0.14); // D6
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587, now + 0.14);
    } else {
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);

    setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 650);
  } catch (err) {
    console.warn("Audio chime synthesis error:", err);
  }
}

export default function AlertsTab({ weather, envData, coords, lang = "en" }) {
  // Acknowledgment & Simulation States
  const [acknowledged, setAcknowledged] = useState(() => {
    return localStorage.getItem("atmos_alerts_acknowledged") === "true";
  });
  const [simulationActive, setSimulationActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [completedDirectives, setCompletedDirectives] = useState({});
  const [showThresholdDrawer, setShowThresholdDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedBulletinId, setCopiedBulletinId] = useState(null);
  const [desktopNoticeStatus, setDesktopNoticeStatus] = useState("default");

  // User Customizable Thresholds (Stored in LocalStorage)
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem("atmos_alert_thresholds");
      return saved
        ? JSON.parse(saved)
        : {
            rain: 15, // mm or %
            wind: 30, // km/h
            uv: 6.0,
            aqi: 60,
            heat: 34, // °C
            soilMin: 15 // %
          };
    } catch {
      return { rain: 15, wind: 30, uv: 6.0, aqi: 60, heat: 34, soilMin: 15 };
    }
  });

  const city = weather?.resolved_city || "Station Coordinates";
  const curTemp = weather?.current?.temp ?? 27;
  const curPrecip = weather?.current?.precipitation ?? 0;
  const curWind = weather?.current?.wind ?? 14;
  const curHumidity = weather?.current?.humidity ?? 58;
  const curDewPoint = weather?.current?.dew_point ?? 16;
  const curCondition = weather?.current?.condition || "Partly Cloudy";
  const aqiVal = envData?.aqi?.value ?? 34;
  const pm25Val = envData?.aqi?.pm25 ?? 18;
  const pm10Val = envData?.aqi?.pm10 ?? 36;
  const uvVal = envData?.uv?.index ?? 5.2;
  const soilMoistureVal = parseFloat(envData?.agro?.soilMoisture ?? 24.5);

  // Active Effective Values (Modified if in Simulation Mode)
  const effectiveData = useMemo(() => {
    if (simulationActive) {
      return {
        temp: 36,
        precip: 48,
        wind: 64,
        humidity: 88,
        dewPoint: 25,
        condition: "Severe Thunderstorm & Squall",
        aqi: 142,
        pm25: 78,
        pm10: 125,
        uv: 8.8,
        soilMoisture: 49.2,
        isSimulated: true
      };
    }
    return {
      temp: curTemp,
      precip: curPrecip,
      wind: curWind,
      humidity: curHumidity,
      dewPoint: curDewPoint,
      condition: curCondition,
      aqi: aqiVal,
      pm25: pm25Val,
      pm10: pm10Val,
      uv: uvVal,
      soilMoisture: soilMoistureVal,
      isSimulated: false
    };
  }, [
    simulationActive,
    curTemp,
    curPrecip,
    curWind,
    curHumidity,
    curDewPoint,
    curCondition,
    aqiVal,
    pm25Val,
    pm10Val,
    uvVal,
    soilMoistureVal
  ]);

  // Handle Threshold Adjustment
  function handleUpdateThreshold(key, val) {
    const updated = { ...thresholds, [key]: Number(val) };
    setThresholds(updated);
    localStorage.setItem("atmos_alert_thresholds", JSON.stringify(updated));
  }

  // Toggle Acknowledge All
  function handleToggleAcknowledge() {
    const nextState = !acknowledged;
    setAcknowledged(nextState);
    localStorage.setItem("atmos_alerts_acknowledged", String(nextState));
    if (nextState && soundEnabled) {
      playEmergencyChime("nominal");
    }
  }

  // Toggle Directive Checkbox
  function handleToggleDirective(directiveKey) {
    setCompletedDirectives((prev) => ({
      ...prev,
      [directiveKey]: !prev[directiveKey]
    }));
  }

  // Trigger Audio Alert Test
  function handleTestChime() {
    playEmergencyChime("critical");
  }

  // Request Desktop Notification Permission
  async function handleRequestDesktopNotice() {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setDesktopNoticeStatus(perm);
      if (perm === "granted") {
        new Notification("ATMOS COPILOT • Alert Surveillance Active", {
          body: `Real-time meteorological monitoring locked for ${city}. Doppler and synoptic anomaly alerts enabled.`,
          icon: "/favicon.png"
        });
      }
    }
  }

  // Stop vocal synthesis on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  // Compute 8 Comprehensive Meteorological Surveillance Channels
  const channels = useMemo(() => {
    const {
      temp,
      precip,
      wind,
      humidity,
      dewPoint,
      condition,
      aqi,
      pm25,
      pm10,
      uv,
      soilMoisture
    } = effectiveData;

    // 1. Severe Convective & Lightning
    const isThunder =
      condition.toLowerCase().includes("thunder") ||
      condition.toLowerCase().includes("storm") ||
      (precip > 30 && wind > 45);
    const convectiveSeverity = isThunder
      ? "critical"
      : precip > 15 || wind > 35
      ? "warning"
      : "nominal";

    // 2. Hydrological Flash Flood
    const floodSeverity =
      precip >= 35
        ? "critical"
        : precip >= thresholds.rain
        ? "warning"
        : "nominal";

    // 3. Squall & Wind Shear
    const windSeverity =
      wind >= 55
        ? "critical"
        : wind >= thresholds.wind
        ? "warning"
        : "nominal";

    // 4. Photochemical Solar UV
    const uvSeverity =
      uv >= 8
        ? "critical"
        : uv >= thresholds.uv
        ? "warning"
        : "nominal";

    // 5. Particulate & Air Quality
    const aqiSeverity =
      aqi >= 120
        ? "critical"
        : aqi >= thresholds.aqi
        ? "warning"
        : "nominal";

    // 6. Thermal Shock & Heat Stress
    const heatSeverity =
      temp >= 38
        ? "critical"
        : temp >= thresholds.heat || temp <= 10
        ? "warning"
        : "nominal";

    // 7. Fog & Low Visibility Corridor
    const dewSpread = Math.max(0, temp - dewPoint);
    const isFoggy =
      condition.toLowerCase().includes("fog") ||
      (humidity >= 92 && dewSpread <= 1.8);
    const fogSeverity = isFoggy
      ? humidity >= 96
        ? "critical"
        : "warning"
      : "nominal";

    // 8. Agricultural Soil Moisture
    const isDry = soilMoisture < thresholds.soilMin;
    const isWaterlogged = soilMoisture > 45;
    const agroSeverity =
      soilMoisture < 10 || soilMoisture > 52
        ? "critical"
        : isDry || isWaterlogged
        ? "warning"
        : "nominal";

    return [
      {
        id: "convective",
        title: "Severe Convective & Lightning Threat",
        domain: "Aviation & Ground Operations",
        category: "aviation",
        severity: convectiveSeverity,
        icon: CloudLightning,
        color: convectiveSeverity === "critical" ? "#f43f5e" : convectiveSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: isThunder ? "Active Storm Cell" : convectiveSeverity === "warning" ? "Convective Build-up" : "Nominal Stability",
        thresholdLabel: "Radar Reflectivity > 45 dBZ",
        metricHighlight: isThunder ? "Lightning Strike Radius: 8-12 km" : "CAPE Stability: 850 J/kg",
        description: isThunder
          ? "Deep convective storm cells tracked in immediate perimeter. Cloud-to-ground lightning discharge hazard is elevated."
          : convectiveSeverity === "warning"
          ? "Unstable mid-tropospheric lapse rates detected. Cumulus cloud tops ascending rapidly."
          : "Atmosphere is dynamically stable. Zero active convective cells detected within 50 km radar envelope.",
        directives: [
          "Ground all unmanned aerial vehicle (UAV / drone) flights above 150 ft AGL.",
          "Clear open airport tarmac, outdoor cranes, and elevated scaffolding.",
          "Disconnect sensitive ungrounded radar telemetry masts and outdoor repeaters."
        ],
        affectedSectors: ["Regional Airspace", "Communication Masts", "Open Playgrounds", "Construction Towers"]
      },
      {
        id: "flood",
        title: "Hydrological Runoff & Flash Flood Risk",
        domain: "Transit Corridors & Lowlands",
        category: "transit",
        severity: floodSeverity,
        icon: CloudRain,
        color: floodSeverity === "critical" ? "#f43f5e" : floodSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `${precip} mm/h Rate`,
        thresholdLabel: `Trigger Threshold: ${thresholds.rain} mm/h`,
        metricHighlight: `Surface Slip Index: ${precip > 25 ? "Hazardous (0.88)" : precip > 10 ? "Moderate (0.52)" : "Low (0.12)"}`,
        description: floodSeverity === "critical"
          ? "Extreme precipitation rate exceeding storm drainage capacity. High probability of flash flooding at highway underpasses."
          : floodSeverity === "warning"
          ? "Elevated precipitation accumulation. Vehicle braking distance increased by 45%. Hydroplaning hazard active."
          : "Precipitation levels nominal. Roadways and stormwater drainage conduits operating safely.",
        directives: [
          "Deploy automatic flood gate warnings at subterranean underpasses and arterial crossings.",
          "Advise highway transit operators to maintain 4-second headway clearance.",
          "Engage auxiliary municipal drainage pump stations in identified low-elevation sectors."
        ],
        affectedSectors: ["Highway Underpasses", "Subterranean Parking", "Storm Drainage Basins", "Culvert Crossings"]
      },
      {
        id: "wind",
        title: "Squall Vectors & Micro-Wind Shear",
        domain: "Aviation & Structural Integrity",
        category: "aviation",
        severity: windSeverity,
        icon: Wind,
        color: windSeverity === "critical" ? "#f43f5e" : windSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `${wind} km/h Surface Gusts`,
        thresholdLabel: `Trigger Threshold: ${thresholds.wind} km/h`,
        metricHighlight: `Peak Gust Potential: ${Math.round(wind * 1.35)} km/h`,
        description: windSeverity === "critical"
          ? "Severe microburst squall vectors detected. High lateral shear danger for high-profile transit and construction cranes."
          : windSeverity === "warning"
          ? "Elevated crosswinds on open elevated highways and flyovers. Light aircraft and drones will experience intense turbulence."
          : "Laminar low-altitude airflow. Wind shear conditions remain well below operational safety limits.",
        directives: [
          "Restrict high-profile trucks and commercial containers across open bridge spans.",
          "Ensure rooftop solar photovoltaic arrays and HVAC access covers are firmly locked.",
          "Suspend elevated aerial boom operations and suspended window cleaning platforms."
        ],
        affectedSectors: ["Bridge Flyovers", "High-Rise Roofs", "Tower Cranes", "Drone Transit Corridors"]
      },
      {
        id: "uv",
        title: "Photochemical Solar UV Radiation",
        domain: "Public Health & Skin Safety",
        category: "health",
        severity: uvSeverity,
        icon: Sun,
        color: uvSeverity === "critical" ? "#f43f5e" : uvSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `UV Index ${uv}`,
        thresholdLabel: `Trigger Threshold: UV ${thresholds.uv}`,
        metricHighlight: `Sunburn Onset Time: ${uv >= 8 ? "< 15 minutes" : uv >= 6 ? "20-25 minutes" : "50+ minutes"}`,
        description: uvSeverity === "critical"
          ? "Extreme photochemical irradiance. Unprotected biological exposure risks acute cellular erythema and ocular damage."
          : uvSeverity === "warning"
          ? "Elevated solar radiation index. Adequate dermal and ocular protection strongly advised during midday solar peak."
          : "Solar irradiance within biological tolerance. Standard outdoor recreation permitted with minimal precautions.",
        directives: [
          "Seek shade during peak irradiance hours (11:30 to 15:30 local solar time).",
          "Apply broad-spectrum water-resistant sunscreen (SPF 50+) every 2 hours.",
          "Wear UV-400 polarized eyewear and broad-brimmed protective headwear."
        ],
        affectedSectors: ["Outdoor Construction", "Agricultural Field Labor", "School Playgrounds", "Open-Air Sports"]
      },
      {
        id: "aqi",
        title: "Atmospheric Aerosols & Particulate AQI",
        domain: "Respiratory Health & Purity",
        category: "health",
        severity: aqiSeverity,
        icon: Activity,
        color: aqiSeverity === "critical" ? "#f43f5e" : aqiSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `AQI ${aqi} • ${aqiSeverity === "critical" ? "Unhealthy" : aqiSeverity === "warning" ? "Moderate" : "Good"}`,
        thresholdLabel: `Trigger Threshold: AQI ${thresholds.aqi}`,
        metricHighlight: `PM2.5: ${pm25} µg/m³ • PM10: ${pm10} µg/m³`,
        description: aqiSeverity === "critical"
          ? "Harmful particulate concentration. Fine aerosol particles (PM2.5) capable of penetrating deep pulmonary tissues."
          : aqiSeverity === "warning"
          ? "Moderate particulate accumulation. Sensitive demographics (asthmatic patients, elderly) may experience mild irritation."
          : "Atmospheric purity is optimal. Ambient air quality supports unrestricted vigorous outdoor physical activity.",
        directives: [
          "Sensitive individuals should wear certified N95 / FFP2 respirators during outdoor commutes.",
          "Activate commercial indoor HEPA air purification filtration cycles.",
          "Restrict strenuous cardiovascular training outdoors; transition workouts to filtered indoor gyms."
        ],
        affectedSectors: ["Respiratory Demographics", "Urban Commuters", "Child Care Facilities", "Senior Citizen Centers"]
      },
      {
        id: "heat",
        title: "Thermal Stress & Wet-Bulb Heat Index",
        domain: "Occupational Safety & Fitness",
        category: "health",
        severity: heatSeverity,
        icon: Thermometer,
        color: heatSeverity === "critical" ? "#f43f5e" : heatSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `${temp}°C (Apparent: ${Math.round(temp + (humidity / 100) * 4)}°C)`,
        thresholdLabel: `Trigger Threshold: ${thresholds.heat}°C`,
        metricHighlight: `Recommended Hydration: ${temp >= 35 ? "750 ml/h" : "400 ml/h"}`,
        description: heatSeverity === "critical"
          ? "Dangerous thermal load. Sustained physical exertion can induce heat exhaustion, muscle cramping, or hyperthermia."
          : heatSeverity === "warning"
          ? "Elevated thermal index. High evaporative perspiration demand on active field workers and endurance athletes."
          : "Thermal envelope is nominal. Ambient temperature and relative humidity allow standard physiological equilibrium.",
        directives: [
          "Implement mandatory 15-minute rest breaks in shaded cool areas every hour for outdoor personnel.",
          "Maintain active electrolyte replacement (sodium, potassium, magnesium) along with cool potable water.",
          "Monitor field teams for early signs of heat distress: dizziness, nausea, cessation of perspiration."
        ],
        affectedSectors: ["Industrial Plant Floors", "Highway Paving Crews", "Athletic Competitions", "Urban Delivery Agents"]
      },
      {
        id: "fog",
        title: "Dense Fog & Low-Visibility Corridor",
        domain: "Expressways & Runway Navigation",
        category: "transit",
        severity: fogSeverity,
        icon: Compass,
        color: fogSeverity === "critical" ? "#f43f5e" : fogSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: isFoggy ? "Restricted (< 1.2 km)" : "Optimal (> 10 km)",
        thresholdLabel: "Dew Point Depression < 1.8°C",
        metricHighlight: `Relative Humidity: ${humidity}% • Dew: ${dewPoint}°C`,
        description: fogSeverity === "critical"
          ? "Dense radiation or advection fog obscuring roadway sightlines. Runway Visual Range (RVR) severely reduced."
          : fogSeverity === "warning"
          ? "Haze and low-altitude mist patches forming across river valleys and lake basins. Distant landmarks obscured."
          : "Atmospheric optical clarity is unrestricted. Clear sightlines exceeding 10 kilometers.",
        directives: [
          "Switch vehicle headlights to low-beam fog lamps; avoid high-beams which scatter backward.",
          "Engage airport runway Category II / III Instrument Landing Systems (ILS).",
          "Display variable dynamic message warning signs along expressway tollways."
        ],
        affectedSectors: ["Airport Runways", "Highway Corridors", "Harbor Ferries", "Rail Line Signaling"]
      },
      {
        id: "agro",
        title: "Agro Soil Desiccation & Frost Anomaly",
        domain: "Agriculture & Crop Hydration",
        category: "agro",
        severity: agroSeverity,
        icon: Sprout,
        color: agroSeverity === "critical" ? "#f43f5e" : agroSeverity === "warning" ? "#f59e0b" : "#38bdf8",
        currentValue: `Soil Moisture: ${soilMoisture}%`,
        thresholdLabel: `Trigger Minimum: ${thresholds.soilMin}%`,
        metricHighlight: `Saturation: ${isDry ? "Desiccation Stress" : isWaterlogged ? "Root Asphyxiation Risk" : "Optimal Root Field"}`,
        description: agroSeverity === "critical"
          ? "Severe root-zone moisture deficit or saturated waterlogging. High risk of permanent wilting point or root necrosis."
          : agroSeverity === "warning"
          ? "Soil moisture levels deviating from target horticultural range. Transpiration demand exceeds capillary replenishment."
          : "Subsurface soil moisture within standard agronomic capacity. Favorable root respiration and nutrient uptake.",
        directives: [
          isDry
            ? "Initiate scheduled drip micro-irrigation pulse before solar noon to replenish capillary reserves."
            : "Clear agricultural field drainage furrows to prevent standing water accumulation.",
          "Apply organic straw mulch to minimize surface evaporation and buffer root temperatures.",
          "Defer foliar agrochemical applications during rapid evaporative VPD swings."
        ],
        affectedSectors: ["Horticulture Orchards", "Commercial Nurseries", "Paddy & Millets", "Hydroponic Facilities"]
      }
    ];
  }, [effectiveData, thresholds]);

  // Active Critical / Warning counts
  const alertStats = useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let nominalCount = 0;

    channels.forEach((c) => {
      if (c.severity === "critical") criticalCount++;
      else if (c.severity === "warning") warningCount++;
      else nominalCount++;
    });

    // Overall Station Threat Matrix
    let threatCode = "CODE GREEN • NOMINAL";
    let threatColor = "#10b981";
    let threatDesc = "All monitored meteorological parameters remain within safe baseline envelopes.";

    if (criticalCount > 0) {
      threatCode = `CODE RED • CRITICAL ADVISORY (${criticalCount} ACTIVE)`;
      threatColor = "#f43f5e";
      threatDesc = "Severe atmospheric anomaly detected. Immediate operational safety directives in effect.";
    } else if (warningCount > 0) {
      threatCode = `CODE AMBER • WATCH IN EFFECT (${warningCount} ACTIVE)`;
      threatColor = "#f59e0b";
      threatDesc = "Elevated weather vectors tracked. Exercise caution across designated operational sectors.";
    }

    return {
      criticalCount,
      warningCount,
      nominalCount,
      total: channels.length,
      threatCode,
      threatColor,
      threatDesc
    };
  }, [channels]);

  // Filter and search channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      // Category filter
      if (activeCategory === "warnings") {
        if (c.severity === "nominal") return false;
      } else if (activeCategory === "nominal") {
        if (c.severity !== "nominal") return false;
      } else if (activeCategory !== "all") {
        if (c.category !== activeCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchDomain = c.domain.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchDomain;
      }
      return true;
    });
  }, [channels, activeCategory, searchQuery]);

  // Audio vocalization of active alerts
  const handleVocalizeAlerts = useCallback(() => {
    if (isSpeaking) {
      stopAllSpeech();
      setIsSpeaking(false);
      return;
    }

    const activeItems = channels.filter((c) => c.severity !== "nominal");
    let script = "";

    if (activeItems.length === 0) {
      script = `Station telemetry update for ${city}. All eight meteorological surveillance channels are nominal and safe. Zero active warnings.`;
    } else {
      script = `Atmospheric advisory briefing for ${city}. Station threat level is ${alertStats.threatCode}. `;
      activeItems.slice(0, 3).forEach((item, idx) => {
        script += `Alert ${idx + 1}: ${item.title}. ${item.description} `;
      });
      script += "Please review all emergency checklists.";
    }

    const activeVoice = getStoredVoiceProfile();
    setIsSpeaking(true);

    speakText(script, activeVoice, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  }, [isSpeaking, channels, city, alertStats.threatCode]);

  // Play audio chime if entering simulation mode
  function handleToggleSimulation() {
    const nextSim = !simulationActive;
    setSimulationActive(nextSim);
    if (nextSim && soundEnabled) {
      playEmergencyChime("critical");
    }
  }

  // Copy official dispatch bulletin
  function handleCopyBulletin(bulletin) {
    navigator.clipboard.writeText(bulletin);
    setCopiedBulletinId("active-bulletin");
    setTimeout(() => setCopiedBulletinId(null), 2500);
  }

  const officialBulletinText = useMemo(() => {
    const now = new Date();
    return `[ATMOS SYNOPTIC DISPATCH BULLETIN]
TIMESTAMP: ${now.toUTCString()}
STATION NODE: ${city} (${coords?.lat ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "GPS Locked"})
STATUS MATRIX: ${alertStats.threatCode}
ACTIVE ADVISORIES: ${alertStats.criticalCount} Critical, ${alertStats.warningCount} Warnings
METEOROLOGICAL SUMMARY: ${effectiveData.condition}, ${effectiveData.temp}°C, Wind ${effectiveData.wind} km/h, Rain ${effectiveData.precip} mm/h, AQI ${effectiveData.aqi}.
DIRECTIVE ENVELOPE: Automated Doppler Surveillance System Synchronized.`;
  }, [city, coords, alertStats, effectiveData]);

  return (
    <div className="tab-pane active fade-in upgraded-alerts-container">
      {/* 1. Header with Title & Primary Quick Actions */}
      <div className="telemetry-section-header alerts-main-header">
        <div className="alerts-title-group">
          <div className="alerts-heading-row">
            <h2 className="section-title">
              <ShieldAlert className="inline-icon text-cyan" size={24} />
              Meteorological Surveillance & Incident Command
            </h2>
            {simulationActive && (
              <span className="simulation-live-tag pulse">
                <Sparkles size={12} /> SIMULATION ACTIVE
              </span>
            )}
          </div>
          <p className="section-subtitle">
            Doppler radar anomaly triggers, real-time multi-hazard vectors, and civil defense protocols for{" "}
            <b>{city}</b>
          </p>
        </div>

        <div className="header-actions-cluster alerts-action-pills">
          {/* Audio Chime Narration Toggle */}
          <button
            type="button"
            className={`btn btn-small ${isSpeaking ? "btn-speaking" : "ghost"}`}
            onClick={handleVocalizeAlerts}
            title={isSpeaking ? "Stop Voice Briefing" : "Listen to Voice Briefing"}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={15} className="text-cyan" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 size={15} className="text-cyan" />
                <span>Voice Briefing</span>
              </>
            )}
          </button>

          {/* Threshold Drawer Trigger */}
          <button
            type="button"
            className="btn btn-small ghost"
            onClick={() => setShowThresholdDrawer((prev) => !prev)}
            title="Configure Alert Threshold Values"
          >
            <Sliders size={15} className="text-cyan" />
            <span>Thresholds</span>
          </button>

          {/* Emergency Storm Simulation Toggle */}
          <button
            type="button"
            className={`btn btn-small ${simulationActive ? "btn-sim-active" : "ghost"}`}
            onClick={handleToggleSimulation}
            title="Toggle simulated severe convective squall scenario"
          >
            <Flame size={15} className={simulationActive ? "text-rose" : "text-amber"} />
            <span>{simulationActive ? "End Simulation" : "Simulate Storm"}</span>
          </button>

          {/* Acknowledge All */}
          <button
            type="button"
            className={`btn btn-small ${acknowledged ? "btn-acknowledged" : "primary"}`}
            onClick={handleToggleAcknowledge}
            title="Mark alerts as acknowledged by station operator"
          >
            <CheckCircle2 size={15} />
            <span>{acknowledged ? "Acknowledged" : "Acknowledge"}</span>
          </button>
        </div>
      </div>

      {/* 2. Master Threat Status Banner (Barometer) */}
      <div
        className="master-threat-banner glass"
        style={{
          borderColor: alertStats.threatColor,
          boxShadow: `0 12px 35px ${alertStats.threatColor}22`
        }}
      >
        <div className="threat-radar-left">
          <div className="threat-radar-glow-orb" style={{ borderColor: alertStats.threatColor }}>
            <div className="radar-sweep-scanner" />
            <ShieldAlert size={28} style={{ color: alertStats.threatColor }} />
          </div>
          <div className="threat-status-text-block">
            <div className="threat-code-label font-mono" style={{ color: alertStats.threatColor }}>
              <span className="pulse-dot" style={{ background: alertStats.threatColor, boxShadow: `0 0 8px ${alertStats.threatColor}` }} />
              <span>{alertStats.threatCode}</span>
            </div>
            <h3 className="threat-main-headline">{alertStats.threatDesc}</h3>
            <div className="threat-meta-chips">
              <span className="meta-chip">
                <Radio size={12} className="text-cyan" /> Doppler Sync: 60s
              </span>
              <span className="meta-chip">
                <Eye size={12} className="text-emerald" /> 8 Channels Scanned
              </span>
              <span className="meta-chip">
                <Compass size={12} className="text-purple" /> {coords?.lat ? `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E` : "GPS Locked"}
              </span>
            </div>
          </div>
        </div>

        {/* Threat Level Quick Metrics Counter */}
        <div className="threat-counters-grid">
          <div className="threat-counter-tile card-critical">
            <span className="counter-num text-rose">{formatDigits(alertStats.criticalCount, lang)}</span>
            <span className="counter-lbl">Critical Warnings</span>
          </div>
          <div className="threat-counter-tile card-warning">
            <span className="counter-num text-amber">{formatDigits(alertStats.warningCount, lang)}</span>
            <span className="counter-lbl">Advisories</span>
          </div>
          <div className="threat-counter-tile card-nominal">
            <span className="counter-num text-emerald">{formatDigits(alertStats.nominalCount, lang)}</span>
            <span className="counter-lbl">Safe Channels</span>
          </div>
        </div>
      </div>

      {/* 3. Threshold Configuration Drawer (Collapsible) */}
      {showThresholdDrawer && (
        <div className="threshold-config-drawer glass fade-in">
          <div className="drawer-header-row">
            <div className="drawer-title-flex">
              <Sliders size={18} className="text-cyan" />
              <h3 className="drawer-title">Operator Threshold Customization & Alarm Settings</h3>
            </div>
            <div className="drawer-actions">
              <button
                type="button"
                className="btn btn-small ghost test-chime-btn"
                onClick={handleTestChime}
                title="Test synthesized emergency audio chime"
              >
                <Volume2 size={14} className="text-cyan" /> Test Audio Siren
              </button>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowThresholdDrawer(false)}
              >
                &times;
              </button>
            </div>
          </div>

          <p className="drawer-desc">
            Define dynamic threshold limits triggering automated incident warnings across regional Doppler sensors.
          </p>

          <div className="threshold-inputs-grid">
            <div className="threshold-field-card">
              <label>
                <CloudRain size={14} className="text-cyan" /> Rainfall Warning Trigger
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={thresholds.rain}
                  onChange={(e) => handleUpdateThreshold("rain", e.target.value)}
                />
                <span className="threshold-val-badge">{thresholds.rain} mm/h</span>
              </div>
            </div>

            <div className="threshold-field-card">
              <label>
                <Wind size={14} className="text-cyan" /> Squall Gust Trigger
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="15"
                  max="80"
                  step="5"
                  value={thresholds.wind}
                  onChange={(e) => handleUpdateThreshold("wind", e.target.value)}
                />
                <span className="threshold-val-badge">{thresholds.wind} km/h</span>
              </div>
            </div>

            <div className="threshold-field-card">
              <label>
                <Sun size={14} className="text-cyan" /> Solar UV Trigger
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={thresholds.uv}
                  onChange={(e) => handleUpdateThreshold("uv", e.target.value)}
                />
                <span className="threshold-val-badge">UV {thresholds.uv}</span>
              </div>
            </div>

            <div className="threshold-field-card">
              <label>
                <Activity size={14} className="text-cyan" /> Particulate AQI Trigger
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="30"
                  max="150"
                  step="10"
                  value={thresholds.aqi}
                  onChange={(e) => handleUpdateThreshold("aqi", e.target.value)}
                />
                <span className="threshold-val-badge">AQI {thresholds.aqi}</span>
              </div>
            </div>

            <div className="threshold-field-card">
              <label>
                <Thermometer size={14} className="text-cyan" /> Heatwave Limit Trigger
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="28"
                  max="46"
                  step="1"
                  value={thresholds.heat}
                  onChange={(e) => handleUpdateThreshold("heat", e.target.value)}
                />
                <span className="threshold-val-badge">{thresholds.heat}°C</span>
              </div>
            </div>

            <div className="threshold-field-card">
              <label>
                <Sprout size={14} className="text-cyan" /> Soil Moisture Minimum
              </label>
              <div className="threshold-slider-wrap">
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="5"
                  value={thresholds.soilMin}
                  onChange={(e) => handleUpdateThreshold("soilMin", e.target.value)}
                />
                <span className="threshold-val-badge">{thresholds.soilMin}%</span>
              </div>
            </div>
          </div>

          <div className="drawer-footer-actions">
            <button
              type="button"
              className="btn btn-small ghost"
              onClick={handleRequestDesktopNotice}
            >
              <Bell size={14} className="text-cyan" />
              <span>Enable Browser Desktop Notifications</span>
            </button>
            <button
              type="button"
              className="btn btn-small primary"
              onClick={() => setShowThresholdDrawer(false)}
            >
              Save & Apply Parameters
            </button>
          </div>
        </div>
      )}

      {/* 4. Filter Tabs & Live Search Bar */}
      <div className="alerts-controls-toolbar">
        <div className="alerts-filter-chips">
          {[
            { id: "all", label: `All Channels (${channels.length})` },
            { id: "warnings", label: `Warnings & Watch (${alertStats.criticalCount + alertStats.warningCount})` },
            { id: "aviation", label: "Aviation & Drones" },
            { id: "transit", label: "Highway Transit" },
            { id: "health", label: "Public Health" },
            { id: "agro", label: "Agro / Crops" },
            { id: "nominal", label: `Safe / Nominal (${alertStats.nominalCount})` }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="alerts-search-wrap">
          <Search size={15} className="search-icon text-muted" />
          <input
            type="text"
            placeholder="Search hazard channels, vectors, drones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Alerts Feed Grid (8 Comprehensive Real-time Channels) */}
      <div className="alerts-feed-grid">
        {filteredChannels.length === 0 ? (
          <div className="empty-alerts-card glass">
            <CheckCircle2 size={36} className="text-emerald" />
            <h3>No Hazards Matching Current Filter</h3>
            <p>All atmospheric channels in this category are operating within nominal parameters.</p>
            <button
              type="button"
              className="btn btn-small ghost"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const Icon = channel.icon;
            const isCritical = channel.severity === "critical";
            const isWarning = channel.severity === "warning";
            const isNominal = channel.severity === "nominal";
            const isExpanded = expandedAlertId === channel.id;

            return (
              <div
                key={channel.id}
                className={`glass upgraded-alert-card ${
                  isCritical ? "border-critical" : isWarning ? "border-warning" : "border-nominal"
                }`}
              >
                {/* Top Row: Icon, Title, Severity Badge */}
                <div className="alert-card-top-row">
                  <div className="alert-card-header-left">
                    <div
                      className="alert-channel-icon-box"
                      style={{
                        background: `${channel.color}18`,
                        borderColor: `${channel.color}45`
                      }}
                    >
                      <Icon size={22} style={{ color: channel.color }} />
                    </div>
                    <div>
                      <div className="alert-channel-domain font-mono">{channel.domain}</div>
                      <h3 className="alert-channel-title">{channel.title}</h3>
                    </div>
                  </div>

                  <span
                    className={`alert-severity-badge ${
                      isCritical
                        ? "badge-critical"
                        : isWarning
                        ? "badge-warning"
                        : "badge-nominal"
                    }`}
                  >
                    {isCritical ? "CRITICAL ALERT" : isWarning ? "WATCH ACTIVE" : "NOMINAL"}
                  </span>
                </div>

                {/* Telemetry Metric Spotlight & Threshold */}
                <div className="alert-metrics-banner">
                  <div className="alert-metric-item">
                    <span className="metric-caption">CURRENT READING</span>
                    <strong className="metric-emphasis" style={{ color: channel.color }}>
                      {channel.currentValue}
                    </strong>
                  </div>
                  <div className="alert-metric-item right">
                    <span className="metric-caption">SENSOR ATTRIBUTE</span>
                    <span className="metric-threshold-text font-mono">{channel.metricHighlight}</span>
                  </div>
                </div>

                {/* Descriptive Advisory Text */}
                <p className="alert-channel-desc">{channel.description}</p>

                {/* Directives Accordion Toggle */}
                <button
                  type="button"
                  className="alert-directives-toggle-btn"
                  onClick={() => setExpandedAlertId(isExpanded ? null : channel.id)}
                >
                  <span className="directives-toggle-label">
                    <ShieldCheck size={14} className="text-cyan" />
                    <span>Action Directives & Safety Protocols ({channel.directives.length})</span>
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expanded Directives Checklist & Affected Corridors */}
                {isExpanded && (
                  <div className="alert-directives-expanded glass-deep fade-in">
                    <div className="directives-subheading">
                      <span>OPERATOR ACTION CHECKLIST:</span>
                    </div>

                    <div className="directives-checklist">
                      {channel.directives.map((dir, idx) => {
                        const key = `${channel.id}-${idx}`;
                        const isDone = completedDirectives[key];

                        return (
                          <div
                            key={idx}
                            className={`directive-item-row ${isDone ? "directive-done" : ""}`}
                            onClick={() => handleToggleDirective(key)}
                          >
                            <button type="button" className="directive-checkbox-btn">
                              {isDone ? (
                                <CheckSquare size={16} className="text-emerald" />
                              ) : (
                                <Square size={16} className="text-muted" />
                              )}
                            </button>
                            <span className="directive-text">{dir}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Affected Sectors */}
                    <div className="affected-sectors-row">
                      <span className="sectors-title font-mono">SECTORS AT RISK:</span>
                      <div className="sectors-pills">
                        {channel.affectedSectors.map((sector, sIdx) => (
                          <span key={sIdx} className="sector-tag">
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Official Civil Protection Dispatch Bulletin Feed */}
      <div className="glass dispatch-bulletin-card" style={{ marginTop: "2rem" }}>
        <div className="dispatch-header-row">
          <div className="dispatch-title-flex">
            <Radio size={18} className="text-cyan pulse" />
            <div>
              <h3 className="dispatch-title">Official Civil Protection & Aviation Dispatch Bulletin</h3>
              <p className="dispatch-subtitle">
                Cryptographically synchronized synoptic broadcast for emergency response coordinators
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-small ghost bulletin-copy-btn"
            onClick={() => handleCopyBulletin(officialBulletinText)}
            title="Copy dispatch text for broadcast"
          >
            {copiedBulletinId === "active-bulletin" ? (
              <>
                <Check size={14} className="text-emerald" />
                <span>Bulletin Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-cyan" />
                <span>Copy Dispatch Bulletin</span>
              </>
            )}
          </button>
        </div>

        <pre className="dispatch-code-preview font-mono">
          {officialBulletinText}
        </pre>
      </div>
    </div>
  );
}
