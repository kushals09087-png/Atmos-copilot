import { weatherLabel } from "../utils/weather";

export default function HourlyForecast({ data }) {
  const now = new Date();
  let start = 0;
  for (let i=0; i<data.hourly.time.length; i++) {
    if (new Date(data.hourly.time[i]) >= now) { start = i; break; }
  }

  return (
    <section>
      <div className="section-heading">
        <div><div className="eyebrow">HOURLY</div><h2>Next 12 hours</h2></div>
      </div>
      <div className="hourly-scroll">
        {data.hourly.time.slice(start, start + 12).map((time, j) => {
          const i = start + j;
          const [, icon] = weatherLabel(data.hourly.weather_code[i]);
          return (
            <div className="hour-card glass" key={time}>
              <span>{j === 0 ? "Now" : new Date(time).toLocaleTimeString("en-IN",{hour:"numeric"})}</span>
              <b>{icon}</b>
              <strong>{Math.round(data.hourly.temperature_2m[i])}°</strong>
              <small>{data.hourly.precipitation_probability[i] ?? 0}% rain</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
