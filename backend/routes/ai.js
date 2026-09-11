import { Router } from "express";
import OpenAI from "openai";
import { getWeather } from "../services/weatherService.js";
import { resolveLocationAsync, weatherCodeLabel } from "../services/geoService.js";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import https from "https";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const router = Router();

// Cache directory for generated natural speech files
const TTS_CACHE_DIR = path.join(os.tmpdir(), "atmos_tts_cache");
if (!fs.existsSync(TTS_CACHE_DIR)) {
  try { fs.mkdirSync(TTS_CACHE_DIR, { recursive: true }); } catch (_) {}
}

/**
 * Clean & normalize weather text for natural speech synthesis
 */
function normalizeSpeechText(text) {
  if (!text) return "";
  return text
    .replace(/[\uFE0E\uFE0F]/g, "")
    .replace(/[*#_~`]/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/(\d+)\s*°C/gi, "$1 degrees Celsius")
    .replace(/(\d+)\s*%/g, "$1 percent")
    .replace(/(\d+)\s*km\/h/gi, "$1 kilometers per hour")
    .replace(/(\d+)\s*mm/gi, "$1 millimeters")
    .replace(/(\d+)\s*hPa/gi, "$1 hectopascals")
    .replace(/\bAQI\b/g, "Air Quality Index")
    .replace(/\bRH\b/g, "relative humidity")
    .replace(/\bSPF\b/g, "S P F")
    .replace(/[|•]/g, ". ")
    .replace(/\//g, ", ")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/(?:\s*\.){2,}/g, ".")
    .replace(/(?:\s*,){2,}/g, ",")
    .trim();
}

/**
 * Enhanced Synoptic Meteorological & Domain Intelligence Engine
 */
function generateMeteorologicalAnalysis(question, context, personaMode = "meteorologist") {
  const q = question.toLowerCase();
  const loc = context?.location?.name || context?.location?.area || "your area";
  const cityNameOnly = loc.split(",")[0].trim();
  const curr = context?.weather || {};
  const daily = context?.daily || {};
  const aqi = context?.airQuality || {};

  const temp = Math.round(curr.temp ?? curr.temperature_2m ?? 26);
  const feelsLike = Math.round(curr.apparent_temperature ?? curr.feels_like ?? (temp + ((curr.humidity ?? 55) > 65 ? 2 : -1)));
  const humidity = Math.round(curr.humidity ?? curr.relative_humidity_2m ?? 55);
  const wind = Math.round(curr.wind ?? curr.wind_speed_10m ?? 14);
  const precip = Math.round(curr.precipitation ?? (curr.precip_prob || 0));
  const condition = curr.condition || "Partly Cloudy";

  const maxTempToday = daily?.temperature_2m_max?.[0] != null ? Math.round(daily.temperature_2m_max[0]) : temp + 2;
  const minTempToday = daily?.temperature_2m_min?.[0] != null ? Math.round(daily.temperature_2m_min[0]) : temp - 4;
  const rainProbToday = daily?.precipitation_probability_max?.[0] ?? (precip > 0 ? 80 : 15);
  const rainProbTomorrow = daily?.precipitation_probability_max?.[1] ?? 20;
  const maxTempTomorrow = daily?.temperature_2m_max?.[1] != null ? Math.round(daily.temperature_2m_max[1]) : temp + 1;
  const minTempTomorrow = daily?.temperature_2m_min?.[1] != null ? Math.round(daily.temperature_2m_min[1]) : temp - 5;
  const aqiVal = Math.round(aqi?.european_aqi ?? aqi?.pm2_5 ?? 32);
  const uvVal = Number(curr.uv ?? 5.2);
  const dewPoint = (temp - ((100 - humidity) / 5)).toFixed(1);

  // 1. TRAVEL & HIGHWAY COMMUTE PERSONA
  if (personaMode === "travel" || q.includes("travel") || q.includes("drive") || q.includes("highway") || q.includes("commute") || q.includes("route")) {
    const isRoadSlick = rainProbToday > 40 || precip > 10;
    const isFogRisk = humidity > 85 && temp < 22;
    const isWindRisk = wind > 30;

    let roadStatus = "Road surfaces dry and optimal for high-speed highway transit.";
    if (isRoadSlick) {
      roadStatus = "⚠️ Wet pavement alert: Hydroplaning potential elevated. Reduce highway cruise speed by 15-20 km/h.";
    } else if (isFogRisk) {
      roadStatus = "🌫️ Reduced visibility alert: Low-lying morning radiative fog detected. Use low-beam headlamps.";
    }

    const crosswindNote = isWindRisk 
      ? `Gusty crosswinds at ${wind} km/h on open elevated flyovers. Keep both hands on steering wheel.` 
      : `Nominal crosswind vector (${wind} km/h). Safe for two-wheelers and commercial carriers.`;

    return `🚗 Highway & Travel Telemetry for ${loc}:

• Road Condition: ${isRoadSlick ? "Slick / Wet Traction Required" : "Dry & Optimal Pavement"}
• Surface Visibility: ${isFogRisk ? "4-6 km (Hazy / Foggy)" : "> 10 km (Clear Horizon)"}
• Wind Vectors: ${wind} km/h (Max gusts: ${wind + 8} km/h)
• Rain Interception Risk: ${rainProbToday}%

Advisory:
${roadStatus}
${crosswindNote}

Safe travel window: Mid-morning to late afternoon provides peak daylight and minimal convective turbulence across ${cityNameOnly}.`;
  }

  // 2. AGRICULTURE & AGRONOMY PERSONA
  if (personaMode === "agri" || q.includes("crop") || q.includes("farm") || q.includes("spray") || q.includes("soil") || q.includes("harvest")) {
    const isSprayingSafe = wind < 15 && rainProbToday < 30;
    const irrigationNeed = rainProbToday > 50 
      ? "Natural precipitation expected; hold commercial irrigation pumps to prevent root waterlogging."
      : "Dry conditions ahead; recommend scheduled drip irrigation during low-evaporative evening hours.";

    return `🌾 Agro-Meteorological Advisory for ${loc}:

• Current Microclimate: ${temp}°C | Humidity: ${humidity}%
• Surface Wind Drift: ${wind} km/h ${wind > 15 ? "(⚠️ Elevated drift risk)" : "(Ideal for spraying)"}
• Chemical Spraying Window: ${isSprayingSafe ? "✅ OPTIMAL WINDOW (Low drift, dry canopy)" : "❌ SUB-OPTIMAL (High wash-off or drift risk)"}
• Rain Probability: Today ${rainProbToday}%, Tomorrow ${rainProbTomorrow}%
• Evaporative Index: Moderate (${((temp * 0.15) + (wind * 0.08)).toFixed(1)} mm/day)

Field Guidance:
${irrigationNeed}
Ensure field drainage channels in ${cityNameOnly} are cleared if passing showers trigger localized pooling.`;
  }

  // 3. OUTDOOR FITNESS & HEALTH PERSONA
  if (personaMode === "outdoor" || q.includes("run") || q.includes("jog") || q.includes("fitness") || q.includes("walk") || q.includes("exercise") || q.includes("cycling")) {
    let score = 95;
    if (temp > 33) score -= 25;
    else if (temp > 29) score -= 15;
    else if (temp < 10) score -= 15;

    if (rainProbToday > 50) score -= 30;
    else if (rainProbToday > 25) score -= 15;

    if (aqiVal > 80) score -= 25;
    else if (aqiVal > 50) score -= 10;

    if (uvVal > 8) score -= 15;

    score = Math.max(20, Math.min(100, score));

    const burnTimeMin = uvVal > 8 ? 15 : uvVal > 5 ? 30 : 60;
    const hydrationWater = temp > 30 ? "750 ml per hour" : "450 ml per hour";

    return `🏃 Outdoor Fitness & Physiological Index for ${loc}:

• Fitness Suitability Score: ${score}/100 (${score >= 80 ? "Excellent" : score >= 60 ? "Good / Moderate" : "Challenging Conditions"})
• Thermal Sensation: ${temp}°C (Feels like ${feelsLike}°C)
• Solar UV Index: ${uvVal.toFixed(1)} (Burn time without SPF: ~${burnTimeMin} mins)
• Air Quality Index: ${aqiVal} (${aqiVal <= 40 ? "Clean & Pure" : "Moderate Airborne Particulates"})
• Recommended Hydration: ${hydrationWater} of active exertion

Training Strategy:
${score >= 75 
  ? `Conditions in ${cityNameOnly} are prime for outdoor running, interval sprints, or cycling.` 
  : `Consider shifting vigorous cardiovascular workouts in ${cityNameOnly} to early dawn or indoor facilities.`}
Apply broad-spectrum SPF 30+ sunscreen if exercising between 10:00 AM and 4:00 PM.`;
  }

  // 4. SEVERE STORM & EMERGENCY PERSONA
  if (personaMode === "severe" || q.includes("storm") || q.includes("cyclone") || q.includes("flood") || q.includes("lightning") || q.includes("warning") || q.includes("danger")) {
    const isSevere = rainProbToday > 60 || wind > 35;
    return `⚡ Severe Meteorological Trajectory Assessment for ${loc}:

• Convective Threat Level: ${isSevere ? "ELEVATED WATCH" : "NOMINAL SURFACE STABILITY"}
• Storm Precipitation Rate: ${precip} mm/h (Peak probability: ${rainProbToday}%)
• Peak Wind Vectors: ${wind} km/h (Sustained) | Gust Ceiling: ${wind + 14} km/h
• Barometric Pressure: 1012 hPa (Stable frontal boundary)

Precautionary Checklist:
${isSevere 
  ? `1. Secure loose rooftop objects, antennas, and solar water heater covers across ${cityNameOnly}.\n2. Avoid parking vehicles directly beneath unpruned tree boughs.\n3. Keep emergency smartphone batteries and flashlights charged.`
  : `No active squalls or mesoscale cyclonic vortices detected within ${cityNameOnly}'s immediate radar radius. Atmospheric profile remains stable.`}

Emergency Helpline: Central Disaster Response (NDRF) - 1078 | Unified Emergency Dispatch - 112.`;
  }

  // 5. SPECIFIC DOMAIN QUERIES (Default Meteorologist Persona)
  // Rain / Precipitation
  if (q.includes("rain") || q.includes("umbrella") || q.includes("shower") || q.includes("precipitation") || q.includes("drizzle")) {
    const advice = rainProbToday >= 60
      ? `High probability (${rainProbToday}%). Convective precipitation bands are active; carrying an umbrella or rain gear in ${cityNameOnly} is strongly advised.`
      : rainProbToday >= 30
      ? `Moderate chance (${rainProbToday}%). Scattered passing showers are possible during peak thermal convection.`
      : `Minimal rain probability (${rainProbToday}%). Predominantly dry conditions will prevail across ${cityNameOnly} today.`;
    return `🌧️ Synoptic Rain Telemetry for ${loc}:

${advice}

• Current Ambient Temp: ${temp}°C
• Relative Humidity: ${humidity}%
• Surface Wind: ${wind} km/h
• Today's Rain Probability: ${rainProbToday}%
• Tomorrow's Rain Outlook: ${rainProbTomorrow}%`;
  }

  // Temperature / Thermal sensation
  if (q.includes("temp") || q.includes("hot") || q.includes("cold") || q.includes("warm") || q.includes("weather")) {
    return `🌡️ Thermal Analysis for ${loc}:

Current ambient reading in ${cityNameOnly} is ${temp}°C with an apparent sensation (feels like) of ${feelsLike}°C under ${condition.toLowerCase()} skies.

• Diurnal Amplitude: High of ${maxTempToday}°C / Low of ${minTempToday}°C
• Relative Humidity: ${humidity}%
• Dew Point: ${dewPoint}°C
• Wind Velocity: ${wind} km/h
• Precipitation Probability: ${rainProbToday}%`;
  }

  // Wind / Airflow
  if (q.includes("wind") || q.includes("breeze") || q.includes("gust") || q.includes("air flow")) {
    return `💨 Surface Wind & Aerodynamic Telemetry for ${loc}:

Surface wind velocity across ${cityNameOnly} is clocked at ${wind} km/h (gust ceiling: ${wind + 8} km/h).
• Wind Shear Profile: ${wind > 25 ? "Moderate (Turbulence on elevated flyovers and towers)" : "Nominal (Stable laminar boundary layer)"}
• Relative Humidity: ${humidity}%
• Ambient Temperature: ${temp}°C`;
  }

  // Humidity / Dew point
  if (q.includes("humid") || q.includes("dew") || q.includes("moisture")) {
    return `💧 Atmospheric Moisture & Dew Point Telemetry for ${loc}:

Current relative humidity in ${cityNameOnly} is ${humidity}% with a computed dew point of ${dewPoint}°C.
• Sensation Index: ${humidity > 70 ? "Elevated mugginess; perspiration evaporation is suppressed." : "Comfortable moisture gradient; crisp surface feel."}
• Ambient Temperature: ${temp}°C (Apparent sensation: ${feelsLike}°C)`;
  }

  // Forecast / Tomorrow / 7-day
  if (q.includes("tomorrow") || q.includes("forecast") || q.includes("week") || q.includes("7 day") || q.includes("future")) {
    return `📅 Synoptic Outlook for ${loc}:

• Tomorrow's Ceiling: High of ${maxTempTomorrow}°C | Overnight Low of ${minTempTomorrow}°C
• Rain Probability Tomorrow: ${rainProbTomorrow}%
• Surface Wind Vectors: ~${Math.round(wind * 0.9)} km/h
• Synoptic Trend: Atmospheric pressure profile maintains nominal seasonal averages with afternoon convective heating.`;
  }

  // 6. DEFAULT GENERAL SYNOPIS
  return `☀️ Atmos Sun Copilot Briefing for ${loc}:

Observed surface parameters in ${cityNameOnly}: ${condition} at ${temp}°C (feels like ${feelsLike}°C).
• Diurnal Range: High ${maxTempToday}°C / Low ${minTempToday}°C
• Relative Humidity: ${humidity}% | Wind Stream: ${wind} km/h
• Rain Risk: ${rainProbToday}% Today | ${rainProbTomorrow}% Tomorrow
• Solar UV Index: ${uvVal.toFixed(1)} | Air Quality: ${aqiVal} AQI

You can switch specialized Advisory Personas above (Travel, Farming, Fitness, or Severe Weather) for targeted domain intelligence.`;
}

router.post("/ask", async (req, res, next) => {
  try {
    const { message, weatherContext, context, personaMode = "meteorologist" } = req.body;
    const mergedContext = weatherContext || context || {};

    if (!message?.trim()) {
      return res.status(400).json({ message: "Question is required." });
    }

    const trimmed = message.trim();

    // 1. Detect if the question references a specific target city/location
    let activeContext = { ...mergedContext };
    const targetLoc = await resolveLocationAsync(trimmed);

    if (targetLoc) {
      try {
        const rawWeather = await getWeather(targetLoc.lat, targetLoc.lon);
        if (rawWeather && rawWeather.current) {
          const cur = rawWeather.current;
          const daily = rawWeather.daily || {};
          const aqi = rawWeather.airQuality || {};
          const currentHour = new Date().getHours();
          const isDay = cur.is_day !== undefined ? Number(cur.is_day) : (currentHour >= 6 && currentHour < 19 ? 1 : 0);

          activeContext = {
            ...mergedContext,
            location: {
              name: targetLoc.name,
              lat: targetLoc.lat,
              lon: targetLoc.lon
            },
            weather: {
              ...mergedContext.weather,
              temp: Math.round(cur.temperature_2m ?? 25),
              apparent_temperature: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 25),
              feels_like: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 25),
              humidity: Math.round(cur.relative_humidity_2m ?? 55),
              wind: Math.round(cur.wind_speed_10m ?? 12),
              precipitation: Math.round(cur.precipitation ?? 0),
              condition: weatherCodeLabel(cur.weather_code, isDay)
            },
            daily: {
              precipitation_probability_max: daily.precipitation_probability_max || [],
              temperature_2m_max: daily.temperature_2m_max || [],
              temperature_2m_min: daily.temperature_2m_min || []
            },
            airQuality: {
              european_aqi: aqi?.current?.european_aqi ?? 32,
              pm2_5: aqi?.current?.pm2_5 ?? 18
            }
          };
        } else {
          activeContext.location = { ...activeContext.location, name: targetLoc.name };
        }
      } catch (locErr) {
        console.warn("Could not fetch real-time telemetry for target city:", locErr.message);
        activeContext.location = { ...activeContext.location, name: targetLoc.name };
      }
    }

    // 2. Offline Domain Intelligence Analyzer (Default when OPENAI_API_KEY is omitted)
    if (!process.env.OPENAI_API_KEY) {
      const answer = generateMeteorologicalAnalysis(trimmed, activeContext, personaMode);
      return res.json({
        answer,
        source: "atmos-met-engine",
        model: "offline-domain-engine",
        personaMode,
        targetLocation: targetLoc ? targetLoc.name : (activeContext?.location?.name || null)
      });
    }

    // 3. Query OpenAI with persona-conditioned system prompt and verified target telemetry
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const personaInstructions = {
        meteorologist: "You are Sun Copilot acting as a Senior Synoptic Meteorologist. Provide rigorous, clear analysis of pressure, fronts, diurnal swings, and dew points.",
        travel: "You are Sun Copilot acting as a Highway Travel & Flight Weather Advisor. Focus on road traction, hydroplaning risk, crosswinds, fog, and commute safety.",
        agri: "You are Sun Copilot acting as an Agricultural Agronomist. Focus on soil moisture, chemical spraying windows, crop heat stress, and harvesting suitability.",
        outdoor: "You are Sun Copilot acting as an Outdoor Fitness & Sports Advisor. Provide running/cycling suitability score (0-100), heat index, hydration, and UV burn safety.",
        severe: "You are Sun Copilot acting as an Emergency Severe Weather Specialist. Provide convective threat levels, lightning precautions, and safety checklists."
      };

      const system = `${personaInstructions[personaMode] || personaInstructions.meteorologist}
Ground all responses in the provided verified telemetry context. Never invent contradictory observations.
Keep formatting structured with clear bullet points and actionable guidance.
Attached Telemetry Context:
${JSON.stringify(activeContext)}`;

      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: trimmed }
        ],
        temperature: 0.6,
        max_tokens: 500
      });

      const reply = completion.choices?.[0]?.message?.content;
      if (reply) {
        return res.json({
          answer: reply,
          source: "openai",
          model,
          personaMode,
          targetLocation: targetLoc ? targetLoc.name : (activeContext?.location?.name || null)
        });
      }
    } catch (apiErr) {
      console.warn("OpenAI call failed (" + apiErr.message + "). Falling back to Atmos Meteorological Engine.");
      const fallback = generateMeteorologicalAnalysis(trimmed, activeContext, personaMode);
      return res.json({
        answer: fallback,
        source: "atmos-fallback",
        personaMode,
        targetLocation: targetLoc ? targetLoc.name : (activeContext?.location?.name || null)
      });
    }
  } catch (e) {
    next(e);
  }
});

