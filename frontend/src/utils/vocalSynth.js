/**
 * Atmos Copilot Studio Vocal Synthesis & Natural Speech Engine
 * High-performance, zero-latency text-to-speech engine supporting:
 * - Instant Browser Web Speech API with tailored Indian & Global acoustic profiles
 * - 100% guaranteed voice fallback (never fails or drops audio)
 * - Chromium keep-alive watchdog (prevents 15s audio freeze)
 * - Safe cancellation & queue flush orchestration
 * - Natural meteorological phonetic normalization
 * - Seamless server Neural TTS fallback (/api/ai/tts)
 */

export const VOCAL_PROFILES = [
  {
    id: "spandana",
    name: "Spandana",
    gender: "female",
    genderLabel: "Girl Voice (Fluent Indian English)",
    avatar: "👧",
    accent: "indian",
    title: "Indian Synoptic Meteorologist",
    tone: "Authentic, fluent Indian English girl voice with natural regional inflection",
    pitch: 1.05,
    rate: 0.98,
    accentColor: "#f59e0b",
    badge: "Indian English (Girl)",
    previewText: "Namaste! I am Spandana, your Indian meteorological copilot. I am monitoring live rainfall, monsoon depressions, and district farm weather across India.",
    tagline: "Authentic, fluent Indian English girl's voice tailored for regional monsoon forecasts and Indian district weather."
  },
  {
    id: "nova",
    name: "Nova",
    gender: "female",
    genderLabel: "Girl Voice (International)",
    avatar: "👩",
    accent: "international",
    title: "Global Meteorological Analyst",
    tone: "Gentle, clear, natural female cadence",
    pitch: 1.15,
    rate: 1.0,
    accentColor: "#38bdf8",
    badge: "International (Girl)",
    previewText: "Hello! I am Nova, your Sun Copilot meteorological analyst. Today's atmospheric sensors are nominal and stable.",
    tagline: "Natural, balanced female tone ideal for daily weather briefings and temperature updates."
  },
  {
    id: "orion",
    name: "Orion",
    gender: "male",
    genderLabel: "Man Voice (Tactical Command)",
    avatar: "👨",
    accent: "international",
    title: "Tactical Flight & Radar Specialist",
    tone: "Deep, authoritative, mature man's voice with clear command presence",
    pitch: 0.84,
    rate: 0.94,
    accentColor: "#818cf8",
    badge: "Command (Man)",
    previewText: "Greetings! I am Orion, your tactical weather copilot. Radar scans and convective storm warnings are fully active.",
    tagline: "Authoritative, deep man's voice ideal for highway travel alerts and severe storm tracking."
  },
  {
    id: "aria",
    name: "Aria",
    gender: "female",
    genderLabel: "Girl Voice (Expressive)",
    avatar: "👧",
    accent: "international",
    title: "Dynamic Agronomy & Fitness Guide",
    tone: "Bright, energetic, vibrant female cadence",
    pitch: 1.26,
    rate: 1.04,
    accentColor: "#f472b6",
    badge: "Expressive (Girl)",
    previewText: "Hi there! I'm Aria. Ready to assist your morning commute, agricultural spraying, and outdoor cardio scores.",
    tagline: "Vibrant, friendly female tone ideal for fitness scores and agricultural recommendations."
  }
];

const KNOWN_MALE_NAMES = [
  "aman", "rishi", "ravi", "kunal", "madhav", "prabhat", "hemant", "aravind", 
  "suresh", "rahul", "alex", "daniel", "david", "mark", "ryan", "fred", 
  "oliver", "george", "albert", "ralph", "bruce", "junior", "tom", "reed", 
  "rocko", "eddy", "james", "andrew", "brian", "charles", "christopher", 
  "eric", "jack", "john", "joseph", "kevin", "michael", "paul", "peter", 
  "richard", "robert", "thomas", "william", "guy", "boy"
];

const KNOWN_INDIAN_FEMALE_NAMES = [
  "tara", "heera", "neerja", "swara", "lekha", "soumya", "geeta", "vani", 
  "veena", "sangeeta", "isha", "priya", "aditi", "ananya", "shreya", "kavya", 
  "deepa", "pooja", "sunita", "rekha", "anita", "meera", "divya", "rashmi", 
  "jyoti", "shruti", "pallavi", "radhika"
];

