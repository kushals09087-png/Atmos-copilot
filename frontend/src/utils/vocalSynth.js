/**
 * Sun Copilot Vocal Synthesis & Voice Profile Engine
 * Provides male and female voice profiles with natural accent routing and system voice matching.
 */

export const VOCAL_PROFILES = [
  {
    id: "spandana",
    name: "Spandana",
    gender: "female",
    genderLabel: "Girl Voice (Indian Accent)",
    avatar: "👩",
    accent: "indian",
    title: "Indian Synoptic Meteorologist",
    tone: "Clear, warm, melodic Indian girl voice with natural authentic regional accent",
    pitch: 1.0,
    rate: 0.94,
    accentColor: "#f59e0b",
    badge: "Indian Accent (Girl)",
    previewText: "Namaste! I am Spandana, your Indian meteorological copilot. I am monitoring live rainfall, monsoon depressions, and district farm weather across India.",
    tagline: "Authentic, sweet Indian English girl's voice tailored for regional monsoon forecasts and Indian district weather."
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
    genderLabel: "Man Voice (Tactical)",
    avatar: "👨",
    accent: "international",
    title: "Tactical Flight & Radar Specialist",
    tone: "Deep, authoritative, mature man's voice with clear command presence",
    pitch: 0.88,
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
    pitch: 1.30,
    rate: 1.05,
    accentColor: "#f472b6",
    badge: "Expressive (Girl)",
    previewText: "Hi there! I'm Aria. Ready to assist your morning commute, agricultural spraying, and outdoor cardio scores.",
    tagline: "Vibrant, friendly female tone ideal for fitness scores and agricultural recommendations."
  }
];

const KNOWN_MALE_NAMES = [
  "aman", "rishi", "ravi", "kunal", "madhav", "alex", "daniel", "david", 
  "mark", "guy", "ryan", "fred", "oliver", "george", "male", "boy", 
  "albert", "ralph", "bruce", "junior", "tom", "reed", "rocko", "eddy"
];

const KNOWN_INDIAN_FEMALE_NAMES = [
  "lekha", "soumya", "geeta", "vani", "tara", "veena", "heera", "neerja", "sangeeta", "swara", "isha", 
  "priya", "aditi", "ananya", "shreya", "kavya"
];

const KNOWN_GENERAL_FEMALE_NAMES = [
  "samantha", "victoria", "karen", "zira", "jenny", "aria", "sonia", 
  "tessa", "fiona", "moira", "female", "girl", "kathy", "flo", "shelley", "sandy"
];

let cachedVoices = [];
let currentAudio = null;
let currentUtterance = null;
let activeSessionId = 0;
let isSpeechActive = false;

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
 * Returns best available system speech synthesis voice for the given profile
 */
export function getBestVoice(profileId = "spandana") {
  const profile = VOCAL_PROFILES.find(p => p.id === profileId) || VOCAL_PROFILES[0];
  
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const fresh = window.speechSynthesis.getVoices();
    if (fresh && fresh.length > 0) cachedVoices = fresh;
  }

  const voices = (cachedVoices && cachedVoices.length > 0)
    ? cachedVoices
    : (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.getVoices() : []);

  if (!voices || voices.length === 0) return null;

  // 1. Specialized Indian English female voice matching for Spandana
  if (profile.id === "spandana" || profile.accent === "indian") {
    // Check Google English (India) or Google India female
    const googleIndian = voices.find(v => {
      const n = v.name.toLowerCase();
      const l = (v.lang || "").toLowerCase().replace("_", "-");
      const isInd = (n.includes("google") && (n.includes("india") || l.includes("en-in")));
      const isMale = KNOWN_MALE_NAMES.some(m => n.includes(m));
      return isInd && !isMale;
    });
    if (googleIndian) return googleIndian;

    // Check en-IN or India voice that is explicitly NOT male
    const indianNonMale = voices.find(v => {
      const l = (v.lang || "").toLowerCase().replace("_", "-");
      const n = v.name.toLowerCase();
      const isIndian = l.includes("en-in") || l.includes("hi-in") || n.includes("india");
      const isMale = KNOWN_MALE_NAMES.some(m => n.includes(m));
      return isIndian && !isMale;
    });
    if (indianNonMale) return indianNonMale;

    return null;
  }

  // 2. Standard Female matching (Nova / Aria)
  const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  const pool = enVoices.length > 0 ? enVoices : voices;

  if (profile.gender === "female") {
    for (const kw of KNOWN_GENERAL_FEMALE_NAMES) {
      const match = pool.find(v => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }
    const nonMale = pool.find(v => !KNOWN_MALE_NAMES.some(m => v.name.toLowerCase().includes(m)));
    if (nonMale) return nonMale;
  } else if (profile.gender === "male") {
    // 3. Mature Male matching for Orion (Deep, authoritative man voice)
    const matureMaleNames = ["daniel", "eddy", "reed", "rocko", "guy", "alex", "david", "mark", "george", "oliver", "male"];
    for (const kw of matureMaleNames) {
      const match = pool.find(v => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }
    const generalMale = pool.find(v => KNOWN_MALE_NAMES.some(m => v.name.toLowerCase().includes(m)));
    if (generalMale) return generalMale;
  }

  return pool[0] || null;
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
    localStorage.setItem("atmos_vocal_voice", profileId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atmos_voice_changed", { detail: { profileId } }));
    }
  } catch {}
}

