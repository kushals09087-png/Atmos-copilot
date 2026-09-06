import { Droplets, Wind, Gauge, Eye, Sunrise, Sunset } from "lucide-react";
import { weatherLabel } from "../utils/weather";

export default function CurrentWeather({ data }) {
  const [label, icon] = weatherLabel(data?.current?.weather_code ?? 0);
  const temp = Math.round(data?.current?.temperature_2m ?? 0);
  const feelsLike = Math.round(data?.current?.apparent_temperature ?? temp);
  const sunrise = data?.daily?.sunrise?.[0]?.slice(11, 16) || "--:--";
  const sunset = data?.daily?.sunset?.[0]?.slice(11, 16) || "--:--";

  return (
    <section className="current-grid">
      <div className="hero-weather glass">
        <div className="eyebrow">CURRENT CONDITIONS</div>
        <div className="weather-icon">{icon}</div>
        <div className="temperature">{temp}°</div>
        <h2>{label}</h2>
        <p className="muted">Feels like {feelsLike}°</p>
        <div className="updated">Updated {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
      </div>

      <div className="stats-grid">
        <Stat icon={<Droplets/>} title="Humidity" value={`${data?.current?.relative_humidity_2m ?? "--"}%`} />
        <Stat icon={<Wind/>} title="Wind" value={`${Math.round(data?.current?.wind_speed_10m ?? 0)} km/h`} />
        <Stat icon={<Gauge/>} title="Pressure" value={`${Math.round(data?.current?.surface_pressure ?? 1013)} hPa`} />
        <Stat icon={<Eye/>} title="Visibility" value={`${((data?.current?.visibility ?? 10000)/1000).toFixed(1)} km`} />
        <Stat icon={<Sunrise/>} title="Sunrise" value={sunrise} />
        <Stat icon={<Sunset/>} title="Sunset" value={sunset} />
      </div>
    </section>
  );
}

function Stat({icon,title,value}) {
  return (
    <div className="stat glass">
      <div className="stat-icon">{icon}</div>
      <div><span>{title}</span><strong>{value}</strong></div>
    </div>
  );
}