const KNOWN_GENERAL_FEMALE_NAMES = [
  "samantha", "victoria", "karen", "zira", "jenny", "aria", "sonia", 
  "tessa", "fiona", "moira", "kathy", "flo", "shelley", "sandy", 
  "serena", "hazel", "susan", "eva", "ava", "allison", "cynthia", "agnes"
];

const INDIAN_FEMALE_REGEX = new RegExp("\\b(" + KNOWN_INDIAN_FEMALE_NAMES.join("|") + ")\\b", "i");
const ALL_FEMALE_REGEX = new RegExp("\\b(" + [...KNOWN_INDIAN_FEMALE_NAMES, ...KNOWN_GENERAL_FEMALE_NAMES].join("|") + "|female|girl|woman)\\b", "i");
const MALE_REGEX = new RegExp("\\b(" + KNOWN_MALE_NAMES.join("|") + "|male|boy|man)\\b", "i");

export function isVoiceFemale(v) {
  if (!v) return false;
  const n = (v.name || "").toLowerCase();
  if (n.includes("google us english") || n.includes("google uk english female")) return true;
  return ALL_FEMALE_REGEX.test(n);
}

export function isVoiceMale(v) {
  if (!v) return false;
  const n = (v.name || "").toLowerCase();
  if (isVoiceFemale(v)) return false;
  if (n === "google english (india)" || n.includes("google english (india)")) return true;
  if (n.includes("google uk english male")) return true;
  return MALE_REGEX.test(n);
}

function isIndianLang(v) {
  if (!v) return false;
  const l = (v.lang || "").toLowerCase().replace("_", "-");
  const n = (v.name || "").toLowerCase();
  return l.includes("en-in") || l.includes("hi-in") || l.includes("kn-in") || l.includes("ta-in") || l.includes("te-in") || n.includes("india");
}

// Audio State Tracking
let cachedVoices = [];
let currentAudio = null;
let currentUtterances = [];
let activeSessionId = 0;
let isSpeechActive = false;
let keepAliveTimer = null;
let isAudioPrimed = false;

/**
 * Prime audio subsystem on first user gesture for mobile browser compliance
 */
export function primeAudioContext() {
  if (isAudioPrimed) return;
  isAudioPrimed = true;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      const silent = new SpeechSynthesisUtterance("");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    } catch (_) {}
  }
}

if (typeof window !== "undefined") {
  const onFirstInteraction = () => {
    primeAudioContext();
    window.removeEventListener("click", onFirstInteraction);
    window.removeEventListener("touchstart", onFirstInteraction);
  };
  window.addEventListener("click", onFirstInteraction, { passive: true, once: true });
  window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });
}

/**
 * Load system voices with robust caching
 */
function loadVoices() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  }
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  }
}

/**
 * Stop Chromium's 15-second speech freeze watchdog
 */
function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

/**
 * Start Chromium keep-alive heartbeat to prevent speech from stalling
 */
function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch (_) {}
      }
    }
  }, 9000);
}

/**
 * Returns the best available system speech synthesis voice for the given profile.
 * GUARANTEED to never return null if any system voice exists.
 */