/**
 * Stop any currently running speech synthesis or audio playback
 */
export function stopAllSpeech() {
  activeSessionId++;
  isSpeechActive = false;

  if (currentAudio) {
    try {
      const a = currentAudio;
      currentAudio = null;
      a.onplay = null;
      a.onended = null;
      a.onerror = null;
      a.oncanplay = null;
      a.onloadedmetadata = null;
      a.pause();
      a.currentTime = 0;
      a.removeAttribute("src");
      a.load();
    } catch (_) {}
  }

  if (currentUtterance) {
    try {
      currentUtterance.onstart = null;
      currentUtterance.onend = null;
      currentUtterance.onerror = null;
      currentUtterance = null;
    } catch (_) {}
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

/**
 * Client-side SpeechSynthesis fallback
 */
function fallbackClientSpeech(cleanSpeech, profile, callbacks, sessionId) {
  if (sessionId !== activeSessionId || !isSpeechActive) return null;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    isSpeechActive = false;
    callbacks.onError?.(new Error("Text-to-speech not supported"));
    return null;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (_) {}

  const voice = getBestVoice(profile.id);
  const utterance = new SpeechSynthesisUtterance(cleanSpeech);
  currentUtterance = utterance;

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || (profile.accent === "indian" ? "en-IN" : "en-US");
  } else {
    utterance.lang = profile.accent === "indian" ? "en-IN" : "en-US";
  }

  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;

  utterance.onstart = () => {
    if (sessionId !== activeSessionId || !isSpeechActive) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
      return;
    }
    callbacks.onStart?.();
  };

  utterance.onend = () => {
    if (sessionId !== activeSessionId) return;
    currentUtterance = null;
    isSpeechActive = false;
    callbacks.onEnd?.();
  };

  utterance.onerror = (err) => {
    if (sessionId !== activeSessionId || !isSpeechActive) return;
    currentUtterance = null;
    isSpeechActive = false;
    callbacks.onError?.(err);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("speechSynthesis.speak failed:", err);
    isSpeechActive = false;
    callbacks.onError?.(err);
  }
  return utterance;
}

/**
 * Speak text using natural host TTS engine with seamless browser Web Speech API fallback
 */
export function speakText(text, profileId = "spandana", callbacks = {}) {
  stopAllSpeech();

  activeSessionId++;
  const sessionId = activeSessionId;
  isSpeechActive = true;

  const profile = VOCAL_PROFILES.find(p => p.id === profileId) || VOCAL_PROFILES[0];
  const cleanSpeech = (text || "")
    .replace(/[•*#_~`]/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/(\d+)\s*°C/gi, "$1 degrees Celsius")
    .replace(/(\d+)\s*%/g, "$1 percent")
    .replace(/(\d+)\s*km\/h/gi, "$1 kilometers per hour")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanSpeech) {
    isSpeechActive = false;
    callbacks.onEnd?.();
    return null;
  }

  // 1. Try High-Fidelity Natural Host TTS first
  try {
    const params = new URLSearchParams({
      profile: profile.id,
      text: cleanSpeech.length > 450 ? cleanSpeech.slice(0, 450) + "..." : cleanSpeech
    });
    const audioUrl = `/api/ai/tts?${params.toString()}`;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = audioUrl;
    currentAudio = audio;

    let hasStarted = false;
    audio.onplay = () => {
      if (sessionId !== activeSessionId || !isSpeechActive) {
        try { audio.pause(); } catch (_) {}
        return;
      }
      hasStarted = true;
      callbacks.onStart?.();
    };

    audio.onended = () => {
      if (sessionId !== activeSessionId) return;
      if (currentAudio === audio) currentAudio = null;
      isSpeechActive = false;
      callbacks.onEnd?.();
    };

    audio.onerror = (e) => {
      if (sessionId !== activeSessionId || !isSpeechActive) return;
      console.warn("Host TTS audio error, switching to browser SpeechSynthesis fallback:", e);
      if (currentAudio === audio) currentAudio = null;
      if (!hasStarted) {
        fallbackClientSpeech(cleanSpeech, profile, callbacks, sessionId);
      } else {
        isSpeechActive = false;
        callbacks.onError?.(e);
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(playErr => {
        // If aborted or cancelled by user, DO NOT trigger fallback speech synthesis!
        if (
          sessionId !== activeSessionId ||
          !isSpeechActive ||
          playErr?.name === "AbortError" ||
          playErr?.message?.includes("interrupted") ||
          playErr?.message?.includes("pause")
        ) {
          return;
        }
        console.warn("Audio autoplay blocked or failed, switching to browser SpeechSynthesis:", playErr);
        if (currentAudio === audio) currentAudio = null;
        fallbackClientSpeech(cleanSpeech, profile, callbacks, sessionId);
      });
    }

    return audio;
  } catch (err) {
    if (sessionId !== activeSessionId || !isSpeechActive) return null;
    console.warn("Host TTS initialization failed, using Web Speech API fallback:", err);
    return fallbackClientSpeech(cleanSpeech, profile, callbacks, sessionId);
  }
}
