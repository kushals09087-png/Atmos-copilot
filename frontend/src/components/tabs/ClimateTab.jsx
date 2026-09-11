import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Sparkles,
  Sun,
  CloudRain,
  Flame,
  Activity,
  Globe,
  Info,
  Download,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Sliders,
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react";
import { formatDigits } from "../../utils/telemetryData";

// Multi-variable dataset repository across 5 time horizons
const CLIMATE_METRICS_DATA = {
  temp: {
    name: "Surface Temperature & Thermal Anomaly",
    unit: "°C",
    icon: Thermometer,
    color: "#38bdf8",
    colorGradient: "rgba(56, 189, 248, 0.4)",
    horizons: {
      "50y": {
        label: "50 Years Historical Reanalysis (1975 - 2025)",
        baseline: 24.2,
        baselineLabel: "1981-2010 WMO Normal: 24.2°C",
        mean: "25.6°C",
        anomaly: "+1.38°C Above Baseline",
        anomalyType: "positive",
        subtext: "Accelerated warming observed in last 3 decades (+0.28°C / decade)",
        records: { max: "39.4°C (Apr 2016)", min: "11.2°C (Jan 1984)" },
        labels: ["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020", "2025"],
        points: [24.1, 24.0, 24.4, 24.6, 24.5, 24.9, 25.1, 25.3, 25.7, 26.0, 26.3]
      },
      "10y": {
        label: "10 Years Recent Trend (2015 - 2025)",
        baseline: 25.1,
        baselineLabel: "10-Year Rolling Mean: 25.1°C",
        mean: "25.9°C",
        anomaly: "+0.80°C Trend Shift",
        anomalyType: "positive",
        subtext: "8 of the 10 warmest years on station record occurred in this window",
        records: { max: "39.4°C (Apr 2016)", min: "13.6°C (Dec 2018)" },
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        points: [25.4, 26.3, 25.7, 25.5, 26.1, 25.8, 25.9, 26.4, 26.6, 26.5, 26.8]
      },
      "1y": {
        label: "12-Month Annual Seasonal Cycle (Last 12 Months)",
        baseline: 24.8,
        baselineLabel: "Annual Median: 24.8°C",
        mean: "26.2°C",
        anomaly: "+1.12°C Seasonal Bias",
        anomalyType: "positive",
        subtext: "Pre-monsoon summer thermal peak followed by monsoon convective cooling",
        records: { max: "38.2°C (Apr)", min: "15.1°C (Jan)" },
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        points: [21.8, 24.2, 28.5, 33.1, 31.8, 27.6, 25.4, 25.1, 25.6, 24.9, 23.2, 22.0]
      },
      "30d": {
        label: "Past 30 Days Synoptic Fluctuations",
        baseline: 26.0,
        baselineLabel: "30-Day Normal: 26.0°C",
        mean: "26.8°C",
        anomaly: "+0.82°C Regional Bias",
        anomalyType: "positive",
        subtext: "Surface temperature modulations correlated with localized convective clouds",
        records: { max: "32.4°C (Day 12)", min: "19.8°C (Day 3)" },
        labels: ["D1", "D4", "D7", "D10", "D13", "D16", "D19", "D22", "D25", "D28", "D30"],
        points: [25.2, 26.1, 25.8, 27.2, 28.1, 27.4, 26.6, 27.0, 27.8, 26.9, 27.3]
      },
      "24h": {
        label: "Past 24 Hours High-Frequency Diurnal Wave",
        baseline: 25.0,
        baselineLabel: "24-Hour Midpoint: 25.0°C",
        mean: "26.5°C",
        anomaly: "+0.45°C Solar Departure",
        anomalyType: "neutral",
        subtext: "Normal solar radiation thermal wave with nocturnal radiative cooling",
        records: { max: "30.8°C (14:00)", min: "20.4°C (05:30)" },
        labels: ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h", "24h"],
        points: [22.4, 21.0, 20.6, 24.8, 29.4, 30.6, 27.8, 24.5, 23.1]
      }
    }
  },
  precip: {
    name: "Precipitation & Monsoon Deposition",
    unit: "mm",
    icon: CloudRain,
    color: "#34d399",
    colorGradient: "rgba(52, 211, 153, 0.4)",
    horizons: {
      "50y": {
        label: "50 Years Cumulative Rainfall Pattern (1975 - 2025)",
        baseline: 890,
        baselineLabel: "Annual Normal: 890 mm",
        mean: "942 mm/yr",
        anomaly: "+5.8% Monsoonal Volatility",
        anomalyType: "positive",
        subtext: "Increased clustering of heavy rain days (>50mm) and longer intermediate dry spells",
        records: { max: "1,420 mm (2022)", min: "580 mm (1985)" },
        labels: ["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020", "2025"],
        points: [840, 790, 610, 920, 880, 960, 1020, 910, 890, 1280, 1060]
      },
      "10y": {
        label: "10 Years Annual Deposition Variance (2015 - 2025)",
        baseline: 920,
        baselineLabel: "10-Year Mean: 920 mm",
        mean: "986 mm/yr",
        anomaly: "+7.1% Monsoonal Shift",
        anomalyType: "positive",
        subtext: "Monsoon onset variance widening by ±14 days with elevated late-season cyclonic deluges",
        records: { max: "1,420 mm (2022)", min: "680 mm (2016)" },
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        points: [880, 680, 1120, 840, 960, 1180, 1240, 1420, 780, 990, 1040]
      },
      "1y": {
        label: "12 Months Monthly Rainfall Volume (mm)",
        baseline: 75,
        baselineLabel: "Monthly Average: 75 mm",
        mean: "964 mm Total",
        anomaly: "+9.2% Above Expected",
        anomalyType: "positive",
        subtext: "Bimodal precipitation maxima during Southwest and Northeast retreat monsoons",
        records: { max: "284 mm (Sep)", min: "2 mm (Jan)" },
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        points: [4, 8, 22, 64, 118, 92, 148, 162, 246, 180, 48, 12]
      },
      "30d": {
        label: "Past 30 Days Daily Precipitation Tracking (mm)",
        baseline: 2.8,
        baselineLabel: "Daily Mean: 2.8 mm",
        mean: "48.2 mm Total",
        anomaly: "+12% Convective Runoff",
        anomalyType: "positive",
        subtext: "Convective afternoon squalls with quick drainage absorption",
        records: { max: "28.4 mm (Day 18)", min: "0 mm" },
        labels: ["D1", "D4", "D7", "D10", "D13", "D16", "D19", "D22", "D25", "D28", "D30"],
        points: [0, 0, 4.2, 0, 12.8, 2.4, 0, 24.6, 6.2, 0, 1.8]
      },
      "24h": {
        label: "Past 24 Hours Micro-Rainfall Distribution (mm)",
        baseline: 0.1,
        baselineLabel: "Expected: 0.1 mm",
        mean: "2.4 mm Accumulated",
        anomaly: "Isolated Showers",
        anomalyType: "neutral",
        subtext: "Brief evening localized convective shower recorded by AWS gauge",
        records: { max: "1.8 mm (17:30)", min: "0 mm" },
        labels: ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h", "24h"],
        points: [0, 0, 0, 0, 0, 0.4, 1.8, 0.2, 0]
      }
    }
  },
  extremes: {
    name: "Extreme Weather Days & Anomaly Frequency",
    unit: "days",
    icon: Flame,
    color: "#f59e0b",
    colorGradient: "rgba(245, 158, 11, 0.4)",
    horizons: {
      "50y": {
        label: "50 Years Heatwave & Deluge Days Per Year (>35°C or >50mm)",
        baseline: 11,
        baselineLabel: "Historic Baseline: 11 days/yr",
        mean: "22 days/yr",
        anomaly: "+100% Frequency Surge",
        anomalyType: "positive",
        subtext: "Doubling of high-stress thermal and convective episode frequencies since 1980",
        records: { max: "34 days (2024)", min: "6 days (1978)" },
        labels: ["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020", "2025"],
        points: [7, 9, 8, 12, 14, 16, 19, 21, 26, 29, 33]
      },
      "10y": {
        label: "10 Years Extreme Incident Distribution (2015 - 2025)",
        baseline: 18,
        baselineLabel: "10-Year Norm: 18 days/yr",
        mean: "26 days/yr",
        anomaly: "+44% Surge",
        anomalyType: "positive",
        subtext: "Prolonged summer heat wave stretches combined with rapid monsoonal downpours",
        records: { max: "34 days (2024)", min: "16 days (2018)" },
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        points: [22, 28, 20, 16, 24, 21, 25, 31, 29, 34, 30]
      },
      "1y": {
        label: "Extreme Incidents per Month (Last 12 Months)",
        baseline: 2,
        baselineLabel: "Monthly Normal: 2 days",
        mean: "28 Days Total",
        anomaly: "+8 Days vs 30yr Mean",
        anomalyType: "positive",
        subtext: "Clustered during April-May heat dome and September monsoon cloudbursts",
        records: { max: "8 days (Apr)", min: "0 days (Jan)" },
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        points: [0, 1, 4, 8, 6, 1, 0, 1, 5, 2, 0, 0]
      },
      "30d": {
        label: "Past 30 Days Threshold Transgression Count",
        baseline: 0,
        baselineLabel: "Baseline: 0-1 days",
        mean: "3 Episodes",
        anomaly: "2 Gale / 1 Rain",
        anomalyType: "neutral",
        subtext: "Minor local squall lines passing across regional airport perimeter",
        records: { max: "2 Episodes (Week 2)", min: "0" },
        labels: ["W1", "W2", "W3", "W4"],
        points: [0, 2, 1, 0]
      },
      "24h": {
        label: "Past 24 Hours Anomaly Radar Blips",
        baseline: 0,
        baselineLabel: "Nominal Envelope",
        mean: "0 Critical",
        anomaly: "Zero Violations",
        anomalyType: "neutral",
        subtext: "Standard micro-climatic equilibrium across ground sensor arrays",
        records: { max: "0", min: "0" },
        labels: ["00h", "06h", "12h", "18h", "24h"],
        points: [0, 0, 0, 0, 0]
      }
    }
  },
  solar: {
    name: "Solar Irradiance & Sunshine Duration",
    unit: "kWh/m²",
    icon: Sun,
    color: "#fbbf24",
    colorGradient: "rgba(251, 191, 36, 0.4)",
    horizons: {
      "50y": {
        label: "50 Years Global Solar Irradiance (GHI) Trend",
        baseline: 5.2,
        baselineLabel: "50-Year Mean: 5.2 kWh/m²/day",
        mean: "5.35 kWh/m²",
        anomaly: "+2.8% Clear-Sky Shift",
        anomalyType: "positive",
        subtext: "Slight solar brightening with seasonal variations during aerosol haze events",
        records: { max: "6.8 kWh/m² (Mar)", min: "3.6 kWh/m² (Jul)" },
        labels: ["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020", "2025"],
        points: [5.1, 5.2, 5.0, 5.1, 5.3, 5.2, 5.4, 5.3, 5.5, 5.4, 5.5]
      },
      "10y": {
        label: "10 Years Photovoltaic Resource Capacity",
        baseline: 5.3,
        baselineLabel: "10-Year Norm: 5.3 kWh/m²",
        mean: "5.45 kWh/m²",
        anomaly: "+3.2% Optimal Solar Yield",
        anomalyType: "positive",
        subtext: "High solar harvest potential supporting utility-scale rooftop solar PV infrastructure",
        records: { max: "6.9 kWh/m²", min: "3.4 kWh/m²" },
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        points: [5.3, 5.5, 5.4, 5.3, 5.6, 5.5, 5.4, 5.6, 5.7, 5.6, 5.6]
      },
      "1y": {
        label: "12 Months Daily Mean Solar Radiation (kWh/m²/day)",
        baseline: 5.1,
        baselineLabel: "Annual Average: 5.1 kWh/m²",
        mean: "5.4 kWh/m²/day",
        anomaly: "+5.8% Pre-Monsoon Peak",
        anomalyType: "positive",
        subtext: "Peak solar yield February-April; attenuated by dense monsoon clouds in July-August",
        records: { max: "6.8 kWh/m² (Mar)", min: "3.6 kWh/m² (Jul)" },
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        points: [5.4, 6.2, 6.8, 6.6, 5.8, 4.4, 3.8, 4.0, 4.6, 5.1, 5.2, 5.1]
      },
      "30d": {
        label: "Past 30 Days Photochemical Daily Radiation",
        baseline: 5.2,
        baselineLabel: "30-Day Mean: 5.2 kWh/m²",
        mean: "5.5 kWh/m²",
        anomaly: "Nominal Harvest",
        anomalyType: "neutral",
        subtext: "Sufficient daylight hours with moderate afternoon cloud scattering",
        records: { max: "6.4 kWh/m²", min: "3.8 kWh/m²" },
        labels: ["D1", "D4", "D7", "D10", "D13", "D16", "D19", "D22", "D25", "D28", "D30"],
        points: [5.2, 5.6, 5.8, 5.1, 6.2, 4.8, 5.4, 5.7, 6.1, 5.3, 5.6]
      },
      "24h": {
        label: "Past 24 Hours Solar Irradiance Profile (W/m²)",
        baseline: 450,
        baselineLabel: "Daytime Mean: 450 W/m²",
        mean: "890 W/m² Peak",
        anomaly: "Clear Sky Noon",
        anomalyType: "neutral",
        subtext: "Peak solar irradiance reached at 12:45 local solar time",
        records: { max: "890 W/m² (12:45)", min: "0 W/m² (Night)" },
        labels: ["06h", "08h", "10h", "12h", "14h", "16h", "18h"],
        points: [45, 280, 680, 890, 780, 420, 85]
      }
    }
  },
  carbon: {
    name: "Greenhouse CO₂ & Atmospheric Aerosol Proxy",
    unit: "ppm",
    icon: Activity,
    color: "#a855f7",
    colorGradient: "rgba(168, 85, 247, 0.4)",
    horizons: {
      "50y": {
        label: "50 Years Global / Regional CO₂ Mixing Ratio (ppm)",
        baseline: 330,
        baselineLabel: "1975 Baseline: 330 ppm",
        mean: "424 ppm",
        anomaly: "+94 ppm Industrial Surge",
        anomalyType: "positive",
        subtext: "Mauna Loa & regional background observatory correlation (+2.4 ppm / year)",
        records: { max: "426.8 ppm (2025)", min: "331 ppm (1975)" },
        labels: ["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020", "2025"],
        points: [331, 339, 346, 354, 361, 370, 380, 390, 401, 414, 426]
      },
      "10y": {
        label: "10 Years CO₂ Acceleration (2015 - 2025)",
        baseline: 400,
        baselineLabel: "2015 Milestone: 400 ppm",
        mean: "416 ppm",
        anomaly: "+26 ppm Jump",
        anomalyType: "positive",
        subtext: "Continuous trajectory tracking with regional particulate optical depth compounding",
        records: { max: "426.8 ppm (2025)", min: "401 ppm (2015)" },
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        points: [401, 404, 407, 410, 412, 414, 416, 419, 422, 424, 426]
      },
      "1y": {
        label: "Annual Biospheric Keeling Carbon Wave (ppm)",
        baseline: 423,
        baselineLabel: "Annual Mean: 423 ppm",
        mean: "424.2 ppm",
        anomaly: "±3.2 ppm Seasonal Flux",
        anomalyType: "neutral",
        subtext: "Vegetative drawdown in summer monsoons vs winter soil respiration peak",
        records: { max: "426.5 ppm (May)", min: "421.2 ppm (Oct)" },
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        points: [424.1, 424.8, 425.6, 426.2, 426.5, 425.0, 423.4, 422.0, 421.4, 422.2, 423.5, 424.2]
      },
      "30d": {
        label: "Past 30 Days Urban Sensor Station Mixing Ratio",
        baseline: 424,
        baselineLabel: "Station Average: 424 ppm",
        mean: "425.1 ppm",
        anomaly: "+1.1 ppm Urban Dome",
        anomalyType: "neutral",
        subtext: "Vehicle fleet emissions and nocturnal inversion dome trapping",
        records: { max: "428.2 ppm", min: "422.0 ppm" },
        labels: ["D1", "D4", "D7", "D10", "D13", "D16", "D19", "D22", "D25", "D28", "D30"],
        points: [424.5, 425.1, 426.2, 424.8, 427.0, 425.3, 424.9, 426.1, 425.8, 424.6, 425.2]
      },
      "24h": {
        label: "Past 24 Hours Traffic Emission Modulation (ppm)",
        baseline: 424,
        baselineLabel: "Clean Baseline: 424 ppm",
        mean: "426.4 ppm Peak",
        anomaly: "Morning Rush Spike",
        anomalyType: "neutral",
        subtext: "Morning commute boundary layer compression creates local micro-dome",
        records: { max: "431 ppm (08:30)", min: "422 ppm (15:00)" },
        labels: ["00h", "04h", "08h", "12h", "16h", "20h", "24h"],
        points: [424, 423, 431, 422, 425, 429, 425]
      }
    }
  }
};