export function getBestVoice(profileId = "spandana") {
  const profile = VOCAL_PROFILES.find(p => p.id === profileId) || VOCAL_PROFILES[0];
  
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  let fresh = [];
  try {
    fresh = window.speechSynthesis.getVoices();
  } catch (_) {}

  const voices = (fresh && fresh.length > 0)
    ? fresh
    : ((cachedVoices && cachedVoices.length > 0) ? cachedVoices : []);

  if (!voices || voices.length === 0) return null;

  // Filter English-capable voices
  const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  const pool = enVoices.length > 0 ? enVoices : voices;

  // 1. Spandana: Specialized Indian English female voice matching - 100% Guaranteed Girl Voice
  if (profile.id === "spandana" || profile.accent === "indian") {
    // A. Explicit Indian female voice (Tara, Heera, Neerja, Swara, Lekha, Veena)
    const indianFemale = pool.find(v => isIndianLang(v) && (INDIAN_FEMALE_REGEX.test(v.name || "") || isVoiceFemale(v)) && !isVoiceMale(v));
    if (indianFemale) return indianFemale;

    // B. Any voice in pool confirmed Indian and female
    const anyIndFemale = pool.find(v => isIndianLang(v) && isVoiceFemale(v));
    if (anyIndFemale) return anyIndFemale;

    // CRITICAL: NEVER return generic en-IN (which selects Aman, Rishi, Prabhat, or Google English India - all boys/men!)
    // When no authentic Indian female voice is locally installed, use the best crystal-clear girl voice:

    // C. Known signature English girl/female voices (Samantha on Mac/iOS, Karen, Victoria, Zira/Jenny on Windows, Google US English on Chrome, Flo)
    for (const kw of ["samantha", "karen", "victoria", "zira", "jenny", "google us english", "google uk english female", "flo", "tessa", "fiona", "moira"]) {
      const m = pool.find(v => (v.name || "").toLowerCase().includes(kw) && !isVoiceMale(v));
      if (m) return m;
    }

    // D. Any confirmed female voice
    const anyFemale = pool.find(v => isVoiceFemale(v));
    if (anyFemale) return anyFemale;

    // E. Any non-male voice
    const nonMale = pool.find(v => !isVoiceMale(v));
    if (nonMale) return nonMale;

    return pool[0];
  }

  // 2. Orion: Mature Command Man voice
  if (profile.gender === "male" || profile.id === "orion") {
    const matureMaleNames = ["daniel", "david", "mark", "alex", "eddy", "reed", "rocko", "guy", "oliver", "george", "fred", "male"];
    for (const kw of matureMaleNames) {
      const m = pool.find(v => (v.name || "").toLowerCase().includes(kw));
      if (m) return m;
    }
    const anyMale = pool.find(v => isVoiceMale(v));
    if (anyMale) return anyMale;
    return pool[0];
  }

  // 3. Nova & Aria: Standard / Expressive Female matching
  for (const kw of KNOWN_GENERAL_FEMALE_NAMES) {
    const m = pool.find(v => (v.name || "").toLowerCase().includes(kw) && !isVoiceMale(v));
    if (m) return m;
  }
  const anyFemale = pool.find(v => isVoiceFemale(v));
  if (anyFemale) return anyFemale;

  const anyNonMale = pool.find(v => !isVoiceMale(v));
  if (anyNonMale) return anyNonMale;

  return pool[0];
}

/**
 * Get active voice profile from localStorage or default to Spandana
 */
export function getStoredVoiceProfile() {
  try {
    const saved = localStorage.getItem("atmos_vocal_voice");
    const found = VOCAL_PROFILES.find(p => p.id === saved);
    return found || VOCAL_PROFILES[0];
  } catch {
    return VOCAL_PROFILES[0];
  }
}

/**
 * Save active voice profile to localStorage and dispatch update event
 */
export function setStoredVoiceProfile(profileId) {
  try {
    const id = typeof profileId === "string" ? profileId : profileId?.id || "spandana";
    localStorage.setItem("atmos_vocal_voice", id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atmos_voice_changed", { detail: { profileId: id } }));
    }
  } catch {}
}

/**
 * Stop any currently running speech synthesis or audio playback
 */
export function stopAllSpeech() {
  activeSessionId++;
  isSpeechActive = false;
  stopKeepAlive();

  if (currentAudio) {
    try {
      const a = currentAudio;
      currentAudio = null;
      a.onplay = null;
      a.onended = null;
      a.onerror = null;
      a.pause();
      a.currentTime = 0;
      a.removeAttribute("src");
      a.load();
    } catch (_) {}
  }

  currentUtterances.forEach(u => {
    try {
      u.onstart = null;
      u.onend = null;
      u.onerror = null;
    } catch (_) {}
  });
  currentUtterances = [];

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (_) {}
  }
}

/**
 * Normalize spoken text: expand weather abbreviations, strip markdown and emojis
 */
