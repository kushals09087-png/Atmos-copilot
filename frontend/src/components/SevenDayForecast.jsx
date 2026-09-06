import { weatherLabel, formatDay } from "../utils/weather";

export default function SevenDayForecast({ data }) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">FORECAST</div>
          <h2>Next 7 days</h2>
        </div>
      </div>

      <div className="forecast-grid">
        {data.daily.time.map((date, i) => {
          const [label, icon] = weatherLabel(data.daily.weather_code[i]);
          return (
            <article className={`forecast-card glass ${i === 0 ? "today" : ""}`} key={date}>
              <span className="forecast-day">{i === 0 ? "Today" : formatDay(date)}</span>
              <span className="forecast-icon">{icon}</span>
              <strong>{Math.round(data.daily.temperature_2m_max[i])}°</strong>
              <span className="forecast-low">{Math.round(data.daily.temperature_2m_min[i])}°</span>
              <span className="forecast-rain">💧 {data.daily.precipitation_probability_max[i] ?? 0}%</span>
              <small>{label}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
