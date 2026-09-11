import React, { useState, useMemo, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Navigation,
  Building2,
  Flame,
  Droplets,
  Wind,
  Zap,
  Volume2,
  VolumeX,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  Compass,
  CheckSquare,
  Square,
  Radio,
  MapPin,
  Activity,
  Info,
  Layers,
  LifeBuoy,
  Crosshair,
  Bell,
  Sparkles,
  Clock,
  ArrowUpRight,
  Mountain,
  HeartPulse
} from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";
import { speakText, stopAllSpeech, getStoredVoiceProfile } from "../../utils/vocalSynth";

/**
 * Web Audio API Dual-Tone Emergency Alert System (EAS) Siren Synthesizer
 * Plays authentic 853 Hz & 960 Hz alert broadcast tones
 */
function playEmergencySiren(type = "warning") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "disaster") {
      // EAS Broadcast Attention Signal (853 Hz + 960 Hz dual-frequency)
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(853, now);
      osc2.frequency.setValueAtTime(960, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.setValueAtTime(0.18, now + 0.55);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
    } else {
      // Rapid pulse advisory chime
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587.33, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
    }
  } catch (err) {
    console.warn("Web Audio EAS chime error:", err);
  }
}

// 72-Hour Survival Kit Default Checklist Items
const DEFAULT_CHECKLIST_ITEMS = [
  { id: "water", title: "Drinking Water (3L/person/day) + Purification Tablets", category: "Hydration", required: true },
  { id: "food", title: "Non-Perishable High-Calorie Rations (72h Supply)", category: "Nutrition", required: true },
  { id: "radio", title: "NOAA Weather Radio & Hand-Crank Dynamo Flashlight", category: "Comms", required: true },
  { id: "firstaid", title: "Waterproof Trauma Medical Kit & Sterile Dressings", category: "Medical", required: true },
  { id: "power", title: "30,000 mAh Solar Power Bank & Universal Cable Kit", category: "Energy", required: true },
  { id: "docs", title: "Waterproof Document Pouch (ID, Deeds, Prescriptions)", category: "Legal", required: true },
  { id: "light", title: "1000-Lumen Tactical Flashlight & Signal Whistle", category: "Rescue", required: false },
  { id: "ppe", title: "N95 Particulate Respirators & Heavy Rescue Gloves", category: "PPE", required: false }
];