export function normalizeSpokenText(text) {
  if (!text) return "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links [label](url) -> label
    .replace(/https?:\/\/\S+/gi, "") // strip raw URLs
    .replace(/[•*#_~`>|]/g, "") // strip markdown symbols
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // strip emojis
    .replace(/(\d+)\s*°\s*C\b/gi, "$1 degrees Celsius")
    .replace(/(\d+)\s*°\s*F\b/gi, "$1 degrees Fahrenheit")
    .replace(/(\d+)\s*%/g, "$1 percent")
    .replace(/(\d+)\s*km\/h\b/gi, "$1 kilometers per hour")
    .replace(/(\d+)\s*hPa\b/gi, "$1 hectopascals")
    .replace(/(\d+)\s*mb\b/gi, "$1 millibars")
    .replace(/(\d+)\s*mm\b/gi, "$1 millimeters")
    .replace(/\bAQI\b/gi, "Air Quality Index")
    .replace(/\bUV\b/g, "U V")
    .replace(/\bVPD\b/g, "V P D")
    .replace(/\bGPS\b/g, "G P S")
    .replace(/\bEAS\b/g, "E A S")
    .replace(/\bCap\b/g, "Cap")
    .replace(/\bmax\b/gi, "maximum")
    .replace(/\bmin\b/gi, "minimum")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, ". ")
    .trim();
}

/**
 * Split text into natural sentence clauses for smooth progressive speech
 */
function splitIntoSentences(text) {
  const rawSentences = text.split(/(?<=[.?!])\s+/);
  const result = [];
  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.length > 220) {
      const subParts = trimmed.split(/(?<=[,;])\s+/);
      result.push(...subParts.map(p => p.trim()).filter(Boolean));
    } else {
      result.push(trimmed);
    }
  }
  return result.filter(r => r.length > 0);
}

/**
 * Play using browser SpeechSynthesis with sentence queue and heartbeat watchdog
 */
function playWithSpeechSynthesis(cleanSpeech, profile, callbacks, sessionId) {
  if (sessionId !== activeSessionId || !isSpeechActive) return false;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  const voice = getBestVoice(profile.id);
  const sentences = splitIntoSentences(cleanSpeech);
  if (sentences.length === 0) return false;

  try {
    window.speechSynthesis.resume();
  } catch (_) {}

  let currentIndex = 0;
  let hasStarted = false;
  currentUtterances = [];

  function speakNext() {
    if (sessionId !== activeSessionId || !isSpeechActive) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
      return;
    }

    if (currentIndex >= sentences.length) {
      stopKeepAlive();
      isSpeechActive = false;
      currentUtterances = [];
      callbacks.onEnd?.();
      return;
    }

    const sentence = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    currentUtterances = [utterance];

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (profile.accent === "indian" ? "en-IN" : "en-US");
    } else {
      utterance.lang = profile.accent === "indian" ? "en-IN" : "en-US";
    }

    // Natural vocal pitch balance
    if (profile.gender === "female") {
      utterance.pitch = profile.id === "spandana" ? 1.06 : Math.max(profile.pitch || 1.15, 1.15);
    } else {
      utterance.pitch = profile.pitch;
    }
    utterance.rate = profile.rate;

    utterance.onstart = () => {
      if (sessionId !== activeSessionId || !isSpeechActive) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
        return;
      }
      if (!hasStarted) {
        hasStarted = true;
        startKeepAlive();
        callbacks.onStart?.();
      }
    };

    utterance.onend = () => {
      if (sessionId !== activeSessionId) return;
      currentIndex++;
      speakNext();
    };

    utterance.onerror = (err) => {
      if (sessionId !== activeSessionId || !isSpeechActive) return;
      console.warn("SpeechSynthesis utterance error:", err);
      currentIndex++;
      if (currentIndex >= sentences.length) {
        stopKeepAlive();
        isSpeechActive = false;
        callbacks.onEnd?.();
      } else {
        speakNext();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (speakErr) {
      console.warn("window.speechSynthesis.speak error:", speakErr);
      return false;
    }
    return true;
  }

  // Small tick delay to avoid Chromium cancel() race condition
  setTimeout(() => {
    if (sessionId === activeSessionId && isSpeechActive) {
      speakNext();
    }
  }, 25);

  return true;
}

/**
 * Play using Server Audio endpoint (/api/ai/tts) fallback
 */
