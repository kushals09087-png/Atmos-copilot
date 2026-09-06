const forecastURL = "https://api.open-meteo.com/v1/forecast";
const airURL = "https://air-quality-api.open-meteo.com/v1/air-quality";

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Weather provider returned ${r.status}`);
  return r.json();
}

export async function getWeather(lat, lon) {
  const forecastParams = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: "auto",
    forecast_days: "7",
    current: [
      "temperature_2m","relative_humidity_2m","apparent_temperature",
      "is_day","precipitation","rain","weather_code","cloud_cover",
      "surface_pressure","wind_speed_10m","wind_direction_10m","visibility"
    ].join(","),
    hourly: [
      "temperature_2m","precipitation_probability","precipitation",
      "weather_code","wind_speed_10m","relative_humidity_2m"
    ].join(","),
    daily: [
      "weather_code","temperature_2m_max","temperature_2m_min",
      "precipitation_sum","precipitation_probability_max",
      "wind_speed_10m_max","sunrise","sunset","uv_index_max"
    ].join(",")
  });

  const airParams = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: "auto",
    forecast_days: "1",
    current: ["european_aqi","pm2_5","pm10","ozone","nitrogen_dioxide","sulphur_dioxide","carbon_monoxide"].join(",")
  });

  const [weather, airQuality] = await Promise.all([
    json(`${forecastURL}?${forecastParams}`),
    json(`${airURL}?${airParams}`)
  ]);

  return { ...weather, airQuality };
}
