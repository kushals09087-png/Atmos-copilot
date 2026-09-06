export default function AirQuality({ data }) {
  const current = data?.current || {};
  const aqi = Math.round(current.european_aqi ?? 0);
  const level = aqi <= 20 ? "Good" : aqi <= 40 ? "Fair" : aqi <= 60 ? "Moderate" : aqi <= 80 ? "Poor" : "Very poor";

  return (
    <section className="aqi-section">
      <div className="aqi-main glass">
        <div>
          <div className="eyebrow">AIR QUALITY</div>
          <h2>Air Quality Index</h2>
          <p className="muted">European AQI scale</p>
        </div>
        <div className="aqi-score">
          <strong>{aqi}</strong>
          <span>{level}</span>
        </div>
      </div>
      <div className="pollutants">
        <Pollution title="PM2.5" value={current.pm2_5} unit="μg/m³"/>
        <Pollution title="PM10" value={current.pm10} unit="μg/m³"/>
        <Pollution title="O₃" value={current.ozone} unit="μg/m³"/>
        <Pollution title="NO₂" value={current.nitrogen_dioxide} unit="μg/m³"/>
      </div>
    </section>
  );
}

function Pollution({title,value,unit}) {
  return (
    <div className="pollution glass">
      <span>{title}</span>
      <strong>{Number(value ?? 0).toFixed(1)}</strong>
      <small>{unit}</small>
    </div>
  );
}