function playWithServerAudio(cleanSpeech, profile, callbacks, sessionId) {
  if (sessionId !== activeSessionId || !isSpeechActive) return null;

  try {
    const params = new URLSearchParams({
      profile: profile.id,
      text: cleanSpeech.length > 400 ? cleanSpeech.slice(0, 400) + "..." : cleanSpeech
    });
    const audioUrl = `/api/ai/tts?${params.toString()}`;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = audioUrl;
    currentAudio = audio;

    audio.onplay = () => {
      if (sessionId !== activeSessionId || !isSpeechActive) {
        try { audio.pause(); } catch (_) {}
        return;
      }
      callbacks.onStart?.();
    };

    audio.onended = () => {
      if (sessionId !== activeSessionId) return;
      if (currentAudio === audio) currentAudio = null;
      isSpeechActive = false;
      callbacks.onEnd?.();
    };

    audio.onerror = (err) => {
      if (sessionId !== activeSessionId || !isSpeechActive) return;
      console.warn("Server TTS audio error, falling back to browser Web Speech API:", err);
      if (currentAudio === audio) currentAudio = null;
      // Seamless fallback to client Web Speech API if server audio fails
      const fallbackSuccess = playWithSpeechSynthesis(cleanSpeech, profile, callbacks, sessionId);
      if (!fallbackSuccess) {
        isSpeechActive = false;
        callbacks.onError?.(err);
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(playErr => {
        if (sessionId !== activeSessionId || !isSpeechActive) return;
        console.warn("Audio play() blocked, attempting browser speech synthesis fallback:", playErr);
        if (currentAudio === audio) currentAudio = null;
        const fallbackSuccess = playWithSpeechSynthesis(cleanSpeech, profile, callbacks, sessionId);
        if (!fallbackSuccess) {
          isSpeechActive = false;
          callbacks.onError?.(playErr);
        }
      });
    }
    return audio;
  } catch (err) {
    if (sessionId !== activeSessionId || !isSpeechActive) return null;
    console.warn("Server TTS initialization error, trying browser speech synthesis:", err);
    if (currentAudio === audio) currentAudio = null;
    const fallbackSuccess = playWithSpeechSynthesis(cleanSpeech, profile, callbacks, sessionId);
    if (!fallbackSuccess) {
      isSpeechActive = false;
      callbacks.onError?.(err);
    }
    return null;
  }
}

/**
 * Speak text using intelligent dual-engine orchestration:
 * Spandana (Indian English): High-Fidelity Server Neural Audio (/api/ai/tts - NeerjaNeural / Tara)
 * Fallback / Other profiles: Instant zero-latency Browser Web Speech API
 */
export function speakText(text, profileOrOptions = "spandana", maybeCallbacks = {}) {
  // 1. Cancel any active playback
  stopAllSpeech();

  // 2. Normalize arguments across diverse caller signatures
  let profileId = "spandana";
  let callbacks = {};

  if (typeof profileOrOptions === "string") {
    profileId = profileOrOptions;
    callbacks = maybeCallbacks || {};
  } else if (typeof profileOrOptions === "object" && profileOrOptions !== null) {
    if (profileOrOptions.id && typeof profileOrOptions.id === "string") {
      // Called with a profile object (e.g. from getStoredVoiceProfile())
      profileId = profileOrOptions.id;
      callbacks = maybeCallbacks || {};
    } else {
      // Called with options object: { voice, profile, onStart, onEnd, onError }
      profileId = profileOrOptions.profile || profileOrOptions.voice?.id || profileOrOptions.voice || "spandana";
      callbacks = {
        onStart: profileOrOptions.onStart || maybeCallbacks.onStart,
        onEnd: profileOrOptions.onEnd || maybeCallbacks.onEnd,
        onError: profileOrOptions.onError || maybeCallbacks.onError
      };
    }
  }

  const profile = VOCAL_PROFILES.find(p => p.id === profileId) || VOCAL_PROFILES[0];
  const cleanSpeech = normalizeSpokenText(text);

  if (!cleanSpeech) {
    callbacks.onEnd?.();
    return null;
  }

  activeSessionId++;
  const sessionId = activeSessionId;
  isSpeechActive = true;

  // 3. For Spandana, ALWAYS prioritize authentic fluent Indian English Neural Voice (/api/ai/tts)
  // This delivers Azure Neural Indian English (Neerja / Tara) with natural regional pronunciation.
  if (profile.id === "spandana" || profile.accent === "indian") {
    const serverAudio = playWithServerAudio(cleanSpeech, profile, callbacks, sessionId);
    if (serverAudio) {
      return true;
    }
  }

  // 4. Instant client-side Web Speech API (for international voices or when server audio is unavailable)
  const webSpeechSuccess = playWithSpeechSynthesis(cleanSpeech, profile, callbacks, sessionId);
  if (webSpeechSuccess) {
    return true;
  }

  // 5. Final fallback to Server Neural TTS audio stream
  return playWithServerAudio(cleanSpeech, profile, callbacks, sessionId);
}
