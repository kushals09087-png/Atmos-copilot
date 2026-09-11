import { MapPin, Navigation, Layers, ExternalLink } from "lucide-react";

export default function WeatherMap({ location, data, onSelectCity }) {
  const lat = Number(location.lat) || 12.9716;
  const lon = Number(location.lon) || 77.5946;

  // OpenStreetMap embed URL with bounding box around the coordinates
  const delta = 0.08;
  const bbox = `${(lon - delta).toFixed(4)}%2C${(lat - delta/1.5).toFixed(4)}%2C${(lon + delta).toFixed(4)}%2C${(lat + delta/1.5).toFixed(4)}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;

  const popularCities = [
    { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
    { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "New York", lat: 40.7128, lon: -74.0060 }
  ];

  return (
    <section id="map" className="map-section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">GEOSPATIAL RADAR</div>
          <h2>Interactive Location & Weather Map</h2>
          <p className="muted">Live map telemetry centered on {location.name || location.area}</p>
        </div>
      </div>

      <div className="map-card glass">
        <div className="map-controls">
          <div className="map-meta">
            <span><MapPin size={15} /> <b>{location.name}</b> ({lat.toFixed(4)}°, {lon.toFixed(4)}°)</span>
            <span><Navigation size={15} /> Wind: {Math.round(data?.current?.wind_speed_10m ?? 0)} km/h</span>
            <span><Layers size={15} /> Pressure: {Math.round(data?.current?.surface_pressure ?? 1013)} hPa</span>
          </div>
          <div className="city-quick-pills swipeable-pills-strip">
            {popularCities.map(c => (
              <button
                key={c.name}
                className={`quick-pill ${location.name === c.name ? "active" : ""}`}
                onClick={() => onSelectCity && onSelectCity(c.lat, c.lon, { name: c.name, area: c.name, country: "" })}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="map-frame-wrapper">
          <iframe
            title="Weather Location Map"
            src={mapSrc}
            className="weather-map-iframe"
            loading="lazy"
          />
        </div>

        <div className="map-footer">
          <small className="muted">OpenStreetMap data © OpenStreetMap contributors</small>
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-map-link"
          >
            Open in Full Screen <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