export default function DisasterTab({ weather, coords, lang = "en" }) {
  // Live weather telemetry props
  const baseTemp = weather?.current?.temp ?? 28;
  const basePrecip = weather?.current?.precipitation ?? 0;
  const baseWind = weather?.current?.wind ?? 14;
  const baseHumidity = weather?.current?.humidity ?? 65;
  const baseUv = weather?.current?.uv_index ?? 5;
  const city = weather?.resolved_city || "Current Locality";
  const latitude = coords?.lat ?? 12.9716;
  const longitude = coords?.lon ?? 77.5946;

  // Interactive UI State
  const [isSimulated, setIsSimulated] = useState(false);
  const [copiedContactIdx, setCopiedContactIdx] = useState(null);
  const [copiedSos, setCopiedSos] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedShelterFilter, setSelectedShelterFilter] = useState("all");
  const [selectedProtocolTab, setSelectedProtocolTab] = useState("flood");
  const [activeHazardDrawer, setActiveHazardDrawer] = useState("flood");

  // 72-Hour Go-Bag Checklist with localStorage Persistence
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("atmos_disaster_kit_v2");
      return saved ? JSON.parse(saved) : ["water", "food", "radio", "power"];
    } catch {
      return ["water", "food", "radio", "power"];
    }
  });

  const toggleCheckItem = useCallback((id) => {
    setCheckedItems((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem("atmos_disaster_kit_v2", JSON.stringify(next));
      } catch (e) {
        console.warn("Error saving kit checklist:", e);
      }
      return next;
    });
  }, []);

  const checkAllItems = useCallback(() => {
    const allIds = DEFAULT_CHECKLIST_ITEMS.map((i) => i.id);
    setCheckedItems(allIds);
    localStorage.setItem("atmos_disaster_kit_v2", JSON.stringify(allIds));
  }, []);

  const resetItems = useCallback(() => {
    setCheckedItems([]);
    localStorage.setItem("atmos_disaster_kit_v2", JSON.stringify([]));
  }, []);

  // Effective values considering simulation drill mode
  const currentTemp = isSimulated ? 34.2 : baseTemp;
  const precip = isSimulated ? 52.4 : basePrecip;
  const windSpeed = isSimulated ? 84.0 : baseWind;
  const humidity = isSimulated ? 94 : baseHumidity;

  // Threat Level Logic (4-Tier Standard)
  const threatCalculation = useMemo(() => {
    let score = 15; // Baseline environmental surveillance
    if (precip > 40 || windSpeed > 75) score += 75;
    else if (precip > 25 || windSpeed > 50) score += 55;
    else if (precip > 12 || windSpeed > 35) score += 35;
    else if (precip > 4 || windSpeed > 24) score += 15;

    if (currentTemp > 40) score += 20;
    else if (currentTemp > 36) score += 10;

    score = Math.min(100, Math.max(10, score));

    if (score >= 80) {
      return {
        level: 4,
        code: "LEVEL 4 • CRITICAL DISASTER EMERGENCY",
        statusClass: "critical",
        badge: "CODE RED • CATASTROPHIC RISK",
        title: "Severe Cyclonic Cloudburst & Flash Flood Deluge",
        summary: `Extreme convective radar cells detected over ${city}. Torrential runoff exceeding drainage thresholds with gale-force wind shear. Immediate civil defense safety protocols activated.`,
        evacStatus: "IMMEDIATE EVACUATION DIRECTIVE",
        popAtRisk: "34,200 Persons",
        radarLeadTime: "12 min to Peak Core",
        score
      };
    } else if (score >= 50) {
      return {
        level: 3,
        code: "LEVEL 3 • SEVERE HAZARD WARNING",
        statusClass: "warning",
        badge: "CODE ORANGE • SEVERE ADVISORY",
        title: "Squall Vector & Hydro-Runoff Warning",
        summary: `Elevated convective instability detected in the ${city} sector. Sustained gusts and intense rain bands may cause localized waterlogging along arterial underpasses.`,
        evacStatus: "STANDBY & SECURE PERIMETERS",
        popAtRisk: "11,500 Persons",
        radarLeadTime: "28 min to Core Arrival",
        score
      };
    } else if (score >= 30) {
      return {
        level: 2,
        code: "LEVEL 2 • ADVISORY WATCH",
        statusClass: "advisory",
        badge: "CODE YELLOW • WATCH IN EFFECT",
        title: "Sub-Synoptic Convective Watch",
        summary: `Atmospheric sounding indicates moderate moisture advection. Localized squalls and runoff may develop. Commercial and transit operations remain under active radar sweep.`,
        evacStatus: "MONITOR LIVE TELEMETRY",
        popAtRisk: "2,800 Persons",
        radarLeadTime: "45 min Surveillance Window",
        score
      };
    } else {
      return {
        level: 1,
        code: "LEVEL 1 • NOMINAL SURVEILLANCE",
        statusClass: "online",
        badge: "CODE GREEN • ALL CLEAR",
        title: "Stable Atmospheric Envelope",
        summary: `Telemetry across ${city} indicates baseline surface stability. Zero convective squall cells or flash-flood hydrological risks detected within a 60 km radius.`,
        evacStatus: "NORMAL CIVILIAN EQUILIBRIUM",
        popAtRisk: "0 Persons",
        radarLeadTime: "60+ min Clear Horizon",
        score
      };
    }
  }, [precip, windSpeed, currentTemp, city]);

  // 5 Real-Time Hazard Early Warning Radar Channels
  const hazardChannels = useMemo(() => {
    // 1. Flash Flood & Hydrological Inundation
    const floodScore = Math.min(100, Math.round(precip * 1.8 + (humidity > 80 ? 15 : 5)));
    // 2. Cyclonic Squall & Wind Shear
    const squallScore = Math.min(100, Math.round(windSpeed * 1.25));
    // 3. Convective Ground Lightning
    const lightningScore = Math.min(100, Math.round((precip > 5 ? 40 : 10) + (windSpeed > 30 ? 35 : 10)));
    // 4. Extreme Heatwave & Hyperthermia
    const heatScore = currentTemp > 30 ? Math.min(100, Math.round((currentTemp - 26) * 7.5)) : 8;
    // 5. Landslide & Slope Soil Saturation
    const slopeScore = Math.min(100, Math.round(precip * 1.4 + 12));

    return [
      {
        id: "flood",
        name: "Flash Flood & Hydrological Inundation",
        score: floodScore,
        severity: floodScore > 70 ? "CRITICAL" : floodScore > 40 ? "ELEVATED" : "LOW",
        icon: Droplets,
        color: floodScore > 70 ? "var(--red, #ef4444)" : floodScore > 40 ? "var(--amber, #f59e0b)" : "var(--cyan, #06b6d4)",
        metrics: [
          { label: "Rainfall Rate", value: `${formatDigits(precip.toFixed(1), lang)} mm/h` },
          { label: "Runoff Saturation", value: `${floodScore}%` },
          { label: "Underpass Risk", value: floodScore > 50 ? "Submergence Alert" : "Clear Drainage" },
          { label: "Hydroplane Index", value: floodScore > 40 ? "Severe Skid Hazard" : "Traction Normal" }
        ],
        directive: "Do not attempt to drive through flooded underpasses. Water 30cm deep will float most vehicles. Move to secondary floors.",
        dos: ["Ascend to elevated ground immediately", "Disconnect main circuit breaker if ground floor floods", "Keep emergency go-bag accessible"],
        donts: ["Do not cross flowing streams on foot", "Do not drive into submerged dips", "Avoid touching fallen electrical cables in puddles"]
      },
      {
        id: "squall",
        name: "Severe Cyclonic Squall & Wind Shear",
        score: squallScore,
        severity: squallScore > 70 ? "CRITICAL" : squallScore > 40 ? "ELEVATED" : "LOW",
        icon: Wind,
        color: squallScore > 70 ? "var(--red, #ef4444)" : squallScore > 40 ? "var(--amber, #f59e0b)" : "var(--cyan, #06b6d4)",
        metrics: [
          { label: "Peak Squall Gust", value: `${formatDigits(Math.round(windSpeed * 1.35), lang)} km/h` },
          { label: "Beaufort Rating", value: windSpeed > 75 ? "Force 9 Strong Gale" : windSpeed > 50 ? "Force 7 Near Gale" : "Force 4 Moderate" },
          { label: "Structural Impact", value: squallScore > 60 ? "Facade / Tree Risk" : "Stable Resistance" },
          { label: "Drone / Crane Limits", value: squallScore > 35 ? "Operations Grounded" : "Permitted Within Limit" }
        ],
        directive: "Reinforce loose rooftop structures, secure external solar arrays, and steer clear of unstable signage and aged trees.",
        dos: ["Anchor outdoor furniture and rooftop panels", "Close all weather-tight shutters and balcony doors", "Park vehicles clear of large old trees and electric lines"],
        donts: ["Do not stand near exterior glass walls or windows", "Do not operate tall boom lifts or crane equipment", "Avoid parking under construction scaffolds"]
      },
      {
        id: "lightning",
        name: "Convective Ground Lightning & Strike Vector",
        score: lightningScore,
        severity: lightningScore > 70 ? "CRITICAL" : lightningScore > 40 ? "ELEVATED" : "LOW",
        icon: Zap,
        color: lightningScore > 70 ? "var(--red, #ef4444)" : lightningScore > 40 ? "var(--amber, #f59e0b)" : "var(--cyan, #06b6d4)",
        metrics: [
          { label: "Strike Probability", value: `${lightningScore}%` },
          { label: "Est. Strikes/10min", value: lightningScore > 60 ? "24 Ground Discharges" : "0-2 Ambient" },
          { label: "30-30 Safety Rule", value: lightningScore > 40 ? "STRICT LOCKDOWN" : "Inactive" },
          { label: "Strike Radius", value: lightningScore > 50 ? "Within 4.2 km" : ">20 km Distant" }
        ],
        directive: "Follow the 30-30 rule: If time between lightning flash and thunder is <30s, seek indoor shelter. Stay sheltered for 30 min after last thunder.",
        dos: ["Stay inside fully enclosed, grounded buildings", "Unplug high-draw sensitive server equipment", "Avoid open fields and rooftop terraces"],
        donts: ["Never take shelter under isolated tall trees", "Do not hold long metal objects or poles", "Avoid plumbing fixtures and corded electronics"]
      },
      {
        id: "heat",
        name: "Extreme Heatwave & Hyperthermia",
        score: heatScore,
        severity: heatScore > 70 ? "CRITICAL" : heatScore > 40 ? "ELEVATED" : "LOW",
        icon: Flame,
        color: heatScore > 70 ? "var(--red, #ef4444)" : heatScore > 40 ? "var(--amber, #f59e0b)" : "var(--cyan, #06b6d4)",
        metrics: [
          { label: "Ambient Temp", value: `${formatDigits(currentTemp.toFixed(1), lang)}°C` },
          { label: "WBGT Index", value: `${formatDigits((currentTemp * 0.85 + 2).toFixed(1), lang)}°C` },
          { label: "Thermal Stress", value: heatScore > 60 ? "Hyperthermia Hazard" : "Comfort Envelope" },
          { label: "Outdoor Labor Limit", value: heatScore > 50 ? "Max 20 min/hr" : "Normal Work Schedule" }
        ],
        directive: "Wet-bulb globe temperature reaches critical threshold. Suspend strenuous outdoor manual labor during peak solar hours.",
        dos: ["Drink water every 20 minutes even without thirst", "Seek designated air-conditioned cooling centers", "Check on elderly neighbors and outdoor pets"],
        donts: ["Never leave children or pets inside parked vehicles", "Avoid caffeine and high-sugar dehydrating drinks", "Do not engage in unshaded midday physical exertion"]
      },
      {
        id: "slope",
        name: "Geotechnical Landslide & Hillside Saturation",
        score: slopeScore,
        severity: slopeScore > 70 ? "CRITICAL" : slopeScore > 40 ? "ELEVATED" : "LOW",
        icon: Mountain,
        color: slopeScore > 70 ? "var(--red, #ef4444)" : slopeScore > 40 ? "var(--amber, #f59e0b)" : "var(--cyan, #06b6d4)",
        metrics: [
          { label: "Soil Saturation", value: `${slopeScore}%` },
          { label: "Shear Resistance", value: slopeScore > 60 ? "Severely Degraded" : "Nominal Cohesion" },
          { label: "Ghats/Hill Road Risk", value: slopeScore > 50 ? "Rockfall Alert" : "Stable Slope" },
          { label: "Debris Flow Index", value: slopeScore > 60 ? "High Debris Potential" : "Minimal Mudflow" }
        ],
        directive: "Prolonged rainfall saturates hillside soil horizons. Inspect retention masonry and maintain emergency egress routes away from slopes.",
        dos: ["Evacuate hillside dwellings if ground cracks emerge", "Watch for sudden changes in natural creek water clarity", "Keep emergency vehicles parked facing outward"],
        donts: ["Do not cross roads covered with fresh mudflow", "Do not stay asleep in ground-floor rooms facing steep hills", "Do not clear debris while rainfall is still ongoing"]
      }
    ];
  }, [precip, windSpeed, currentTemp, humidity, lang]);

  // Designated Civil Relief Shelters with GPS Coords
  const shelters = useMemo(() => [
    {
      id: "shelter-1",
      name: "District Civil Disaster Shelter & High-School Complex",
      category: "high_elevation",
      categoryLabel: "High-Elevation Safe Ground",
      dist: "1.2 km",
      elevation: "+26m above baseline",
      walkingTime: "14 min",
      vehicleTime: "4 min",
      routeStatus: "Route Clear • Dry Corridors",
      currentOccupancy: isSimulated ? 390 : 124,
      totalCapacity: 450,
      lat: (latitude + 0.009).toFixed(4),
      lon: (longitude + 0.007).toFixed(4),
      amenities: ["50kW Diesel Genset", "RO Water Filtration (5000L)", "Pediatric Care Station", "Satellite Radio Dispatch"]
    },
    {
      id: "shelter-2",
      name: "Community Stadium & Emergency Multi-Purpose Arena",
      category: "power_hub",
      categoryLabel: "Logistics & Power Hub",
      dist: "2.8 km",
      elevation: "+18m above baseline",
      walkingTime: "32 min",
      vehicleTime: "7 min",
      routeStatus: "Heavy Traffic • Elevation Protected",
      currentOccupancy: isSimulated ? 980 : 340,
      totalCapacity: 1200,
      lat: (latitude - 0.015).toFixed(4),
      lon: (longitude + 0.012).toFixed(4),
      amenities: ["Industrial Field Kitchen", "High-Bay Helicopter Landing Zone", "Emergency Blankets & Cots", "200kW Grid Generator"]
    },
    {
      id: "shelter-3",
      name: "Government Apex Hospital & Level-1 Trauma Center",
      category: "medical",
      categoryLabel: "Critical Trauma Center",
      dist: "3.5 km",
      elevation: "+31m above baseline",
      walkingTime: "42 min",
      vehicleTime: "9 min",
      routeStatus: "Priority Ambulance Corridor Active",
      currentOccupancy: isSimulated ? 275 : 85,
      totalCapacity: 300,
      lat: (latitude + 0.021).toFixed(4),
      lon: (longitude - 0.016).toFixed(4),
      amenities: ["24/7 Trauma Operating Theaters", "Liquid Medical Oxygen", "Central Blood Bank", "Pediatric ICU & Burn Unit"]
    },
    {
      id: "shelter-4",
      name: "State Armed Police Academy & Logistics Base",
      category: "high_elevation",
      categoryLabel: "High-Elevation Safe Ground",
      dist: "4.9 km",
      elevation: "+42m above baseline",
      walkingTime: "58 min",
      vehicleTime: "12 min",
      routeStatus: "Clear Highway Bypass",
      currentOccupancy: isSimulated ? 420 : 60,
      totalCapacity: 800,
      lat: (latitude - 0.028).toFixed(4),
      lon: (longitude - 0.022).toFixed(4),
      amenities: ["Amphibious Rescue Vehicles", "Heavy Chainsaw Crews", "Cellular Tower Comms Mast", "Armed Security Escorts"]
    }
  ], [latitude, longitude, isSimulated]);

  const filteredShelters = useMemo(() => {
    if (selectedShelterFilter === "all") return shelters;
    return shelters.filter((s) => s.category === selectedShelterFilter);
  }, [shelters, selectedShelterFilter]);

  // Verified 24x7 Priority Emergency Contacts
  const emergencyContacts = [
    {
      name: "NDRF National Disaster Response Force",
      number: "011-24363260",
      alt: "9711077372",
      category: "Central Flood & Structural Rescue",
      badge: "Federal Rapid Ops",
      icon: LifeBuoy
    },
    {
      name: "State Emergency Operations Center (SEOC)",
      number: "1070",
      alt: "Toll-Free Control Room",
      category: "State Disaster Command",
      badge: "State Incident HQ",
      icon: Building2
    },
    {
      name: "Unified Emergency Response Support (NERS)",
      number: "112",
      alt: "Police, Fire, Ambulance",
      category: "Instant First Responder",
      badge: "One-Touch Dispatch",
      icon: ShieldAlert
    },
    {
      name: "NDMA National Control Room",
      number: "1078",
      alt: "National Disaster Management",
      category: "Civil Defense Authority",
      badge: "24/7 Helpline",
      icon: Radio
    },
    {
      name: "Emergency Ambulance & Trauma Service",
      number: "108",
      alt: "Toll Free Critical Care",
      category: "Emergency Medical Transport",
      badge: "Advanced Life Support",
      icon: HeartPulse
    },
    {
      name: "Fire & Chemical Hazmat Emergency",
      number: "101",
      alt: "Heavy Rescue Brigade",
      category: "Fire & Structural Extrication",
      badge: "Immediate Turnout",
      icon: Flame
    }
  ];

  // Action: Copy Contact Number
  const handleCopyContact = (number, idx) => {
    navigator.clipboard?.writeText(number);
    setCopiedContactIdx(idx);
    setTimeout(() => setCopiedContactIdx(null), 2200);
  };

  // Action: Copy SOS Distress Signal
  const handleCopySos = () => {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    const distressText = `[ATMOS EMERGENCY SOS DISTRESS BROADCAST]
TIME: ${timestamp}
LOCALITY: ${city}
GPS COORDINATES: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E
GOOGLE MAPS PIN: https://www.google.com/maps?q=${latitude.toFixed(5)},${longitude.toFixed(5)}
CURRENT THREAT LEVEL: ${threatCalculation.code}
ACTIVE HAZARD INDEX: ${threatCalculation.score}/100
RAINFALL INTENSITY: ${precip.toFixed(1)} mm/h
WIND SQUALL VELOCITY: ${windSpeed.toFixed(1)} km/h
SURFACE TEMP: ${currentTemp.toFixed(1)}°C
EVACUATION DIRECTIVE: ${threatCalculation.evacStatus}
STATUS: Civilian assistance / rescue dispatch requested.`;

    navigator.clipboard?.writeText(distressText);
    setCopiedSos(true);
    setTimeout(() => setCopiedSos(false), 2500);
  };

  // Action: Synthesized Vocal Briefing
  const handleVocalBriefing = () => {
    if (isSpeaking) {
      stopAllSpeech();
      setIsSpeaking(false);
      return;
    }

    const voice = getStoredVoiceProfile();
    const briefingText = `Attention. Atmos Disaster Incident Command report for ${city}. Current threat assessment is ${threatCalculation.code}. Threat index is ${threatCalculation.score} out of one hundred. ${threatCalculation.title}. ${threatCalculation.summary} Recommended civil protective directive: ${threatCalculation.evacStatus}. Monitor Atmos Doppler telemetry continuously.`;

    setIsSpeaking(true);
    speakText(briefingText, voice?.id || "orion", {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  // Action: EAS Siren Test Trigger
  const handleTriggerSiren = () => {
    playEmergencySiren(threatCalculation.level >= 3 ? "disaster" : "warning");
  };

  // Action: Toggle Drill Simulation
  const handleToggleSimulation = () => {
    const next = !isSimulated;
    setIsSimulated(next);
    if (next) {
      playEmergencySiren("disaster");
    }
  };

  // Progress Calculation for 72-Hour Survival Kit
  const checklistProgress = Math.round((checkedItems.length / DEFAULT_CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="tab-pane active fade-in">
      {/* 1. Header & Incident Command Bar */}
      <div className="telemetry-section-header">
        <div>
          <h2 className="section-title">
            <ShieldAlert className="inline-icon text-amber" size={26} />
            Disaster Warning & Incident Management
          </h2>
          <p className="section-subtitle">
            Real-time multi-hazard early warning radar, designated civil shelters, and 72-hour emergency survival matrix
          </p>
        </div>

        <div className="command-action-buttons">
          <button
            className={`btn btn-secondary-clean btn-sm ${isSpeaking ? "pulse-btn" : ""}`}
            onClick={handleVocalBriefing}
            title="Listen to synthesized spoken incident briefing"
          >
            {isSpeaking ? <VolumeX size={15} className="text-amber" /> : <Volume2 size={15} className="text-cyan" />}
            <span>{isSpeaking ? "Halt Briefing" : "Voice Briefing"}</span>
          </button>

          <button
            className="btn btn-secondary-clean btn-sm"
            onClick={handleTriggerSiren}
            title="Broadcast authentic EAS dual-tone siren pulse"
          >
            <Bell size={15} className="text-red" />
            <span>Test EAS Siren</span>
          </button>

          <button
            className={`btn btn-sm ${isSimulated ? "btn-danger pulse-border" : "btn-secondary-clean"}`}
            onClick={handleToggleSimulation}
            title="Simulate severe cyclonic cloudburst and flash flood scenario"
          >
            <Sparkles size={15} className={isSimulated ? "text-white" : "text-amber"} />
            <span>{isSimulated ? "Reset Drill Mode" : "Simulate Catastrophic Drill"}</span>
          </button>

          <div className={`status-pill ${threatCalculation.statusClass}`}>
            <span className="dot"></span>
            {threatCalculation.code.split("•")[0]}
          </div>
        </div>
      </div>

      {/* 2. Primary Incident Threat Hero Card */}
      <div className={`disaster-hero-card glass ${threatCalculation.level >= 3 ? "border-critical" : threatCalculation.level === 2 ? "border-amber" : ""}`}>
        <div className="disaster-hero-left">
          <div className="disaster-radar-orb-wrap">
            <div className={`disaster-radar-orb ${threatCalculation.statusClass}`}>
              <div className="radar-sweep-beam"></div>
              <ShieldAlert size={28} className="radar-center-icon" />
            </div>
            <div className="disaster-threat-badge">
              <span className="pulse-dot"></span>
              {threatCalculation.badge}
            </div>
          </div>

          <div className="disaster-hero-text">
            <div className="disaster-threat-tier">
              <span>{threatCalculation.code}</span>
              <span className="bullet-sep">•</span>
              <span className="locality-label"><MapPin size={13} className="inline-icon" /> {city}</span>
            </div>
            <h3 className="disaster-hero-title">{threatCalculation.title}</h3>
            <p className="disaster-hero-desc">{threatCalculation.summary}</p>

            <div className="hero-action-row">
              <div className="evac-directive-pill">
                <Radio size={14} className="text-amber pulse-fast" />
                <span>DIRECTIVE: <strong>{threatCalculation.evacStatus}</strong></span>
              </div>
              <button
                className="btn btn-secondary-clean btn-xs copy-sos-btn"
                onClick={handleCopySos}
                title="Copy formatted SOS Distress coordinates and telemetry for emergency responders"
              >
                {copiedSos ? <Check size={13} className="text-cyan" /> : <Copy size={13} />}
                <span>{copiedSos ? "SOS Copied to Clipboard!" : "Generate SOS Distress Signal"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="disaster-metrics-grid">
          <div className="disaster-metric-item">
            <span className="metric-lbl">DISASTER HAZARD INDEX</span>
            <div className="metric-val-row">
              <span className={`metric-val ${threatCalculation.level >= 3 ? "text-red" : threatCalculation.level === 2 ? "text-amber" : "text-cyan"}`}>
                {formatDigits(threatCalculation.score, lang)}
              </span>
              <small>/ 100</small>
            </div>
            <div className="metric-meter-track">
              <div
                className={`metric-meter-fill ${threatCalculation.level >= 3 ? "bg-red" : threatCalculation.level === 2 ? "bg-amber" : "bg-cyan"}`}
                style={{ width: `${threatCalculation.score}%` }}
              ></div>
            </div>
            <span className="metric-sub">{threatCalculation.score > 60 ? "Critical Surface Instability" : "Nominal Stability Margin"}</span>
          </div>

          <div className="disaster-metric-item">
            <span className="metric-lbl">POPULATION AT RISK</span>
            <span className="metric-val text-amber">{threatCalculation.popAtRisk}</span>
            <span className="metric-sub">Within 15km Hazard Perimeter</span>
          </div>

          <div className="disaster-metric-item">
            <span className="metric-lbl">RADAR CELL LEAD TIME</span>
            <span className="metric-val text-cyan">{threatCalculation.radarLeadTime}</span>
            <span className="metric-sub">Doppler Reflectivity Echo</span>
          </div>

          <div className="disaster-metric-item">
            <span className="metric-lbl">CIVIL RESPONSE POSTURE</span>
            <span className={`metric-val ${threatCalculation.level >= 3 ? "text-red" : "text-green"}`}>
              {threatCalculation.level >= 3 ? "DEFCON 2 RESCUE" : "MONITOR DEFCON 4"}
            </span>
            <span className="metric-sub">NDRF & SEOC Channel Active</span>
          </div>
        </div>
      </div>

      {/* 3. Multi-Hazard Early Warning Radar Channels (5 Columns) */}
      <div className="disaster-section-heading">
        <div className="d-flex align-center gap-2">
          <Activity size={18} className="text-cyan" />
          <h3 className="subheading" style={{ margin: 0 }}>Multi-Hazard Early Warning Radar (5 Active Threat Channels)</h3>
        </div>
        <span className="badge-ghost">Auto-Calculated from Live Doppler Telemetry</span>
      </div>

      <div className="hazard-channels-grid">
        {hazardChannels.map((h) => {
          const IconComp = h.icon;
          const isDrawerOpen = activeHazardDrawer === h.id;

          return (
            <div
              key={h.id}
              className={`hazard-channel-card glass ${h.severity === "CRITICAL" ? "hazard-critical" : h.severity === "ELEVATED" ? "hazard-elevated" : ""}`}
            >
              <div className="hazard-card-top">
                <div className="hazard-icon-wrap" style={{ backgroundColor: `${h.color}18`, color: h.color }}>
                  <IconComp size={20} />
                </div>
                <div className="hazard-title-wrap">
                  <span className="hazard-name">{h.name}</span>
                  <div className="hazard-status-row">
                    <span className="hazard-severity-badge" style={{ backgroundColor: `${h.color}22`, color: h.color }}>
                      {h.severity}
                    </span>
                    <span className="hazard-score-tag">{formatDigits(h.score, lang)} / 100</span>
                  </div>
                </div>
              </div>

              <div className="hazard-meter-bar">
                <div className="hazard-meter-progress" style={{ width: `${h.score}%`, backgroundColor: h.color }}></div>
              </div>

              <div className="hazard-metrics-mini-grid">
                {h.metrics.map((m, idx) => (
                  <div key={idx} className="hazard-mini-metric">
                    <span className="hmm-lbl">{m.label}</span>
                    <span className="hmm-val">{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="hazard-directive-snippet">
                <Info size={13} className="text-secondary inline-icon" />
                <span>{h.directive}</span>
              </div>

              <button
                className="hazard-expand-btn"
                onClick={() => setActiveHazardDrawer(isDrawerOpen ? null : h.id)}
              >
                <span>{isDrawerOpen ? "Hide Protective Protocols" : "View Protective Protocols (DOs & DON'Ts)"}</span>
              </button>

              {isDrawerOpen && (
                <div className="hazard-drawer-content fade-in">
                  <div className="dos-donts-grid">
                    <div className="dos-col">
                      <strong className="text-green text-xs">DO:</strong>
                      <ul>
                        {h.dos.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="donts-col">
                      <strong className="text-red text-xs">DO NOT:</strong>
                      <ul>
                        {h.donts.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Interactive Evacuation & Designated Safe Shelters Hub */}
      <div className="two-col-grid" style={{ marginTop: "1.75rem" }}>
        <div className="glass card">
          <div className="card-header-clean">
            <div>
              <h3 className="subheading">
                <Building2 size={18} className="text-cyan" /> Designated Civil Relief Shelters & Evacuation Safe Points
              </h3>
              <p className="text-secondary text-xs">
                Verified high-ground shelters equipped with generator backup, RO purification, and medical triage
              </p>
            </div>
          </div>

          {/* Shelter Category Filter Buttons */}
          <div className="shelter-filter-pills">
            <button
              className={`s-filter-pill ${selectedShelterFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedShelterFilter("all")}
            >
              All Safe Zones ({shelters.length})
            </button>
            <button
              className={`s-filter-pill ${selectedShelterFilter === "high_elevation" ? "active" : ""}`}
              onClick={() => setSelectedShelterFilter("high_elevation")}
            >
              High Elevation (2)
            </button>
            <button
              className={`s-filter-pill ${selectedShelterFilter === "medical" ? "active" : ""}`}
              onClick={() => setSelectedShelterFilter("medical")}
            >
              Medical Trauma (1)
            </button>
            <button
              className={`s-filter-pill ${selectedShelterFilter === "power_hub" ? "active" : ""}`}
              onClick={() => setSelectedShelterFilter("power_hub")}
            >
              Logistics & Power (1)
            </button>
          </div>

          <div className="shelters-list">
            {filteredShelters.map((s) => {
              const occupancyPct = Math.round((s.currentOccupancy / s.totalCapacity) * 100);
              const isNearlyFull = occupancyPct >= 85;

              return (
                <div key={s.id} className="shelter-card">
                  <div className="shelter-header">
                    <div>
                      <span className="shelter-name">{s.name}</span>
                      <div className="shelter-badges-row">
                        <span className="shelter-cat-badge">{s.categoryLabel}</span>
                        <span className="shelter-elev-badge"><Mountain size={11} className="inline-icon" /> {s.elevation}</span>
                      </div>
                    </div>
                    <div className="shelter-distance-box">
                      <span className="shelter-dist">{formatDigits(s.dist, lang)}</span>
                      <span className="shelter-eta">{s.walkingTime} walk</span>
                    </div>
                  </div>

                  {/* Real-Time Shelter Capacity Meter */}
                  <div className="shelter-capacity-container">
                    <div className="sc-header">
                      <span className="sc-lbl">Operational Shelter Capacity</span>
                      <span className={`sc-val ${isNearlyFull ? "text-amber" : "text-cyan"}`}>
                        {formatDigits(s.currentOccupancy, lang)} / {formatDigits(s.totalCapacity, lang)} Persons ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="sc-progress-bar">
                      <div
                        className={`sc-progress-fill ${isNearlyFull ? "bg-amber" : "bg-cyan"}`}
                        style={{ width: `${occupancyPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="shelter-transit-row">
                    <div className="st-info">
                      <span><strong>Vehicle ETA:</strong> {s.vehicleTime}</span>
                      <span className="bullet-sep">•</span>
                      <span className="route-passable"><ShieldCheck size={13} className="text-green inline-icon" /> {s.routeStatus}</span>
                    </div>

                    {/* 1-Click GPS Navigation Link */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary-clean btn-xs gps-nav-btn"
                    >
                      <Navigation size={13} className="text-cyan" />
                      <span>Navigate GPS</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="shelter-amenities-tags">
                    {s.amenities.map((amenity, i) => (
                      <span key={i} className="amenity-chip">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 72-Hour Survival Kit & Go-Bag Checklist */}
        <div className="glass card">
          <div className="card-header-clean">
            <div>
              <h3 className="subheading">
                <LifeBuoy size={18} className="text-amber" /> 72-Hour "Go-Bag" Survival Kit Checklist
              </h3>
              <p className="text-secondary text-xs">
                Civil defense emergency preparedness items required for 72-hour self-sufficiency during outages
              </p>
            </div>
            <div className="kit-actions-top">
              <button className="btn btn-secondary-clean btn-xs" onClick={checkAllItems}>
                Pack All
              </button>
              <button className="btn btn-secondary-clean btn-xs" onClick={resetItems}>
                Reset
              </button>
            </div>
          </div>

          {/* Survival Kit Readiness Meter */}
          <div className="kit-readiness-banner">
            <div className="krb-header">
              <span className="krb-title">Emergency Preparedness Score</span>
              <strong className={`krb-score ${checklistProgress === 100 ? "text-green" : checklistProgress >= 50 ? "text-amber" : "text-cyan"}`}>
                {checkedItems.length} / {DEFAULT_CHECKLIST_ITEMS.length} Packed ({checklistProgress}%)
              </strong>
            </div>
            <div className="krb-bar-track">
              <div
                className={`krb-bar-fill ${checklistProgress === 100 ? "bg-green" : checklistProgress >= 50 ? "bg-amber" : "bg-cyan"}`}
                style={{ width: `${checklistProgress}%` }}
              ></div>
            </div>
            <div className="krb-footer">
              <span className="krb-status-text">
                {checklistProgress === 100
                  ? "✓ MISSION READY • Comprehensive 72-Hour Survival Kit Assembled"
                  : checklistProgress >= 50
                  ? "⚠ PARTIALLY EQUIPPED • Key survival rations or power banks missing"
                  : "CRITICAL DEFICIT • High vulnerability to utility and water loss"}
              </span>
            </div>
          </div>

          {/* Interactive Checklist Items */}
          <div className="kit-checklist-list">
            {DEFAULT_CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`kit-check-row ${isChecked ? "checked" : ""}`}
                  onClick={() => toggleCheckItem(item.id)}
                >
                  <div className="kit-check-box">
                    {isChecked ? (
                      <CheckSquare size={18} className="text-cyan check-icon" />
                    ) : (
                      <Square size={18} className="text-secondary check-icon" />
                    )}
                  </div>
                  <div className="kit-check-text">
                    <span className={`kit-item-title ${isChecked ? "strikethrough" : ""}`}>{item.title}</span>
                    <span className="kit-item-cat">{item.category} {item.required && "• Mandatory"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Disaster Directive Box */}
          <div className="directive-box" style={{ marginTop: "1rem" }}>
            <div className="directive-title">
              <Sparkles size={14} className="text-cyan inline-icon" /> AI Incident Directive
            </div>
            <p className="directive-text">
              Maintain emergency communication radios on 162.400–162.550 MHz. In case of flash flooding, disconnect the primary electrical mains breaker before water reaches ground sockets. Never venture into floodwaters on foot or in light four-wheelers.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Multi-Agency Emergency Hotlines & Rapid SOS Dispatch */}
      <div className="glass card" style={{ marginTop: "1.75rem" }}>
        <div className="card-header-clean">
          <div>
            <h3 className="subheading">
              <PhoneCall size={18} className="text-red" /> Priority Civil Defense & Rescue Operations Hotlines
            </h3>
            <p className="text-secondary text-xs">
              One-touch priority telephone lines connected directly to NDRF Central, State Emergency Operations, and Trauma Care
            </p>
          </div>
          <button
            className="btn btn-secondary-clean btn-sm"
            onClick={handleCopySos}
            title="Generate full text dispatch bulletin with live coordinates and weather metrics"
          >
            {copiedSos ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
            <span>{copiedSos ? "Copied SOS to Clipboard!" : "Copy SOS Dispatch"}</span>
          </button>
        </div>

        <div className="hotlines-grid-wide">
          {emergencyContacts.map((c, idx) => {
            const IconC = c.icon;
            const isCopied = copiedContactIdx === idx;

            return (
              <div key={idx} className="hotline-card-pro">
                <div className="hl-top">
                  <div className="hl-icon-wrap">
                    <IconC size={18} />
                  </div>
                  <div className="hl-info">
                    <span className="hl-badge">{c.badge}</span>
                    <h4 className="hl-name">{c.name}</h4>
                    <span className="hl-cat">{c.category}</span>
                  </div>
                </div>

                <div className="hl-number-row">
                  <strong className="hl-number">{c.number}</strong>
                  <span className="hl-alt">{c.alt}</span>
                </div>

                <div className="hl-actions">
                  <a href={`tel:${c.number}`} className="btn btn-small emergency-btn">
                    <PhoneCall size={14} /> Call Priority
                  </a>
                  <button
                    className="btn btn-secondary-clean btn-xs copy-btn"
                    onClick={() => handleCopyContact(c.number, idx)}
                    title="Copy phone number"
                  >
                    {isCopied ? <Check size={13} className="text-cyan" /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Life-Safety Quick Reference Action Protocols */}
      <div className="glass card" style={{ marginTop: "1.75rem" }}>
        <div className="card-header-clean">
          <div>
            <h3 className="subheading">
              <Compass size={18} className="text-cyan" /> Field Life-Safety Protocols (DO's & DON'Ts)
            </h3>
            <p className="text-secondary text-xs">
              Immediate life-safety procedures vetted by State Disaster Management Authorities
            </p>
          </div>

          <div className="protocol-tab-pills">
            <button
              className={`p-tab-btn ${selectedProtocolTab === "flood" ? "active" : ""}`}
              onClick={() => setSelectedProtocolTab("flood")}
            >
              <Droplets size={13} /> Flash Flood
            </button>
            <button
              className={`p-tab-btn ${selectedProtocolTab === "squall" ? "active" : ""}`}
              onClick={() => setSelectedProtocolTab("squall")}
            >
              <Wind size={13} /> Severe Cyclone
            </button>
            <button
              className={`p-tab-btn ${selectedProtocolTab === "lightning" ? "active" : ""}`}
              onClick={() => setSelectedProtocolTab("lightning")}
            >
              <Zap size={13} /> Lightning Strike
            </button>
            <button
              className={`p-tab-btn ${selectedProtocolTab === "heat" ? "active" : ""}`}
              onClick={() => setSelectedProtocolTab("heat")}
            >
              <Flame size={13} /> Extreme Heatwave
            </button>
          </div>
        </div>

        <div className="protocol-tab-content">
          {selectedProtocolTab === "flood" && (
            <div className="protocol-detail-grid">
              <div className="protocol-box do-box">
                <div className="pb-header text-green">
                  <ShieldCheck size={16} /> WHAT TO DO (FLASH FLOOD)
                </div>
                <ul>
                  <li>Immediately ascend to the highest available building level or designated elevated ground.</li>
                  <li>Shut off primary electrical circuit breaker and LPG gas cylinder valves before waters rise.</li>
                  <li>Store clean drinking water in sealed bottles; municipal pipe water may become contaminated.</li>
                  <li>Keep emergency go-bag, essential medicines, and waterproof documents within immediate arm's reach.</li>
                </ul>
              </div>
              <div className="protocol-box dont-box">
                <div className="pb-header text-red">
                  <AlertTriangle size={16} /> WHAT NOT TO DO (FLASH FLOOD)
                </div>
                <ul>
                  <li><strong>Never drive into submerged underpasses or moving floodwaters</strong>; 60cm of water can sweep away SUVs.</li>
                  <li>Never touch submerged switchboards, power cords, or downed electrical poles.</li>
                  <li>Do not walk through moving water; 15cm of rapid current can knock down an adult.</li>
                  <li>Do not consume unboiled municipal tap water or food that came into contact with floodwater.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedProtocolTab === "squall" && (
            <div className="protocol-detail-grid">
              <div className="protocol-box do-box">
                <div className="pb-header text-green">
                  <ShieldCheck size={16} /> WHAT TO DO (SEVERE CYCLONE & SQUALL)
                </div>
                <ul>
                  <li>Stay in the innermost room or hallway on the lowest reinforced floor away from glass windows.</li>
                  <li>Pre-secure rooftop solar panels, corrugated metal sheets, water tanks, and satellite dishes.</li>
                  <li>Inspect surrounding tree limbs and prune dead overhanging branches prior to squall arrival.</li>
                  <li>Keep all cellphones, power banks, and battery lights charged to 100%.</li>
                </ul>
              </div>
              <div className="protocol-box dont-box">
                <div className="pb-header text-red">
                  <AlertTriangle size={16} /> WHAT NOT TO DO (SEVERE CYCLONE & SQUALL)
                </div>
                <ul>
                  <li>Do not stand near exterior glass sliding doors or architectural picture windows during gusts.</li>
                  <li>Do not park vehicles under aged banyan/eucalyptus trees or rusted billboard structures.</li>
                  <li>Do not venture out during the calm "eye" of the storm; violent winds will resume abruptly.</li>
                  <li>Do not operate cranes, boom lifts, or scaffolding under gusts exceeding 35 km/h.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedProtocolTab === "lightning" && (
            <div className="protocol-detail-grid">
              <div className="protocol-box do-box">
                <div className="pb-header text-green">
                  <ShieldCheck size={16} /> WHAT TO DO (LIGHTNING & CONVECTIVE STORM)
                </div>
                <ul>
                  <li>Adhere strictly to the <strong>30-30 Rule</strong>: Seek enclosed shelter if thunder is heard within 30s of flash.</li>
                  <li>Stay inside a hard-topped enclosed vehicle with windows fully closed if no building is available.</li>
                  <li>Remain sheltered indoors for a minimum of 30 minutes after hearing the final rumble of thunder.</li>
                  <li>Unplug sensitive desktop computer systems, network switches, and ungrounded televisions.</li>
                </ul>
              </div>
              <div className="protocol-box dont-box">
                <div className="pb-header text-red">
                  <AlertTriangle size={16} /> WHAT NOT TO DO (LIGHTNING & CONVECTIVE STORM)
                </div>
                <ul>
                  <li>Never shelter under an isolated tall tree or open metal shed in a park or agricultural field.</li>
                  <li>Do not use corded landline phones or touch metal plumbing fixtures during an active electrical storm.</li>
                  <li>Do not lie flat on open ground; if caught in open, crouch in a ball with feet together and hands on knees.</li>
                  <li>Avoid open bodies of water, swimming pools, wet agricultural soil, and wire fences.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedProtocolTab === "heat" && (
            <div className="protocol-detail-grid">
              <div className="protocol-box do-box">
                <div className="pb-header text-green">
                  <ShieldCheck size={16} /> WHAT TO DO (EXTREME HEATWAVE)
                </div>
                <ul>
                  <li>Drink ORS (Oral Rehydration Salts), lemon water, or coconut water frequently before feeling thirsty.</li>
                  <li>Wear lightweight, loose-fitting, light-colored breathable cotton apparel.</li>
                  <li>Cover windows exposed to direct southern/western sun with curtains or reflective blinds.</li>
                  <li>Check twice daily on vulnerable individuals, senior citizens, infants, and pets.</li>
                </ul>
              </div>
              <div className="protocol-box dont-box">
                <div className="pb-header text-red">
                  <AlertTriangle size={16} /> WHAT NOT TO DO (EXTREME HEATWAVE)
                </div>
                <ul>
                  <li><strong>Never leave children or pets unattended in parked vehicles</strong> even with cracked windows.</li>
                  <li>Avoid strenuous outdoor labor, sports, and marathon runs during peak solar hours (11 AM to 4 PM).</li>
                  <li>Do not consume high-alcohol, caffeinated, or carbonated beverages which accelerate dehydration.</li>
                  <li>Do not ignore heat exhaustion warning signs: dizziness, muscle cramps, headache, or lack of sweat.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