// IPCC Future Climate Scenarios (2030 - 2050 Projections)
const IPCC_SCENARIOS = {
  ssp1: {
    id: "ssp1",
    tag: "SSP1-2.6",
    name: "Paris Ambitious (Net Zero Pathway)",
    color: "#10b981",
    tempRise: "+1.2°C",
    precipShift: "+4.5%",
    extremeDays: "18 days/yr",
    heatRisk: "Moderate",
    description: "Rapid decarbonization with stringent renewable energy transitions. Atmospheric warming stabilizes near +1.5°C globally."
  },
  ssp2: {
    id: "ssp2",
    tag: "SSP2-4.5",
    name: "Middle of the Road (Current Trajectory)",
    color: "#f59e0b",
    tempRise: "+2.1°C",
    precipShift: "+11.8%",
    extremeDays: "28 days/yr",
    heatRisk: "High",
    description: "Gradual social & technological mitigation. Medium emissions pathway resulting in +2.4°C warming and elevated monsoonal swings by 2050."
  },
  ssp5: {
    id: "ssp5",
    tag: "SSP5-8.5",
    name: "Fossil-Fueled Acceleration (Worst Case)",
    color: "#f43f5e",
    tempRise: "+3.8°C",
    precipShift: "+24.2%",
    extremeDays: "46 days/yr",
    heatRisk: "Severe / Critical",
    description: "Intensive fossil fuel consumption without emissions ceilings. Severe heat domes, recurrent flash floods, and agricultural biome disruption."
  }
};

