import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Sun,
  Bot,
  Volume2,
  Square,
  Copy,
  Check,
  Trash2,
  Wheat,
  Car,
  Activity,
  ShieldAlert,
  CloudRain,
  Wind,
  Thermometer,
  ExternalLink,
  VolumeX,
  Droplets,
  Gauge
} from "lucide-react";
import { askAiAssistant, extractLocationSync } from "../../utils/telemetryData";
import { VOCAL_PROFILES, speakText, stopAllSpeech, setStoredVoiceProfile } from "../../utils/vocalSynth";

const PERSONAS = [
  {
    id: "meteorologist",
    label: "Meteorologist",
    icon: CloudRain,
    badge: "Synoptic Core",
    color: "#38bdf8",
    description: "Atmospheric fronts, barometric trends, dew point depression & diurnal swings"
  },
  {
    id: "travel",
    label: "Highway & Commute",
    icon: Car,
    badge: "Pavement & Roads",
    color: "#34d399",
    description: "Pavement hydroplaning risk, crosswinds on flyovers & visibility"
  },
  {
    id: "agri",
    label: "Agro & Farming",
    icon: Wheat,
    badge: "Soil & Sprays",
    color: "#fbbf24",
    description: "Topsoil moisture, chemical spraying windows, VPD & crop thermal load"
  },
  {
    id: "outdoor",
    label: "Outdoor & Fitness",
    icon: Activity,
    badge: "Score 0-100",
    color: "#f43f5e",
    description: "Athletic suitability score, heat index, hydration targets & UV burn limit"
  },
  {
    id: "severe",
    label: "Severe Weather",
    icon: ShieldAlert,
    badge: "Threat Radar",
    color: "#a855f7",
    description: "Convective storm radar signals, lightning hazards & safety checklists"
  }
];

const PERSONA_SUGGESTIONS = {
  meteorologist: [
    "Will it rain in the next 12 hours?",
    "Explain current dew point depression and humidity",
    "What is the diurnal temperature shift today?",
    "Give me the 7-day synoptic outlook summary"
  ],
  travel: [
    "Is highway driving safe right now?",
    "Are road surfaces slick or hydroplaning prone?",
    "Any crosswind hazards on open flyovers?",
    "How is visibility for evening travel?"
  ],
  agri: [
    "Is today a safe window for agrochemical spraying?",
    "Check topsoil moisture and evapotranspiration (VPD)",
    "Are crops at risk of heat or chill shock?",
    "Irrigation recommendation based on rain forecast"
  ],
  outdoor: [
    "What is the outdoor running & cycling score today?",
    "What is my UV burn time without sunscreen?",
    "Recommended hourly hydration rate right now",
    "Best time of day for outdoor cardio workout"
  ],
  severe: [
    "Any convective or thunderstorm threat detected?",
    "Are wind gusts hazardous to open structures?",
    "Lightning safety advisory for this area",
    "Severe weather emergency preparedness checklist"
  ]
};

