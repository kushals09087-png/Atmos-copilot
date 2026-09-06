export function weatherLabel(code) {
  const map = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "🌨️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Heavy rain showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm + hail", "⛈️"],
    99: ["Severe thunderstorm", "⛈️"]
  };
  return map[code] || ["Unknown", "🌤️"];
}

export function backgroundClass(code, isDay = true) {
  if (!isDay) return "weather-night";
  if (code >= 95) return "weather-storm";
  if (code >= 51 && code <= 82) return "weather-rain";
  if (code >= 45 && code <= 48) return "weather-fog";
  if (code >= 1 && code <= 3) return "weather-cloud";
  return "weather-clear";
}

export function formatDay(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
}