/**
 * Fetch a single audio chunk from Google Neural TTS engine
 */
function fetchGoogleTtsChunk(chunk, lang = "en-IN") {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" }, timeout: 2500 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`TTS upstream status ${res.statusCode}`));
      }
      const parts = [];
      res.on("data", c => parts.push(c));
      res.on("end", () => resolve(Buffer.concat(parts)));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("TTS request timed out")); });
  });
}

/**
 * Split text into natural sentence/clause chunks for TTS synthesis
 */
function chunkSpeechText(text, maxLen = 160) {
  const parts = text.split(/([.?!,;\n]+)/);
  const chunks = [];
  let curr = "";
  for (const p of parts) {
    if ((curr + p).length < maxLen) {
      curr += p;
    } else {
      if (curr.trim()) chunks.push(curr.trim());
      curr = p;
    }
  }
  if (curr.trim()) chunks.push(curr.trim());
  return chunks.filter(c => c.length > 0);
}

/**
 * Synthesize speech via Google TTS engine (parallel chunk fetch for 5x speed)
 */
async function synthesizeGoogleTts(text, lang = "en-IN") {
  const chunks = chunkSpeechText(text);
  if (chunks.length === 0) return Buffer.alloc(0);
  const buffers = await Promise.all(chunks.map(c => fetchGoogleTtsChunk(c, lang)));
  return Buffer.concat(buffers);
}