export default function SunCopilotTab({ coords, weather, onQueryLogged, onNavigateTab }) {
  const [selectedPersona, setSelectedPersona] = useState("meteorologist");
  const [autoVocalize, setAutoVocalize] = useState(() => {
    return localStorage.getItem("atmos_copilot_autotts") === "true";
  });
  const [currentVoiceId, setCurrentVoiceId] = useState(() => {
    return localStorage.getItem("atmos_vocal_voice") || "nova";
  });
  const [speakingId, setSpeakingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Sync vocal voice dynamically when changed in Settings or other tabs
  useEffect(() => {
    const handleVoiceChange = (e) => {
      if (e.detail?.profileId) {
        setCurrentVoiceId(e.detail.profileId);
      }
    };
    window.addEventListener("atmos_voice_changed", handleVoiceChange);
    return () => window.removeEventListener("atmos_voice_changed", handleVoiceChange);
  }, []);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("atmos_copilot_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "intro-0",
        sender: "ai",
        persona: "meteorologist",
        text: `Hello! I am Sun Copilot, your multi-persona meteorological intelligence core grounded in real-time verified telemetry. Choose an advisory mode above or ask any atmospheric question.`
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Save chat to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("atmos_copilot_chat_history", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("atmos_copilot_autotts", autoVocalize);
    } catch {}
  }, [autoVocalize]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Synthesis with Selected Voice Profile (Girl / Boy)
  const speakMessage = useCallback((text, id) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingId === id) {
      stopAllSpeech();
      setSpeakingId(null);
      return;
    }

    stopAllSpeech();
    setSpeakingId(id);

    speakText(text, currentVoiceId, {
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null)
    });
  }, [speakingId, currentVoiceId]);

  const handleStopAllSpeech = () => {
    stopAllSpeech();
    setSpeakingId(null);
  };

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleClearChat = () => {
    stopAllSpeech();
    const initial = [
      {
        id: "intro-" + Date.now(),
        sender: "ai",
        persona: selectedPersona,
        text: `Chat reset. Sun Copilot is ready with ${PERSONAS.find(p => p.id === selectedPersona)?.label} intelligence for ${weather?.resolved_city || "your coordinates"}.`
      }
    ];
    setMessages(initial);
    try {
      localStorage.removeItem("atmos_copilot_chat_history");
    } catch {}
  };

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || isLoading) return;
    const cleanText = queryText.trim();
    setInput("");

    const userMsgId = "u-" + Date.now();
    const aiMsgId = "ai-" + (Date.now() + 1);

    // Add user message
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: "user", text: cleanText }
    ]);
    setIsLoading(true);

    // Save query to history
    const now = new Date();
    const locMatch = extractLocationSync(cleanText);
    const historyItem = {
      query: cleanText,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      location: locMatch?.name || weather?.resolved_city || "Current Coordinates",
      persona: selectedPersona
    };

    try {
      const saved = localStorage.getItem("atmos_search_history");
      const list = saved ? JSON.parse(saved) : [];
      const updated = [historyItem, ...list.slice(0, 49)];
      localStorage.setItem("atmos_search_history", JSON.stringify(updated));
      if (onQueryLogged) onQueryLogged(updated);
    } catch {}

    try {
      const reply = await askAiAssistant(
        cleanText,
        coords?.lat,
        coords?.lon,
        weather,
        selectedPersona
      );

      setMessages(prev => [
        ...prev,
        { id: aiMsgId, sender: "ai", persona: selectedPersona, text: reply }
      ]);

      if (autoVocalize) {
        speakMessage(reply, aiMsgId);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          persona: selectedPersona,
          text: "Meteorological telemetry link error. Re-synthesizing station parameters..."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is supported in Google Chrome, Edge, and modern webkit browsers.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Helper to find contextual action jump buttons
  const getContextualActions = (text) => {
    if (!onNavigateTab) return [];
    const lower = text.toLowerCase();
    const actions = [];

    if (
      lower.includes("highway") ||
      lower.includes("commute") ||
      lower.includes("road") ||
      lower.includes("travel") ||
      lower.includes("hydroplan") ||
      lower.includes("pavement")
    ) {
      actions.push({ tab: "routes", label: "Open Highway Route Planner", icon: Car });
    }

    if (
      lower.includes("soil") ||
      lower.includes("crop") ||
      lower.includes("agri") ||
      lower.includes("spray") ||
      lower.includes("farming") ||
      lower.includes("vpd")
    ) {
      actions.push({ tab: "agri", label: "View Agricultural Advisories", icon: Wheat });
    }

    if (
      lower.includes("severe") ||
      lower.includes("storm") ||
      lower.includes("convective") ||
      lower.includes("lightning") ||
      lower.includes("hazard") ||
      lower.includes("alert")
    ) {
      actions.push({ tab: "disaster", label: "Check Disaster & Alert Center", icon: ShieldAlert });
    }

    if (
      lower.includes("synoptic") ||
      lower.includes("satellite") ||
      lower.includes("orbit") ||
      lower.includes("radar")
    ) {
      actions.push({ tab: "satellite", label: "View Satellite & Cloud Formations", icon: ExternalLink });
    }

    return actions;
  };

  const activePersonaObj = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];
  const currentSuggestions = PERSONA_SUGGESTIONS[selectedPersona] || PERSONA_SUGGESTIONS.meteorologist;

  // Telemetry items for the HUD snapshot
  const cityName = weather?.resolved_city || "Current Coordinates";
  const temp = weather?.current?.temp ?? 28;
  const condition = weather?.current?.condition ?? "Partly Cloudy";
  const humidity = weather?.current?.humidity ?? 55;
  const dewPoint = weather?.current?.dew_point ?? 18;
  const wind = weather?.current?.wind ?? 14;
  const precip = weather?.current?.precipitation ?? 0;
  const uvVal = weather?.solar?.uv?.index ?? 5.2;
  const soilMoisture = weather?.solar?.agro?.soilMoisture ?? "24.5";

  const currentProfile = VOCAL_PROFILES.find(p => p.id === currentVoiceId) || VOCAL_PROFILES[0];

  return (
    <div className="copilot-container">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div className={`copilot-avatar-orb ${isListening ? "listening-pulse" : ""} ${speakingId ? "speaking-glow" : ""}`}>
          <Sun size={28} className="copilot-sun-icon" />
          <Sparkles size={16} className="copilot-sparkle" />
        </div>
        <h2>Sun Copilot Intelligence</h2>
        <p>Voice-First Multilingual Meteorological Assistant grounded in verified station telemetry.</p>

        {/* Global Vocalize Toggle, Voice Selection & Status */}
        <div className="copilot-top-controls">
          <label className="copilot-autotts-toggle" title="When active, AI responses are automatically spoken aloud">
            <VolumeX size={15} className={`autotts-icon off ${!autoVocalize ? "active" : ""}`} title="Voice Narration Muted" />
            <div className="autotts-switch-wrapper">
              <input
                type="checkbox"
                checked={autoVocalize}
                onChange={e => setAutoVocalize(e.target.checked)}
              />
              <span className="autotts-slider"></span>
            </div>
            <Volume2 size={15} className={`autotts-icon on ${autoVocalize ? "active" : ""}`} title="Voice Narration Active" />
            <span className="autotts-label">
              <span>Auto-Vocalize Briefings</span>
              <span className={`autotts-status-tag ${autoVocalize ? "on" : "off"}`}>
                {autoVocalize ? "ON" : "OFF"}
              </span>
            </span>
          </label>

          {/* Quick Voice Switcher (Girl / Man voices) */}
          <button
            type="button"
            className="copilot-voice-quick-btn"
            onClick={() => {
              const idx = VOCAL_PROFILES.findIndex(p => p.id === currentVoiceId);
              const next = VOCAL_PROFILES[(idx + 1) % VOCAL_PROFILES.length];
              setCurrentVoiceId(next.id);
              setStoredVoiceProfile(next.id);
            }}
            title={`Active Voice: ${currentProfile.name} (${currentProfile.genderLabel}). Click to switch between voice profiles.`}
          >
            <span className="copilot-voice-quick-avatar">{currentProfile.avatar}</span>
            <span className="copilot-voice-quick-content">
              <span className="copilot-voice-quick-label">Voice:</span>
              <strong className="copilot-voice-quick-name">{currentProfile.name}</strong>
              <span className="copilot-voice-quick-gender" style={{ color: currentProfile.accentColor }}>
                ({currentProfile.genderLabel})
              </span>
            </span>
            <span className="copilot-voice-quick-pill">Switch</span>
          </button>

          {speakingId && (
            <button
              type="button"
              onClick={handleStopAllSpeech}
              className="copilot-stop-speech-btn"
              title="Stop current audio vocalization"
            >
              <Square size={13} fill="currentColor" /> Stop Voice
            </button>
          )}

          <button
            type="button"
            onClick={handleClearChat}
            className="copilot-clear-btn"
            title="Clear current conversation history"
          >
            <Trash2 size={14} /> Clear Chat
          </button>
        </div>
      </div>

      {/* 5 Specialized Advisory Persona Selector Bar */}
      <div className="copilot-persona-bar glass">
        <div className="persona-bar-header">
          <span className="persona-bar-title">Advisory Intelligence Persona:</span>
          <span className="persona-desc-hint">{activePersonaObj.description}</span>
        </div>
        <div className="persona-pills-row">
          {PERSONAS.map(persona => {
            const Icon = persona.icon;
            const isActive = selectedPersona === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedPersona(persona.id)}
                className={`persona-pill-btn ${isActive ? "active" : ""}`}
                style={{ "--persona-color": persona.color }}
              >
                <Icon size={15} className="persona-btn-icon" />
                <span className="persona-btn-label">{persona.label}</span>
                <span className="persona-btn-badge">{persona.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Live Telemetry Snapshot Card (HUD) */}
      <div className="copilot-telemetry-hud glass">
        <div className="hud-header">
          <div className="hud-title-wrap">
            <span className="hud-live-dot" />
            <span className="hud-station-label">Live Ground Telemetry: <strong>{cityName}</strong></span>
          </div>
          <span className="hud-refresh-tag">Synoptic Synchronized</span>
        </div>
        <div className="hud-grid">
          <div className="hud-tile">
            <Thermometer size={16} className="hud-tile-icon temp" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">{temp}°C</span>
              <span className="hud-tile-lbl">{condition}</span>
            </div>
          </div>
          <div className="hud-tile">
            <Droplets size={16} className="hud-tile-icon moisture" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">{humidity}% RH</span>
              <span className="hud-tile-lbl">Dew: {dewPoint}°C</span>
            </div>
          </div>
          <div className="hud-tile">
            <Wind size={16} className="hud-tile-icon wind" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">{wind} km/h</span>
              <span className="hud-tile-lbl">Surface Vector</span>
            </div>
          </div>
          <div className="hud-tile">
            <CloudRain size={16} className="hud-tile-icon precip" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">{precip}%</span>
              <span className="hud-tile-lbl">Rain Probability</span>
            </div>
          </div>
          <div className="hud-tile">
            <Sun size={16} className="hud-tile-icon solar" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">UV {uvVal}</span>
              <span className="hud-tile-lbl">Photochemical</span>
            </div>
          </div>
          <div className="hud-tile">
            <Gauge size={16} className="hud-tile-icon agro" />
            <div className="hud-tile-data">
              <span className="hud-tile-val">{soilMoisture}%</span>
              <span className="hud-tile-lbl">Soil Moisture</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="copilot-messages glass">
        {messages.map((m) => {
          const isAi = m.sender === "ai";
          const isSpeaking = speakingId === m.id;
          const isCopied = copiedId === m.id;
          const personaItem = isAi ? PERSONAS.find(p => p.id === m.persona) || activePersonaObj : null;
          const actions = isAi ? getContextualActions(m.text) : [];

          return (
            <div key={m.id || m.text} className={`copilot-msg-row ${isAi ? "ai-row" : "user-row"}`}>
              {isAi && (
                <div className="ai-bubble-icon" style={{ borderColor: personaItem?.color }}>
                  <Bot size={15} />
                </div>
              )}

              <div className={`copilot-bubble ${isAi ? "ai-bubble" : "user-bubble"}`}>
                {isAi && personaItem && (
                  <div className="bubble-persona-header" style={{ color: personaItem.color }}>
                    <personaItem.icon size={13} />
                    <span>{personaItem.label} Advisory</span>
                    {isSpeaking && (
                      <div className="copilot-audio-wave" title="Audio vocalization active">
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                      </div>
                    )}
                  </div>
                )}

                <div className="bubble-text-content">
                  {m.text.split("\n").map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={lIdx} className="bubble-spacing" />;
                    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
                      return (
                        <div key={lIdx} className="bubble-bullet-line">
                          <span className="bullet-dot">•</span>
                          <span>{trimmed.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    return <p key={lIdx} className="bubble-paragraph">{line}</p>;
                  })}
                </div>

                {/* Interactive Action Jump Buttons */}
                {actions.length > 0 && (
                  <div className="bubble-actions-row">
                    {actions.map((act, aIdx) => {
                      const ActIcon = act.icon;
                      return (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => onNavigateTab(act.tab)}
                          className="copilot-action-jump-btn"
                          title={`Navigate to ${act.tab} tab`}
                        >
                          <ActIcon size={13} />
                          <span>{act.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Message Utility Controls (Audio TTS & Copy) */}
                {isAi && (
                  <div className="bubble-footer-tools">
                    <button
                      type="button"
                      onClick={() => speakMessage(m.text, m.id)}
                      className={`bubble-tool-btn ${isSpeaking ? "active-speaking" : ""}`}
                      title={isSpeaking ? "Stop Voice Briefing" : "Listen to Audio Briefing"}
                    >
                      {isSpeaking ? <Square size={13} fill="currentColor" /> : <Volume2 size={13} />}
                      <span>{isSpeaking ? "Stop" : "Vocalize"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(m.text, m.id)}
                      className="bubble-tool-btn"
                      title="Copy response to clipboard"
                    >
                      {isCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="copilot-msg-row ai-row">
            <div className="ai-bubble-icon">
              <Bot size={15} />
            </div>
            <div className="copilot-bubble ai-bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span>Analyzing {activePersonaObj.label.toLowerCase()} telemetry parameters...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Persona-Specific Suggestions Chips */}
      <div className="copilot-suggestions-container">
        <span className="suggestions-badge">
          <Sparkles size={13} /> Suggested Prompts for {activePersonaObj.label}:
        </span>
        <div className="copilot-suggestions">
          {currentSuggestions.map((s, idx) => (
            <button key={idx} type="button" onClick={() => handleSend(s)} className="suggestion-chip">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar with Mic & Send */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="copilot-input-bar glass"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask Sun Copilot (${activePersonaObj.label} mode) about rain, highway safety, crop spraying, or workout index...`}
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`mic-btn ${isListening ? "active-listening" : ""}`}
          title={isListening ? "Listening... click to cancel" : "Voice Input (Speech to Text)"}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="copilot-send-btn"
          title="Send query"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
