import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Mic, MicOff, Send, Sun, Bot } from "lucide-react";
import { askAiAssistant } from "../../utils/telemetryData";

export default function SunCopilotTab({ coords, weather, onQueryLogged }) {
  const [messages, setMessages] = useState(() => {
    return [
      {
        sender: "ai",
        text: "Hello! I am Sun Copilot, your hyper-local meteorological intelligence core. How can I assist you with today’s atmospheric conditions?"
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || isLoading) return;
    const cleanText = queryText.trim();
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text: cleanText }]);
    setIsLoading(true);

    // Save query to history
    const now = new Date();
    const historyItem = {
      query: cleanText,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      location: weather?.resolved_city || "Current Coordinates"
    };

    try {
      const saved = localStorage.getItem("atmos_search_history");
      const list = saved ? JSON.parse(saved) : [];
      const updated = [historyItem, ...list.slice(0, 49)];
      localStorage.setItem("atmos_search_history", JSON.stringify(updated));
      if (onQueryLogged) onQueryLogged(updated);
    } catch {}

    try {
      const reply = await askAiAssistant(cleanText, coords?.lat, coords?.lon, weather);
      setMessages(prev => [...prev, { sender: "ai", text: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "Meteorological telemetry link error. Re-synthesizing station parameters..." }
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

  const suggestions = [
    "Will it rain today?",
    "What is the wind speed and direction?",
    "Is it suitable for outdoor travel?",
    "What is the UV index risk right now?",
    "Give me the 7-day forecast summary"
  ];

  return (
    <div className="copilot-container">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div className={`copilot-avatar-orb ${isListening ? "listening-pulse" : ""}`}>
          <Sun size={28} className="copilot-sun-icon" />
          <Sparkles size={16} className="copilot-sparkle" />
        </div>
        <h2>Sun Copilot Intelligence</h2>
        <p>Voice-First Multilingual Meteorological Assistant grounded in verified telemetry.</p>
      </div>

      {/* Messages Feed */}
      <div className="copilot-messages glass">
        {messages.map((m, idx) => (
          <div key={idx} className={`copilot-msg-row ${m.sender === "user" ? "user-row" : "ai-row"}`}>
            {m.sender === "ai" && (
              <div className="ai-bubble-icon">
                <Bot size={15} />
              </div>
            )}
            <div className={`copilot-bubble ${m.sender === "user" ? "user-bubble" : "ai-bubble"}`}>
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="copilot-msg-row ai-row">
            <div className="ai-bubble-icon">
              <Bot size={15} />
            </div>
            <div className="copilot-bubble ai-bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span>Analyzing telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Chips */}
      <div className="copilot-suggestions">
        {suggestions.map((s, idx) => (
          <button key={idx} type="button" onClick={() => handleSend(s)} className="suggestion-chip">
            {s}
          </button>
        ))}
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
          placeholder="Ask about precipitation, surface wind vectors, temperature, or travel safety..."
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

        <button type="submit" disabled={!input.trim() || isLoading} className="copilot-send-btn" title="Send query">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
