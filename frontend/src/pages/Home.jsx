import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="home-page">
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="pill"><span className="pulse-dot"/> LIVE METEOROLOGICAL INTELLIGENCE</div>
          <h1>Weather, understood.<br/><em>Decisions, smarter.</em></h1>
          <p>Atmos Copilot turns real-time weather, forecasts and air-quality data into clear, conversational intelligence.</p>
          <div className="hero-actions">
            <Link className="btn" to="/weather">Explore Weather <ArrowRight size={18}/></Link>
            <Link className="btn ghost" to="/ai"><Sparkles size={17}/> Talk to Atmos AI</Link>
          </div>
          <div className="trust-row">
            <span><MapPin size={15}/> Location-aware</span>
            <span><Activity size={15}/> Real-time data</span>
            <span><ShieldCheck size={15}/> Decision support</span>
          </div>
        </div>
        <div className="orb-scene">
          <div className="sun-orb">☀️</div>
          <div className="orbit orbit-one"/>
          <div className="orbit orbit-two"/>
          <div className="mini-card card-a">🌧️ <span>Rain probability<br/><b>68%</b></span></div>
          <div className="mini-card card-b">💨 <span>Wind<br/><b>14 km/h</b></span></div>
          <div className="mini-card card-c">🌿 <span>Air quality<br/><b>Good</b></span></div>
        </div>
      </section>

      <section className="feature-section">
        <div className="eyebrow">ONE COPILOT. MANY SIGNALS.</div>
        <h2>From raw weather data to useful decisions.</h2>
        <div className="feature-grid">
          <Feature icon="🌦️" title="Live Weather" text="Current conditions, hourly details and a 7-day forecast."/>
          <Feature icon="🤖" title="AI Intelligence" text="Ask natural-language questions and receive grounded weather answers."/>
          <Feature icon="📍" title="Exact Location" text="Use GPS to identify your area and city automatically."/>
          <Feature icon="🌿" title="Air Quality" text="Track AQI and key pollutants alongside your weather."/>
        </div>
      </section>
    </div>
  );
}
function Feature({icon,title,text}) {
  return <article className="feature-card glass"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>;
}