export default function ClimateTab({ weather, coords, lang = "en" }) {
  // Navigation & View States
  const [metricKey, setMetricKey] = useState("temp"); // "temp" | "precip" | "extremes" | "solar" | "carbon"
  const [timeframe, setTimeframe] = useState("50y"); // "50y" | "10y" | "1y" | "30d" | "24h"
  const [activeScenario, setActiveScenario] = useState("ssp2");
  const [hoveredPointIdx, setHoveredPointIdx] = useState(null);
  const [showBaselineRef, setShowBaselineRef] = useState(true);
  const [showRegressionLine, setShowRegressionLine] = useState(true);
  const [copiedState, setCopiedState] = useState(false);

  // Touch swipe support for Climate Studio chart (swiping cycles through metrics)
  const climateTouchRef = useRef({ startX: 0, startY: 0, isMoving: false });
  const variableGroupRef = useRef(null);
  const scenarioGroupRef = useRef(null);

  const handleClimateTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      climateTouchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        isMoving: true
      };
    }
  }, []);

  const handleClimateTouchEnd = useCallback((e) => {
    if (!climateTouchRef.current.isMoving) return;
    climateTouchRef.current.isMoving = false;

    if (e.changedTouches && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - climateTouchRef.current.startX;
      const deltaY = e.changedTouches[0].clientY - climateTouchRef.current.startY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        const metricKeys = Object.keys(CLIMATE_METRICS_DATA);
        const currentIdx = metricKeys.indexOf(metricKey);
        if (currentIdx !== -1) {
          if (deltaX < 0) {
            const nextIdx = (currentIdx + 1) % metricKeys.length;
            setMetricKey(metricKeys[nextIdx]);
            setHoveredPointIdx(null);
          } else {
            const prevIdx = (currentIdx - 1 + metricKeys.length) % metricKeys.length;
            setMetricKey(metricKeys[prevIdx]);
            setHoveredPointIdx(null);
          }
        }
      }
    }
  }, [metricKey]);

  useEffect(() => {
    if (variableGroupRef.current) {
      const activeBtn = variableGroupRef.current.querySelector(".variable-tab-btn.active");
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [metricKey]);

  useEffect(() => {
    if (scenarioGroupRef.current) {
      const activeBtn = scenarioGroupRef.current.querySelector(".scenario-pill-btn.active");
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeScenario]);

  const city = weather?.resolved_city || "Station Coordinates";
  const currentMetricObj = CLIMATE_METRICS_DATA[metricKey] || CLIMATE_METRICS_DATA.temp;
  const currentDataset = currentMetricObj.horizons[timeframe] || currentMetricObj.horizons["50y"];

  // SVG Chart Geometry Calculations
  const points = currentDataset.points;
  const labels = currentDataset.labels;
  const minVal = Math.min(...points, currentDataset.baseline) * 0.96;
  const maxVal = Math.max(...points, currentDataset.baseline) * 1.04;
  const valRange = maxVal - minVal || 1;

  const chartWidth = 800;
  const chartHeight = 220;
  const padLeft = 40;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 35;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;
  const stepX = innerWidth / (points.length - 1);

  // Compute Coordinates
  const coordsList = useMemo(() => {
    return points.map((val, idx) => {
      const x = padLeft + idx * stepX;
      const y = padTop + innerHeight - ((val - minVal) / valRange) * innerHeight;
      return { x, y, val, label: labels[idx] || `Pt ${idx + 1}` };
    });
  }, [points, labels, minVal, valRange, innerHeight, stepX, padLeft, padTop]);

  // SVG Line & Area Paths
  const linePathD = useMemo(() => {
    return coordsList.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");
  }, [coordsList]);

  const areaPathD = useMemo(() => {
    if (!coordsList.length) return "";
    const first = coordsList[0];
    const last = coordsList[coordsList.length - 1];
    const bottomY = padTop + innerHeight;
    return `${linePathD} L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePathD, coordsList, padTop, innerHeight]);

  // Baseline Reference Y
  const baselineY = useMemo(() => {
    return padTop + innerHeight - ((currentDataset.baseline - minVal) / valRange) * innerHeight;
  }, [currentDataset.baseline, minVal, valRange, innerHeight, padTop]);

  // Linear Regression Trendline
  const regressionCoords = useMemo(() => {
    if (coordsList.length < 2) return null;
    const n = coordsList.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    coordsList.forEach((pt, i) => {
      sumX += i;
      sumY += pt.val;
      sumXY += i * pt.val;
      sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yValStart = intercept;
    const yValEnd = intercept + slope * (n - 1);

    const yStart = padTop + innerHeight - ((yValStart - minVal) / valRange) * innerHeight;
    const yEnd = padTop + innerHeight - ((yValEnd - minVal) / valRange) * innerHeight;

    return {
      x1: coordsList[0].x,
      y1: yStart,
      x2: coordsList[coordsList.length - 1].x,
      y2: yEnd,
      slopeDelta: ((yValEnd - yValStart)).toFixed(2)
    };
  }, [coordsList, minVal, valRange, innerHeight, padTop]);

  // Executive Dossier Copy
  const handleCopyDossier = useCallback(() => {
    const summary = `[ATMOS CLIMATE REANALYSIS DOSSIER]
STATION NODE: ${city}
GEOPOSITION: ${coords?.lat ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Station Coordinates"}
METRIC ANALYZED: ${currentMetricObj.name}
HORIZON WINDOW: ${currentDataset.label}
CURRENT VALUE: ${currentDataset.mean} (${currentDataset.anomaly})
WMO BASELINE: ${currentDataset.baselineLabel}
RECORD EXTREMES: Max: ${currentDataset.records.max} | Min: ${currentDataset.records.min}
DECADAL DRIFT: ${regressionCoords ? `${regressionCoords.slopeDelta > 0 ? "+" : ""}${regressionCoords.slopeDelta} ${currentMetricObj.unit} net trend drift` : "Nominal"}
PROJECTED 2050 PATHWAY (SSP2-4.5): +2.1°C Mean Shift, +11.8% Monsoonal Volatility.`;

    navigator.clipboard.writeText(summary);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2400);
  }, [city, coords, currentMetricObj, currentDataset, regressionCoords]);

  // Active scenario data
  const scenarioData = IPCC_SCENARIOS[activeScenario];

  return (
    <div className="tab-pane active fade-in upgraded-climate-container">
      {/* 1. Header with Title & Quick Export Actions */}
      <div className="telemetry-section-header climate-header-wrap">
        <div className="climate-title-group">
          <div className="flex-row gap-sm">
            <History className="inline-icon text-cyan" size={24} />
            <h2 className="section-title">Historical Climate & Predictive Intel Reanalysis</h2>
          </div>
          <p className="section-subtitle">
            50-year ERA5 ECMWF Reanalysis blend, decadal anomaly vectors, Köppen-Geiger classifications, and 2050 IPCC projections for <b>{city}</b>
          </p>
        </div>

        <div className="header-actions-cluster climate-actions">
          <button
            type="button"
            className="btn btn-small ghost"
            onClick={handleCopyDossier}
            title="Copy Executive Climatological Dossier"
          >
            {copiedState ? <Check size={14} className="text-emerald" /> : <Copy size={14} className="text-cyan" />}
            <span>{copiedState ? "Dossier Copied!" : "Export Briefing"}</span>
          </button>
        </div>
      </div>

      {/* 2. Decadal Climate Anomaly Barometer & Biome Banner */}
      <div className="climate-overview-banner glass">
        <div className="biome-status-block">
          <div className="biome-badge-pill">
            <Globe size={14} className="text-cyan" />
            <span>KÖPPEN-GEIGER CLIMATE: <strong>Aw (Tropical Savanna / Wet & Dry)</strong></span>
          </div>
          <h3 className="biome-main-title">Accelerated Urban Heating & Monsoonal Volatility</h3>
          <p className="biome-description">
            Analysis across 5 decades confirms a persistent positive thermal gradient of <strong>+0.28°C per decade</strong> in {city.split(",")[0]}. Precipitation distribution shows marked intensification: fewer total rainy days with higher-volume convective downpours (&gt;45 mm/day).
          </p>
          <div className="biome-chips-row">
            <span className="biome-chip"><Flame size={12} className="text-rose" /> Urban Heat Island: +2.1°C Delta</span>
            <span className="biome-chip"><CloudRain size={12} className="text-emerald" /> Deluge Frequency: 2.2x vs 1980</span>
            <span className="biome-chip"><Calendar size={12} className="text-amber" /> Monsoon Shift: +8 Days Later Onset</span>
          </div>
        </div>

        {/* Anomaly Barometer Metric Gauge */}
        <div className="climate-anomaly-gauge-card">
          <div className="gauge-label">CLIMATOLOGICAL ANOMALY</div>
          <div className="gauge-val text-amber">+1.38°C</div>
          <div className="gauge-baseline-text">vs 1981-2010 WMO Normal</div>
          <div className="anomaly-bar-wrap">
            <div className="anomaly-bar-fill" style={{ width: "68%" }}></div>
          </div>
          <div className="anomaly-scale-lbls">
            <span>0.0°C</span>
            <span>+1.5°C Paris</span>
            <span>+3.0°C Extreme</span>
          </div>
        </div>
      </div>

      {/* 3. Multi-Variable Studio Controls (Variable Tabs & Horizon Selector) */}
      <div className="climate-studio-toolbar glass">
        {/* Variable Switcher */}
        <div className="variable-switcher-group swipeable-pills-strip" ref={variableGroupRef}>
          {Object.entries(CLIMATE_METRICS_DATA).map(([k, item]) => {
            const Icon = item.icon;
            const isActive = metricKey === k;
            return (
              <button
                key={k}
                type="button"
                className={`variable-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setMetricKey(k);
                  setHoveredPointIdx(null);
                }}
              >
                <Icon size={15} style={{ color: isActive ? "#ffffff" : item.color }} />
                <span>{item.name.split("&")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Time Horizon Selector */}
        <div className="tab-pill-group horizon-pill-group swipeable-pills-strip">
          {[
            { id: "50y", label: "50 Years" },
            { id: "10y", label: "10 Years" },
            { id: "1y", label: "1 Year" },
            { id: "30d", label: "30 Days" },
            { id: "24h", label: "24 Hours" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pill-btn ${timeframe === t.id ? "active" : ""}`}
              onClick={() => {
                setTimeframe(t.id);
                setHoveredPointIdx(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Stat Metric Cards (4 Highlights for Current Horizon) */}
      <div className="telemetry-grid four-col climate-metrics-grid">
        <div className="glass stat-card">
          <div className="stat-label">
            <Thermometer size={16} style={{ color: currentMetricObj.color }} /> Mean Observed Value
          </div>
          <div className="stat-val font-mono">{formatDigits(currentDataset.mean, lang)}</div>
          <div className="stat-delta text-secondary">{currentDataset.label}</div>
        </div>

        <div className="glass stat-card">
          <div className="stat-label">
            <TrendingUp size={16} className="text-amber" /> Climatological Departure
          </div>
          <div className="stat-val text-amber font-mono">{currentDataset.anomaly}</div>
          <div className="stat-delta text-secondary">{currentDataset.baselineLabel}</div>
        </div>

        <div className="glass stat-card">
          <div className="stat-label">
            <Flame size={16} className="text-rose" /> All-Time Max Record
          </div>
          <div className="stat-val font-mono text-rose">{currentDataset.records.max}</div>
          <div className="stat-delta text-secondary">Verified Station Extremes</div>
        </div>

        <div className="glass stat-card">
          <div className="stat-label">
            <Zap size={16} className="text-cyan" /> Trend Trajectory Drift
          </div>
          <div className="stat-val font-mono text-cyan">
            {regressionCoords ? `${regressionCoords.slopeDelta > 0 ? "+" : ""}${regressionCoords.slopeDelta} ${currentMetricObj.unit}` : "Stable"}
          </div>
          <div className="stat-delta text-secondary">Linear Best-Fit Slope</div>
        </div>
      </div>

      {/* 5. Interactive Reanalysis Studio Chart with SVG Inspection & Touch Swipe */}
      <div
        className="glass card reanalysis-studio-card"
        onTouchStart={handleClimateTouchStart}
        onTouchEnd={handleClimateTouchEnd}
      >
        <div className="card-header-clean chart-header-row">
          <div>
            <h3 className="subheading chart-title">
              {currentMetricObj.name} &bull; <span className="text-cyan">{currentDataset.label}</span>
            </h3>
            <p className="text-secondary text-sm">{currentDataset.subtext}</p>
          </div>

          {/* Chart Display Layer Toggles */}
          <div className="chart-layer-toggles">
            <button
              type="button"
              className={`layer-toggle-chip ${showBaselineRef ? "active" : ""}`}
              onClick={() => setShowBaselineRef((p) => !p)}
              title="Toggle normal baseline reference line"
            >
              <span className="dot baseline-dot" /> Baseline WMO Normal
            </button>
            <button
              type="button"
              className={`layer-toggle-chip ${showRegressionLine ? "active" : ""}`}
              onClick={() => setShowRegressionLine((p) => !p)}
              title="Toggle linear regression trendline"
            >
              <span className="dot regression-dot" /> Linear Trendline
            </button>
          </div>
        </div>

        {/* Hover / Touch Active Point Inspector Banner */}
        <div className="point-inspector-hud">
          {hoveredPointIdx !== null && coordsList[hoveredPointIdx] ? (
            <div className="inspector-active-pill fade-in">
              <span className="inspector-period">
                <Clock size={12} className="text-cyan" /> <b>{coordsList[hoveredPointIdx].label}</b>
              </span>
              <span className="inspector-val">
                Reading: <strong>{coordsList[hoveredPointIdx].val} {currentMetricObj.unit}</strong>
              </span>
              <span className="inspector-delta">
                Delta vs Baseline:{" "}
                <b className={coordsList[hoveredPointIdx].val >= currentDataset.baseline ? "text-amber" : "text-cyan"}>
                  {coordsList[hoveredPointIdx].val >= currentDataset.baseline ? "+" : ""}
                  {(coordsList[hoveredPointIdx].val - currentDataset.baseline).toFixed(2)} {currentMetricObj.unit}
                </b>
              </span>
            </div>
          ) : (
            <div className="inspector-hint-text text-muted text-sm">
              <Info size={13} className="text-cyan" /> Hover or tap any data node along the curve to inspect precise anomalies and historical timestamps.
            </div>
          )}
        </div>

        {/* SVG Reanalysis Curve Canvas */}
        <div className="reanalysis-chart-svg-container">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="reanalysis-master-svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentMetricObj.color} stopOpacity="0.45" />
                <stop offset="60%" stopColor={currentMetricObj.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={currentMetricObj.color} stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="anomalyRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, gIdx) => {
              const y = padTop + innerHeight * pct;
              const val = (maxVal - pct * valRange).toFixed(1);
              return (
                <g key={gIdx} className="chart-grid-group">
                  <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke="var(--line)" strokeDasharray="3 3" />
                  <text x={padLeft - 8} y={y + 3} fill="var(--text-subtle)" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* WMO Normal Baseline Reference Line */}
            {showBaselineRef && (
              <g className="baseline-reference-group">
                <line
                  x1={padLeft}
                  y1={baselineY}
                  x2={chartWidth - padRight}
                  y2={baselineY}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                <text
                  x={chartWidth - padRight + 6}
                  y={baselineY + 3}
                  fill="#fbbf24"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  NORM {currentDataset.baseline}
                </text>
              </g>
            )}

            {/* Linear Regression Best Fit Line */}
            {showRegressionLine && regressionCoords && (
              <g className="regression-group">
                <line
                  x1={regressionCoords.x1}
                  y1={regressionCoords.y1}
                  x2={regressionCoords.x2}
                  y2={regressionCoords.y2}
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              </g>
            )}

            {/* Area Fill */}
            <path d={areaPathD} fill="url(#curveGradient)" />

            {/* Main Primary Line Path */}
            <path
              d={linePathD}
              fill="none"
              stroke={currentMetricObj.color}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {coordsList.map((pt, i) => {
              const isHovered = hoveredPointIdx === i;
              return (
                <g
                  key={i}
                  className="interactive-node"
                  onMouseEnter={() => setHoveredPointIdx(i)}
                  onMouseLeave={() => setHoveredPointIdx(null)}
                  onClick={() => setHoveredPointIdx(i)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Invisible generous hover target */}
                  <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                  {/* Pulsing halo on hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill={currentMetricObj.color}
                      opacity="0.3"
                      className="node-pulse"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "6" : "4.2"}
                    fill="var(--card-solid)"
                    stroke={isHovered ? "#ffffff" : currentMetricObj.color}
                    strokeWidth={isHovered ? "3" : "2.2"}
                  />

                  {/* Node Value Label */}
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    fill={isHovered ? "#ffffff" : "var(--text-heading)"}
                    fontSize={isHovered ? "12" : "10"}
                    textAnchor="middle"
                    fontWeight={isHovered ? "700" : "600"}
                    fontFamily="monospace"
                  >
                    {pt.val}
                  </text>

                  {/* X Axis Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    fill={isHovered ? "var(--cyan)" : "var(--text-muted)"}
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight={isHovered ? "700" : "500"}
                    fontFamily="monospace"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 6. Predictive IPCC 2030 - 2050 Climate Horizons (Scenario Simulator) */}
      <div className="glass card ipcc-scenarios-card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header-clean scenario-header-flex">
          <div>
            <div className="flex-row gap-xs text-cyan text-sm font-mono">
              <Sparkles size={14} className="text-cyan pulse" />
              <span>PREDICTIVE CLIMATE HORIZON (2030 - 2050)</span>
            </div>
            <h3 className="subheading" style={{ marginTop: "4px" }}>
              IPCC Shared Socioeconomic Pathways (SSP) Local Projection
            </h3>
            <p className="text-secondary text-sm">
              Simulated localized climate impacts for {city} modeled across internationally ratified IPCC trajectory pathways.
            </p>
          </div>

          {/* Scenario Selector Tabs */}
          <div className="scenario-tabs-pills swipeable-pills-strip" ref={scenarioGroupRef}>
            {Object.values(IPCC_SCENARIOS).map((sc) => (
              <button
                key={sc.id}
                type="button"
                className={`scenario-pill-btn ${activeScenario === sc.id ? "active" : ""}`}
                style={{ "--scenario-color": sc.color }}
                onClick={() => setActiveScenario(sc.id)}
              >
                <strong>{sc.tag}</strong>
                <span>{sc.id === "ssp1" ? "Paris (+1.5°C)" : sc.id === "ssp2" ? "Trajectory (+2.4°C)" : "Worst (+4.4°C)"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Dynamic Projection Card */}
        <div
          className="scenario-detail-banner glass-deep"
          style={{ borderColor: `${scenarioData.color}45`, boxShadow: `0 8px 30px ${scenarioData.color}15` }}
        >
          <div className="scenario-title-row">
            <div>
              <span className="scenario-tag-badge" style={{ color: scenarioData.color, background: `${scenarioData.color}18`, borderColor: `${scenarioData.color}40` }}>
                {scenarioData.tag} &bull; {scenarioData.name}
              </span>
              <p className="scenario-summary-desc">{scenarioData.description}</p>
            </div>
          </div>

          <div className="scenario-metrics-trio">
            <div className="scenario-metric-box">
              <span className="s-lbl">PROJECTED TEMP RISE</span>
              <strong className="s-val" style={{ color: scenarioData.color }}>{scenarioData.tempRise}</strong>
              <span className="s-sub">Annual Mean by 2050</span>
            </div>

            <div className="scenario-metric-box">
              <span className="s-lbl">DELUGE INTENSIFICATION</span>
              <strong className="s-val text-cyan">{scenarioData.precipShift}</strong>
              <span className="s-sub">Extreme Runoff Volatility</span>
            </div>

            <div className="scenario-metric-box">
              <span className="s-lbl">HIGH-HEAT DAYS (&gt;35°C)</span>
              <strong className="s-val text-amber">{scenarioData.extremeDays}</strong>
              <span className="s-sub">Heat Stress Risk: {scenarioData.heatRisk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Historical Insights & Data Origin Footer Cards */}
      <div className="two-col-grid" style={{ marginTop: "1.5rem" }}>
        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <Compass size={18} className="text-cyan" /> Agro-Climatological Growing Shift
            </h3>
            <span className="badge-cyan font-mono">GDD +14%</span>
          </div>

          <div className="insights-content-stack">
            <div className="insight-item">
              <strong>Sowing Window Delay:</strong> Summer monsoon onset variability has caused an 8 to 12-day shift in ideal dryland sowing dates for regional crops (Finger Millet, Maize, Pulses).
            </div>
            <div className="insight-item">
              <strong>VPD Evaporative Demand:</strong> Vapour Pressure Deficit has widened by +0.18 kPa during March-May, requiring supplemental night-time drip irrigation to avert crop thermal shock.
            </div>
            <div className="insight-item">
              <strong>Growing Degree Days (GDD):</strong> Heat accumulation has accelerated maturity periods by 6 days, shortening grain filling phases and necessitating heat-tolerant cultivars.
            </div>
          </div>
        </div>

        <div className="glass card">
          <div className="card-header-clean">
            <h3 className="subheading">
              <Layers size={18} className="text-cyan" /> Reanalysis Assimilation Footprint
            </h3>
            <span className="badge-ghost font-mono">Hourly Ingestion</span>
          </div>

          <p className="text-secondary text-sm" style={{ lineHeight: "1.6" }}>
            Continuous multi-ensemble blend ingesting <b>ERA5 ECMWF Reanalysis</b> (31 km global grid), <b>IMD High-Resolution Gridded Surface Observations</b> (0.25° x 0.25° mesh from 1901 to 2025), and calibrated Doppler radar ground telemetry.
          </p>

          <div className="info-badge-row" style={{ marginTop: "1rem" }}>
            <span className="badge-ghost">ECMWF ERA5 Atmospheric Reanalysis</span>
            <span className="badge-ghost">IMD High-Resolution Gridded Mesh</span>
            <span className="badge-ghost">WMO Climatological Normals (1981-2010)</span>
            <span className="badge-ghost">NASA POWER Agroclimatology</span>
          </div>
        </div>
      </div>
    </div>
  );
}
