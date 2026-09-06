import { useState, useEffect } from "react";
import { Sparkles, Send, MapPin, Activity } from "lucide-react";
import { aiApi, weatherApi } from "../services/api";

const DEFAULT_LOC = { lat: 12.9716, lon: 77.5946, name: "Bengaluru" };

export default function AI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [weatherContext, setWeatherContext] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("atmos_last_weather");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data?.current) {
          setWeatherContext({
            location: parsed.location || DEFAULT_LOC,
            weather: parsed.data.current,
            daily: parsed.data.daily,
            airQuality: parsed.data.airQuality?.current
          });
          return;
        }
      }
    } catch {}

    // Fallback: fetch default weather context
    weatherApi.forecast(DEFAULT_LOC.lat, DEFAULT_LOC.lon)
      .then(data => {
        setWeatherContext({
          location: DEFAULT_LOC,
          weather: data.current,
          daily: data.daily,
          airQuality: data.airQuality?.current
        });
      })
      .catch(() => {});
  }, []);

  async function send(text = input) {
    if (!text.trim() || busy) return;
    const query = text.trim();
    setMessages(m => [...m, { role: "user", text: query }]);
    setInput("");
    setBusy(true);
    try {
      const r = await aiApi.ask(query, weatherContext);
      setMessages(m => [...m, { role: "assistant", text: r.answer }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: e.message || "Could not retrieve AI response." }]);
    } finally {
      setBusy(false);
    }
  }

  const currentLocName = weatherContext?.location?.name || weatherContext?.location?.area || "Bengaluru";
  const currentTemp = weatherContext?.weather?.temperature_2m ? `${Math.round(weatherContext.weather.temperature_2m)}°C` : null;

  return (
    <div className="ai-page">
      <div className="ai-page-inner">
        <div className="ai-title">
          <div className="ai-avatar big"><Sparkles /></div>
          <div>
            <div className="eyebrow">ATMOS INTELLIGENCE</div>
            <h1>Your weather copilot.</h1>
            <p>Ask questions in natural language. Get grounded, concise meteorological answers.</p>
            {currentTemp && (
              <div className="ai-telemetry-pill">
                <span><MapPin size={13} /> {currentLocName}</span>
                <span><Activity size={13} /> {currentTemp}</span>
                <span className="live-tag">Live telemetry attached</span>
              </div>
            )}
          </div>
        </div>

        <div className="large-chat glass">
          <div className="chat-messages large">
            {messages.length === 0 && (
              <div className="empty-ai">
                <Sparkles size={35} />
                <h2>What would you like to know?</h2>
                <p>Try asking about precipitation, travel suitability, agricultural impact, or air quality.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <span>{m.text}</span>
              </div>
            ))}
            {busy && (
              <div className="message assistant">
                <span className="typing">Analyzing meteorological telemetry...</span>
              </div>
            )}
          </div>

          <div className="suggestions">
            {[
              "Will it rain today?",
              "What is tomorrow's weather?",
              "Is the air quality good?",
              "Is today good for travel?",
              "What should a farmer know today?"
            ].map(x => (
              <button key={x} onClick={() => send(x)}>{x}</button>
            ))}
          </div>

          <form className="chat-input" onSubmit={e => { e.preventDefault(); send(); }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Atmos anything about current or forecast weather..."
            />
            <button type="submit" aria-label="Send query"><Send size={18} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
