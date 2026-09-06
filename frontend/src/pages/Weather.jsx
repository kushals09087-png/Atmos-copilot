import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import CurrentWeather from "../components/CurrentWeather";
import HourlyForecast from "../components/HourlyForecast";
import SevenDayForecast from "../components/SevenDayForecast";
import AirQuality from "../components/AirQuality";
import WeatherMap from "../components/WeatherMap";
import AIChat from "../components/AIChat";
import { weatherApi } from "../services/api";
import { backgroundClass } from "../utils/weather";

const DEFAULT = { lat: 12.9716, lon: 77.5946, name: "Bengaluru", area: "Bengaluru", state: "Karnataka", country: "India" };

export default function Weather() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("atmos_last_weather");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.location?.lat) return parsed.location;
      }
    } catch {}
    return DEFAULT;
  });

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("atmos_last_weather");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data?.current) return parsed.data;
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(!data);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const routeLocation = useLocation();

  async function load(lat, lon, place = null) {
    setLoading(true);
    setError("");
    try {
      const [forecast, reverse] = await Promise.all([
        weatherApi.forecast(lat, lon),
        place ? Promise.resolve(place) : weatherApi.reverse(lat, lon).catch(() => ({ name: "Custom Location", area: "" }))
      ]);
      const resolvedLoc = { lat, lon, ...(reverse || {}) };
      setData(forecast);
      setLocation(resolvedLoc);
      try {
        localStorage.setItem("atmos_last_weather", JSON.stringify({ location: resolvedLoc, data: forecast }));
      } catch {}
    } catch (e) {
      setError(e.message || "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!data) {
      load(location.lat || DEFAULT.lat, location.lon || DEFAULT.lon, location);
    }
  }, []);

  useEffect(() => {
    if (routeLocation.hash === "#map") {
      setTimeout(() => {
        const el = document.getElementById("map");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [routeLocation.hash]);

  function locate() {
    setLocating(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => {
        setLocating(false);
        load(p.coords.latitude, p.coords.longitude);
      },
      e => {
        setLocating(false);
        setError("Location permission was denied. Search for your city instead.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function search(q) {
    setLoading(true);
    setError("");
    try {
      const result = await weatherApi.search(q);
      if (!result.results?.length) throw new Error("Location not found.");
      const x = result.results[0];
      await load(x.latitude, x.longitude, {
        lat: x.latitude,
        lon: x.longitude,
        name: x.name,
        area: x.name,
        state: x.admin1,
        country: x.country
      });
    } catch (e) {
      setLoading(false);
      setError(e.message || "Location search failed");
    }
  }

  const bg = data?.current ? backgroundClass(data.current.weather_code, data.current.is_day === 1) : "weather-clear";

  return (
    <div className={`weather-page ${bg}`}>
      <div className="weather-container">
        <div className="weather-top">
          <div>
            <div className="eyebrow">ATMOS COPILOT / WEATHER</div>
            <h1>{location.area || location.name}</h1>
            <p className="location-line">
              📍 {location.name}{location.state ? `, ${location.state}` : ""}{location.country ? `, ${location.country}` : ""}
            </p>
          </div>
          <div className="coordinates">
            {Number(location.lat).toFixed(4)}° N · {Number(location.lon).toFixed(4)}° E
          </div>
        </div>

        <SearchBar onSearch={search} onLocate={locate} loading={loading || locating} />
        {error && <div className="error-box">{error}</div>}

        {loading && !data ? (
          <div className="loading-screen">
            <div className="loader" />
            Loading atmospheric data...
          </div>
        ) : (
          data && (
            <>
              <CurrentWeather data={data} />
              <HourlyForecast data={data} />
              <SevenDayForecast data={data} />
              <AirQuality data={data.airQuality} />
              <WeatherMap location={location} data={data} onSelectCity={(lat, lon, place) => load(lat, lon, place)} />
              <AIChat
                weatherContext={{
                  location,
                  weather: data.current,
                  daily: data.daily,
                  airQuality: data.airQuality?.current
                }}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}
