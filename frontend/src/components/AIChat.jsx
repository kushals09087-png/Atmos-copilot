import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { aiApi } from "../services/api";

export default function AIChat({ weatherContext }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello. I’m Atmos AI. Ask me about your current weather, rain chances, travel conditions, air quality, or the forecast." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text = input) {
    if (!text.trim() || busy) return;
    const user = text.trim();
    setInput("");
    setMessages(m => [...m, { role:"user", text:user }]);
    setBusy(true);
    try {
      const result = await aiApi.ask(user, weatherContext);
      setMessages(m => [...m, { role:"assistant", text:result.answer }]);
    } catch (e) {
      setMessages(m => [...m, { role:"assistant", text:e.message || "AI service is unavailable right now." }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="ai-card glass">
      <div className="ai-header">
        <div className="ai-avatar"><Sparkles size={20}/></div>
        <div><h2>Atmos AI</h2><span>Weather intelligence copilot</span></div>
      </div>
      <div className="chat-messages">
        {messages.map((m,i) => <div key={i} className={`message ${m.role}`}><span>{m.text}</span></div>)}
        {busy && <div className="message assistant"><span className="typing">Thinking...</span></div>}
      </div>
      <div className="suggestions">
        {["Will it rain today?", "Is the air quality good?", "Explain tomorrow's weather"].map(s =>
          <button key={s} onClick={() => send(s)}>{s}</button>
        )}
      </div>
      <form className="chat-input" onSubmit={e => {e.preventDefault();send();}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Atmos AI anything about weather..." />
        <button><Send size={18}/></button>
      </form>
    </div>
  );
}