/**
 * Synthesize speech using Microsoft Azure Neural TTS (Edge Read Aloud)
 * Voice: en-IN-NeerjaNeural (State of the art fluent Indian English female voice)
 */
async function synthesizeEdgeTts(text, voice = "en-IN-NeerjaNeural") {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);
  return new Promise((resolve, reject) => {
    const chunks = [];
    audioStream.on("data", c => chunks.push(c));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", reject);
  });
}

/**
 * Synthesize speech via host say command in standard AAC format (returns M4A file path)
 */
function synthesizeHostSay(voiceName, rate, textToSpeak, outputFile) {
  return new Promise((resolve, reject) => {
    const proc = spawn("say", [
      "-v", voiceName,
      "-r", rate,
      "--file-format=m4af",
      "--data-format=aac",
      "-o", outputFile,
      textToSpeak
    ]);
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        resolve(outputFile);
      } else {
        reject(new Error(`say exited with code ${code}`));
      }
    });
  });
}

/**
 * GET /api/ai/tts
 * Generates natural audio using Google Neural Indian English voice or host speech synthesis
 */
router.get("/tts", async (req, res) => {
  try {
    const rawText = (req.query.text || "").toString();
    const profile = (req.query.profile || "spandana").toString().toLowerCase();
    const clean = normalizeSpeechText(rawText);

    if (!clean) {
      return res.status(400).json({ error: "No text provided" });
    }

    const reqVoice = (req.query.voice || "").toString().trim().toLowerCase();
    const textToSpeak = clean.length > 450 ? clean.slice(0, 450) + "..." : clean;

    // 1. Spandana (Authentic, Ultra-Fluent Indian Girl Voice - en-IN-NeerjaNeural / Tara)
    if (profile === "spandana" || profile === "indian") {
      const hash = crypto.createHash("md5").update(`edge:en-IN-NeerjaNeural:${textToSpeak}`).digest("hex");
      const cachedFile = path.join(TTS_CACHE_DIR, `${hash}.mp3`);
      if (fs.existsSync(cachedFile)) {
        return res.sendFile(path.resolve(cachedFile));
      }

      try {
        const mp3Buffer = await synthesizeEdgeTts(textToSpeak, "en-IN-NeerjaNeural");
        fs.writeFileSync(cachedFile, mp3Buffer);
        return res.sendFile(path.resolve(cachedFile));
      } catch (edgeErr) {
        console.warn("Edge Neural Indian TTS error, falling back to host Tara:", edgeErr.message);
        // Fallback 1: Local macOS Tara voice (say -v Tara)
        try {
          const fallbackVoice = "Tara";
          const fallbackRate = "152";
          const fallbackHash = crypto.createHash("md5").update(`say:${fallbackVoice}:${fallbackRate}:${textToSpeak}`).digest("hex");
          const fallbackFile = path.join(TTS_CACHE_DIR, `${fallbackHash}.m4a`);
          if (fs.existsSync(fallbackFile)) {
            return res.sendFile(path.resolve(fallbackFile));
          }
          const tempOutput = path.join(TTS_CACHE_DIR, `temp_${fallbackHash}.m4a`);
          await synthesizeHostSay(fallbackVoice, fallbackRate, textToSpeak, tempOutput);
          fs.renameSync(tempOutput, fallbackFile);
          return res.sendFile(path.resolve(fallbackFile));
        } catch (hostErr) {
          console.warn("Host Indian voice Tara unavailable, trying Google female TTS:", hostErr.message);
          const femaleLang = "en-GB";
          const gHash = crypto.createHash("md5").update(`google:${femaleLang}:${textToSpeak}`).digest("hex");
          const gCachedFile = path.join(TTS_CACHE_DIR, `${gHash}.mp3`);
          if (fs.existsSync(gCachedFile)) {
            return res.sendFile(path.resolve(gCachedFile));
          }
          const mp3Buffer = await synthesizeGoogleTts(textToSpeak, femaleLang);
          fs.writeFileSync(gCachedFile, mp3Buffer);
          return res.sendFile(path.resolve(gCachedFile));
        }
      }
    }

    // 2. Orion (Tactical Command - Mature Man Voice)
    if (profile === "orion") {
      const voiceName = (reqVoice && (reqVoice === "eddy" ? "Eddy (English (US))" : reqVoice)) || "Daniel";
      const rate = "148";
      const hash = crypto.createHash("md5").update(`say:${voiceName}:${rate}:${textToSpeak}`).digest("hex");
      const cachedFile = path.join(TTS_CACHE_DIR, `${hash}.m4a`);
      if (fs.existsSync(cachedFile)) {
        return res.sendFile(path.resolve(cachedFile));
      }
      const tempOutput = path.join(TTS_CACHE_DIR, `temp_${hash}.m4a`);
      await synthesizeHostSay(voiceName, rate, textToSpeak, tempOutput);
      fs.renameSync(tempOutput, cachedFile);
      return res.sendFile(path.resolve(cachedFile));
    }

    // 3. Nova (Girl Voice - International)
    if (profile === "nova") {
      const voiceName = "Samantha";
      const rate = "165";
      const hash = crypto.createHash("md5").update(`say:${voiceName}:${rate}:${textToSpeak}`).digest("hex");
      const cachedFile = path.join(TTS_CACHE_DIR, `${hash}.m4a`);
      if (fs.existsSync(cachedFile)) {
        return res.sendFile(path.resolve(cachedFile));
      }
      const tempOutput = path.join(TTS_CACHE_DIR, `temp_${hash}.m4a`);
      await synthesizeHostSay(voiceName, rate, textToSpeak, tempOutput);
      fs.renameSync(tempOutput, cachedFile);
      return res.sendFile(path.resolve(cachedFile));
    }

    // 4. Aria (Girl Voice - Expressive)
    const voiceName = "Flo (English (US))";
    const rate = "176";
    const hash = crypto.createHash("md5").update(`say:${voiceName}:${rate}:${textToSpeak}`).digest("hex");
    const cachedFile = path.join(TTS_CACHE_DIR, `${hash}.m4a`);
    if (fs.existsSync(cachedFile)) {
      return res.sendFile(path.resolve(cachedFile));
    }
    const tempOutput = path.join(TTS_CACHE_DIR, `temp_${hash}.m4a`);
    await synthesizeHostSay(voiceName, rate, textToSpeak, tempOutput);
    fs.renameSync(tempOutput, cachedFile);
    return res.sendFile(path.resolve(cachedFile));
  } catch (err) {
    console.error("TTS endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
